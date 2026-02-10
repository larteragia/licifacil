-- =============================================================================
-- Migration 002: Busca Full-Text e Sistema de Alertas
-- Data: 2026-02-10
-- Descrição: Adiciona busca full-text com pg_trgm e sistema de alertas
-- =============================================================================

-- -----------------------------------------------------------------------------
-- BUSCA FULL-TEXT (Task 2.1)
-- -----------------------------------------------------------------------------

-- Habilitar extensão pg_trgm para similarity search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Índices GIN para busca trigram (já criados na migration 001, mas garantindo)
CREATE INDEX IF NOT EXISTS idx_bids_objeto_trgm ON public.bids USING gin (objeto gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_bids_orgao_trgm ON public.bids USING gin (orgao gin_trgm_ops);

-- Adicionar coluna de busca vetorizada (full-text search)
ALTER TABLE public.bids ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('portuguese', coalesce(objeto, '')), 'A') ||
    setweight(to_tsvector('portuguese', coalesce(orgao, '')), 'B') ||
    setweight(to_tsvector('portuguese', coalesce(numero_edital, '')), 'C')
  ) STORED;

-- Índice GIN para busca full-text
CREATE INDEX IF NOT EXISTS idx_bids_search_vector ON public.bids USING GIN(search_vector);

-- Função helper para busca com ranking
CREATE OR REPLACE FUNCTION search_bids(
  search_query TEXT,
  limit_count INT DEFAULT 50,
  offset_count INT DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  portal TEXT,
  numero_edital TEXT,
  orgao TEXT,
  objeto TEXT,
  modalidade TEXT,
  valor_estimado NUMERIC,
  data_abertura TIMESTAMPTZ,
  uf TEXT,
  municipio TEXT,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id,
    b.portal,
    b.numero_edital,
    b.orgao,
    b.objeto,
    b.modalidade,
    b.valor_estimado,
    b.data_abertura,
    b.uf,
    b.municipio,
    ts_rank(b.search_vector, to_tsquery('portuguese', search_query)) AS rank
  FROM public.bids b
  WHERE b.search_vector @@ to_tsquery('portuguese', search_query)
  ORDER BY rank DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- SISTEMA DE ALERTAS (Task 2.4)
-- -----------------------------------------------------------------------------

-- Tabela de alertas (já criada na migration 001, mas expandindo)
-- DROP TABLE IF EXISTS public.alerts CASCADE; -- Já existe, não dropar

-- Adicionar campos faltantes se não existirem
DO $$ 
BEGIN
  -- Verificar se coluna já existe antes de adicionar
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='alerts' AND column_name='last_check') THEN
    ALTER TABLE public.alerts ADD COLUMN last_check TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='alerts' AND column_name='match_count') THEN
    ALTER TABLE public.alerts ADD COLUMN match_count INT DEFAULT 0;
  END IF;
END $$;

-- Tabela de notificações enviadas (Task 2.4)
-- (Renomear alert_logs para alert_notifications para consistência)
-- A tabela alert_logs já existe da migration 001

-- Criar view para facilitar queries de alertas com detalhes do usuário
CREATE OR REPLACE VIEW alerts_with_user AS
SELECT 
  a.id,
  a.user_id,
  a.name,
  a.filters,
  a.active,
  a.email_enabled,
  a.whatsapp_enabled,
  a.created_at,
  a.updated_at,
  a.last_check,
  a.match_count,
  p.full_name as user_name,
  (SELECT email FROM auth.users WHERE id = a.user_id) as user_email
FROM public.alerts a
JOIN public.profiles p ON a.user_id = p.id;

-- -----------------------------------------------------------------------------
-- FUNÇÕES PARA VERIFICAÇÃO DE ALERTAS (Task 2.6)
-- -----------------------------------------------------------------------------

