-- =============================================================================
-- Migration 004: Robô de Lance + IA/RAG + Gestão Documental + Dashboard
-- Data: 2026-02-10
-- Descrição: Schemas essenciais para Etapas 04, 05, 06, 07
-- =============================================================================

-- -----------------------------------------------------------------------------
-- ETAPA 04: ROBÔ DE LANCE
-- -----------------------------------------------------------------------------

-- Configurações do robô por pregão
CREATE TABLE IF NOT EXISTS public.robo_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auction_id UUID REFERENCES public.monitored_auctions(id) ON DELETE CASCADE NOT NULL UNIQUE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Configurações
  enabled BOOLEAN DEFAULT false,
  strategy TEXT DEFAULT 'conservadora', -- agressiva, conservadora, incremental
  valor_minimo NUMERIC NOT NULL,
  valor_maximo NUMERIC NOT NULL,
  decremento_percentual NUMERIC DEFAULT 0.5,
  decremento_fixo NUMERIC,
  tempo_restante_min INT DEFAULT 60, -- segundos
  
  -- Limites de segurança
  max_lances_por_item INT DEFAULT 10,
  lances_dados INT DEFAULT 0,
  
  -- Metadados
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.robo_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own robo configs"
  ON public.robo_configs FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Log de decisões do robô
CREATE TABLE IF NOT EXISTS public.robo_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  robo_config_id UUID REFERENCES public.robo_configs(id) ON DELETE CASCADE NOT NULL,
  
  -- Contexto da decisão
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  melhor_lance NUMERIC NOT NULL,
  meu_lance_anterior NUMERIC,
  minha_posicao INT,
  tempo_restante INT,
  
  -- Decisão
  should_bid BOOLEAN NOT NULL,
  suggested_value NUMERIC,
  reason TEXT NOT NULL,
  
  -- Resultado
  bid_executed BOOLEAN DEFAULT false,
  execution_error TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.robo_decisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own robo decisions"
  ON public.robo_decisions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.robo_configs rc
      WHERE rc.id = robo_decisions.robo_config_id
        AND rc.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_robo_decisions_config ON public.robo_decisions(robo_config_id);

-- -----------------------------------------------------------------------------
-- ETAPA 05: IA E RAG JURÍDICO
-- -----------------------------------------------------------------------------

-- Documentos jurídicos indexados (Lei 14.133/2021, etc.)
CREATE TABLE IF NOT EXISTS public.legal_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Metadados do documento
  title TEXT NOT NULL,
  type TEXT NOT NULL, -- lei, instrucao_normativa, acordao_tcu, orientacao_agu
  number TEXT,
  year INT,
  
  -- Conteúdo
  full_text TEXT NOT NULL,
  summary TEXT,
  
  -- Embedding para RAG (TODO: habilitar pgvector extension)
  -- embedding vector(1536), -- OpenAI ada-002 ou similar
  embedding_text TEXT, -- Placeholder até pgvector ser habilitado
  
  -- Metadados
  source_url TEXT,
  published_at DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_legal_documents_type ON public.legal_documents(type);
-- CREATE INDEX IF NOT EXISTS idx_legal_documents_embedding ON public.legal_documents USING ivfflat (embedding vector_cosine_ops);
-- Nota: índice ivfflat requer extensão pgvector, comentado para evitar erro

-- Chunks de documentos (para RAG)
CREATE TABLE IF NOT EXISTS public.document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES public.legal_documents(id) ON DELETE CASCADE NOT NULL,
  
  -- Chunk
  chunk_index INT NOT NULL,
  content TEXT NOT NULL,
  -- embedding vector(1536), -- TODO: habilitar pgvector
  embedding_text TEXT, -- Placeholder
  
  -- Metadados
  metadata JSONB, -- { "artigo": "123", "paragrafo": "1", "inciso": "II" }
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(document_id, chunk_index)
);

-- Histórico de perguntas ao chatbot jurídico
CREATE TABLE IF NOT EXISTS public.rag_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Query
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  sources JSONB, -- Array de chunks usados como contexto
  
  -- Metadados
  model TEXT DEFAULT 'claude-3-5-sonnet',
  tokens_used INT,
  latency_ms INT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.rag_queries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own rag queries"
  ON public.rag_queries FOR SELECT
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_rag_queries_user ON public.rag_queries(user_id);

-- -----------------------------------------------------------------------------
-- ETAPA 06: GESTÃO DOCUMENTAL
-- -----------------------------------------------------------------------------

-- Documentos de habilitação
CREATE TABLE IF NOT EXISTS public.habilitacao_docs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Tipo de documento
  type TEXT NOT NULL, -- certidao_negativa_federal, certidao_cndt, certidao_fgts, etc.
  name TEXT NOT NULL,
  
  -- Arquivo
  file_path TEXT, -- Path no Supabase Storage
  file_url TEXT,
  file_size INT,
  file_type TEXT,
  
  -- Validade
  expires_at DATE,
  is_valid BOOLEAN DEFAULT true,
  
  -- Metadados
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.habilitacao_docs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their company docs"
  ON public.habilitacao_docs FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_habilitacao_docs_company ON public.habilitacao_docs(company_id);