-- Função para verificar se um edital corresponde aos filtros de um alerta
CREATE OR REPLACE FUNCTION bid_matches_alert(
  bid_id UUID,
  alert_filters JSONB
)
RETURNS BOOLEAN AS $$
DECLARE
  bid_record RECORD;
  keywords TEXT[];
  estados TEXT[];
  modalidades TEXT[];
  valor_min NUMERIC;
  valor_max NUMERIC;
  match BOOLEAN := TRUE;
BEGIN
  -- Buscar edital
  SELECT * INTO bid_record FROM public.bids WHERE id = bid_id;
  
  -- Extrair filtros do JSON
  keywords := ARRAY(SELECT jsonb_array_elements_text(alert_filters->'keywords'));
  estados := ARRAY(SELECT jsonb_array_elements_text(alert_filters->'estados'));
  modalidades := ARRAY(SELECT jsonb_array_elements_text(alert_filters->'modalidades'));
  valor_min := (alert_filters->>'valorMin')::NUMERIC;
  valor_max := (alert_filters->>'valorMax')::NUMERIC;
  
  -- Verificar palavras-chave
  IF keywords IS NOT NULL AND array_length(keywords, 1) > 0 THEN
    match := match AND (
      bid_record.objeto ILIKE ANY(SELECT '%' || unnest(keywords) || '%')
    );
  END IF;
  
  -- Verificar estados
  IF estados IS NOT NULL AND array_length(estados, 1) > 0 THEN
    match := match AND bid_record.uf = ANY(estados);
  END IF;
  
  -- Verificar modalidades
  IF modalidades IS NOT NULL AND array_length(modalidades, 1) > 0 THEN
    match := match AND bid_record.modalidade = ANY(modalidades);
  END IF;
  
  -- Verificar valor mínimo
  IF valor_min IS NOT NULL THEN
    match := match AND bid_record.valor_estimado >= valor_min;
  END IF;
  
  -- Verificar valor máximo
  IF valor_max IS NOT NULL THEN
    match := match AND bid_record.valor_estimado <= valor_max;
  END IF;
  
  RETURN match;
END;
$$ LANGUAGE plpgsql;

-- Função para encontrar editais que correspondem a um alerta
CREATE OR REPLACE FUNCTION find_bids_for_alert(
  alert_id_param UUID,
  since_timestamp TIMESTAMPTZ DEFAULT NOW() - INTERVAL '6 hours'
)
RETURNS TABLE (
  bid_id UUID,
  portal TEXT,
  numero_edital TEXT,
  orgao TEXT,
  objeto TEXT,
  valor_estimado NUMERIC,
  data_abertura TIMESTAMPTZ
) AS $$
DECLARE
  alert_record RECORD;
BEGIN
  -- Buscar alerta
  SELECT * INTO alert_record FROM public.alerts WHERE id = alert_id_param;
  
  -- Buscar editais novos que correspondem aos filtros
  RETURN QUERY
  SELECT 
    b.id,
    b.portal,
    b.numero_edital,
    b.orgao,
    b.objeto,
    b.valor_estimado,
    b.data_abertura
  FROM public.bids b
  WHERE b.created_at >= since_timestamp
    AND NOT EXISTS (
      -- Não retornar editais já notificados
      SELECT 1 FROM public.alert_logs al
      WHERE al.alert_id = alert_id_param
        AND al.bid_id = b.id
        AND al.status = 'sent'
    )
    AND bid_matches_alert(b.id, alert_record.filters)
  ORDER BY b.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- ÍNDICES ADICIONAIS PARA PERFORMANCE
-- -----------------------------------------------------------------------------

-- Índice para busca de alertas ativos por usuário
CREATE INDEX IF NOT EXISTS idx_alerts_user_active ON public.alerts(user_id, active) WHERE active = true;

-- Índice para busca de editais recentes
CREATE INDEX IF NOT EXISTS idx_bids_created_at_desc ON public.bids(created_at DESC);

-- Índice para verificação de notificações duplicadas
CREATE INDEX IF NOT EXISTS idx_alert_logs_alert_bid ON public.alert_logs(alert_id, bid_id);

-- =============================================================================
-- FIM DA MIGRATION 002
-- =============================================================================