CREATE INDEX IF NOT EXISTS idx_habilitacao_docs_expires ON public.habilitacao_docs(expires_at) WHERE is_valid = true;

-- Checklist de documentos por edital
CREATE TABLE IF NOT EXISTS public.edital_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bid_id UUID REFERENCES public.bids(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Items do checklist (gerado por IA)
  items JSONB NOT NULL, -- Array de { "tipo": "certidao_federal", "obrigatorio": true, "anexado": false, "doc_id": null }
  
  -- Status
  progress_percentage INT DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(bid_id, user_id)
);

ALTER TABLE public.edital_checklists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own checklists"
  ON public.edital_checklists FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- ETAPA 07: DASHBOARD E RELATÓRIOS
-- -----------------------------------------------------------------------------

-- Estatísticas agregadas (cache)
CREATE TABLE IF NOT EXISTS public.user_stats (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Métricas
  total_bids_watched INT DEFAULT 0,
  total_bids_participated INT DEFAULT 0,
  total_won INT DEFAULT 0,
  total_lost INT DEFAULT 0,
  win_rate NUMERIC(5,2) DEFAULT 0,
  
  -- Valores
  total_value_won NUMERIC DEFAULT 0,
  total_value_saved NUMERIC DEFAULT 0,
  avg_discount_percentage NUMERIC(5,2) DEFAULT 0,
  
  -- Alertas
  total_alerts_sent INT DEFAULT 0,
  
  -- Atualização
  last_calculated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own stats"
  ON public.user_stats FOR SELECT
  USING (auth.uid() = user_id);

-- Função para recalcular estatísticas
CREATE OR REPLACE FUNCTION recalculate_user_stats(target_user_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.user_stats (
    user_id,
    total_bids_watched,
    total_bids_participated,
    total_won,
    last_calculated_at
  )
  SELECT 
    target_user_id,
    COUNT(DISTINCT ma.id) as total_bids_watched,
    COUNT(DISTINCT CASE WHEN lh.is_mine THEN ma.id END) as total_bids_participated,
    COUNT(DISTINCT c.id) as total_won,
    NOW()
  FROM public.monitored_auctions ma
  LEFT JOIN public.lance_history lh ON lh.auction_id = ma.id
  LEFT JOIN public.contemplations c ON c.auction_id = ma.id
  WHERE ma.user_id = target_user_id
  ON CONFLICT (user_id) DO UPDATE SET
    total_bids_watched = EXCLUDED.total_bids_watched,
    total_bids_participated = EXCLUDED.total_bids_participated,
    total_won = EXCLUDED.total_won,
    last_calculated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- ETAPA 08: MONETIZAÇÃO
-- =============================================================================

-- Planos e assinaturas (Stripe)
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Stripe
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  
  -- Plano
  plan TEXT NOT NULL DEFAULT 'free', -- free, starter, pro, enterprise
  status TEXT DEFAULT 'active', -- active, canceled, past_due, trialing
  
  -- Período
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  
  -- Trial
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscription"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Usage tracking (limites por plano)
CREATE TABLE IF NOT EXISTS public.usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Feature
  feature TEXT NOT NULL, -- alertas, robo_lances, rag_queries, monitored_auctions
  count INT DEFAULT 0,
  
  -- Período
  period_start DATE DEFAULT date_trunc('month', NOW()),
  period_end DATE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, feature, period_start)
);

ALTER TABLE public.usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own usage"
  ON public.usage FOR SELECT
  USING (auth.uid() = user_id);

-- Função para verificar limites do plano
CREATE OR REPLACE FUNCTION check_feature_limit(
  target_user_id UUID,
  feature_name TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  user_plan TEXT;
  current_usage INT;
  plan_limit INT;
BEGIN
  -- Buscar plano do usuário
  SELECT plan INTO user_plan
  FROM public.subscriptions
  WHERE user_id = target_user_id;
  
  -- Se não tem assinatura, é free
  IF user_plan IS NULL THEN
    user_plan := 'free';
  END IF;
  
  -- Buscar uso atual no mês
  SELECT count INTO current_usage
  FROM public.usage
  WHERE user_id = target_user_id
    AND feature = feature_name
    AND period_start = date_trunc('month', NOW());
  
  IF current_usage IS NULL THEN
    current_usage := 0;
  END IF;
  
  -- Definir limites por plano
  plan_limit := CASE 
    WHEN user_plan = 'free' AND feature_name = 'alertas' THEN 3
    WHEN user_plan = 'free' AND feature_name = 'rag_queries' THEN 0
    WHEN user_plan = 'starter' AND feature_name = 'alertas' THEN 10
    WHEN user_plan = 'starter' AND feature_name = 'rag_queries' THEN 10
    WHEN user_plan IN ('pro', 'enterprise') THEN 999999
    ELSE 0
  END;
  
  RETURN current_usage < plan_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- FIM DA MIGRATION 004
-- =============================================================================
