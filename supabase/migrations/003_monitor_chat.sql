-- =============================================================================
-- Migration 003: Monitor de Lances e Chat
-- Data: 2026-02-10
-- Descrição: Tabelas para monitoramento em tempo real de pregões
-- =============================================================================

-- -----------------------------------------------------------------------------
-- PREGÕES MONITORADOS (Task 3.1)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.monitored_auctions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  bid_id UUID REFERENCES public.bids(id) ON DELETE CASCADE,
  
  -- Identificação do pregão
  portal TEXT NOT NULL,
  external_id TEXT NOT NULL,
  numero_pregao TEXT,
  
  -- Estado atual
  status TEXT DEFAULT 'aguardando', -- aguardando, aberto, em_disputa, encerrado, cancelado
  current_position INT,
  best_price NUMERIC,
  my_price NUMERIC,
  
  -- Configurações de monitoramento
  monitor_enabled BOOLEAN DEFAULT true,
  notify_new_bids BOOLEAN DEFAULT true,
  notify_chat BOOLEAN DEFAULT true,
  notify_contemplation BOOLEAN DEFAULT true,
  
  -- Metadados
  last_update TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, portal, external_id)
);

-- RLS: usuários podem monitorar apenas seus próprios pregões
ALTER TABLE public.monitored_auctions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own monitored auctions"
  ON public.monitored_auctions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own monitored auctions"
  ON public.monitored_auctions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own monitored auctions"
  ON public.monitored_auctions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own monitored auctions"
  ON public.monitored_auctions FOR DELETE
  USING (auth.uid() = user_id);

-- Índices
CREATE INDEX IF NOT EXISTS idx_monitored_auctions_user ON public.monitored_auctions(user_id);
CREATE INDEX IF NOT EXISTS idx_monitored_auctions_status ON public.monitored_auctions(status) WHERE monitor_enabled = true;

-- -----------------------------------------------------------------------------
-- HISTÓRICO DE LANCES (Task 3.3)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.lance_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auction_id UUID REFERENCES public.monitored_auctions(id) ON DELETE CASCADE NOT NULL,
  
  -- Dados do lance
  item_numero INT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  empresa TEXT NOT NULL,
  cnpj TEXT,
  valor NUMERIC NOT NULL,
  posicao INT,
  
  -- Metadados
  is_mine BOOLEAN DEFAULT false,
  portal_timestamp TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: usuários podem ver histórico de pregões que monitoram
ALTER TABLE public.lance_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view lance history of their auctions"
  ON public.lance_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.monitored_auctions ma
      WHERE ma.id = lance_history.auction_id
        AND ma.user_id = auth.uid()
    )
  );

-- Índices
CREATE INDEX IF NOT EXISTS idx_lance_history_auction ON public.lance_history(auction_id);
CREATE INDEX IF NOT EXISTS idx_lance_history_timestamp_desc ON public.lance_history(timestamp DESC);

-- -----------------------------------------------------------------------------
-- MENSAGENS DO CHAT (Task 3.4 e 3.5)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auction_id UUID REFERENCES public.monitored_auctions(id) ON DELETE CASCADE NOT NULL,
  
  -- Dados da mensagem
  timestamp TIMESTAMPTZ NOT NULL,
  sender TEXT NOT NULL, -- Pregoeiro, Sistema, Fornecedor X, etc.
  content TEXT NOT NULL,
  
  -- Classificação
  priority TEXT DEFAULT 'low', -- critical, high, medium, low
  is_critical BOOLEAN DEFAULT false,
  mentions_me BOOLEAN DEFAULT false, -- se menciona empresa do usuário
  
  -- Metadados
  read_at TIMESTAMPTZ,
  portal_timestamp TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: usuários podem ver chat de pregões que monitoram
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view chat of their auctions"
  ON public.chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.monitored_auctions ma
      WHERE ma.id = chat_messages.auction_id
        AND ma.user_id = auth.uid()
    )
  );

-- Índices
CREATE INDEX IF NOT EXISTS idx_chat_messages_auction ON public.chat_messages(auction_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_timestamp_desc ON public.chat_messages(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_critical ON public.chat_messages(is_critical, read_at) WHERE is_critical = true AND read_at IS NULL;

-- -----------------------------------------------------------------------------
-- LOG DE CONTEMPLAÇÕES (Task 3.9)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.contemplations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auction_id UUID REFERENCES public.monitored_auctions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Dados da contemplação
  item_numero INT,
  posicao INT,
  valor NUMERIC,
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Mensagem que detectou
  chat_message_id UUID REFERENCES public.chat_messages(id),
  detection_reason TEXT,
  
  -- Status
  notified_email BOOLEAN DEFAULT false,
  notified_whatsapp BOOLEAN DEFAULT false,
  notified_push BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.contemplations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own contemplations"
  ON public.contemplations FOR SELECT
  USING (auth.uid() = user_id);

-- Índices
CREATE INDEX IF NOT EXISTS idx_contemplations_user ON public.contemplations(user_id);
CREATE INDEX IF NOT EXISTS idx_contemplations_auction ON public.contemplations(auction_id);

-- -----------------------------------------------------------------------------
-- HABILITAR REALTIME (Task 3.2)
-- -----------------------------------------------------------------------------

-- Habilitar publicação realtime para tabelas críticas
ALTER PUBLICATION supabase_realtime ADD TABLE public.lance_history;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.monitored_auctions;

-- -----------------------------------------------------------------------------
-- TRIGGERS
-- -----------------------------------------------------------------------------

-- Atualizar updated_at automaticamente
CREATE TRIGGER update_monitored_auctions_updated_at BEFORE UPDATE ON public.monitored_auctions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Detectar contemplação automaticamente ao inserir mensagem crítica
CREATE OR REPLACE FUNCTION auto_detect_contemplation()
RETURNS TRIGGER AS $$
DECLARE
  auction_user_id UUID;
  company_name TEXT;
  contemplation_keywords TEXT[] := ARRAY['contemplad', 'vencedor', 'classificad', 'em primeiro', 'favor enviar'];
  has_keyword BOOLEAN := FALSE;
BEGIN
  -- Só processar se mensagem é crítica ou de prioridade alta
  IF NEW.priority IN ('critical', 'high') THEN
    -- Buscar user_id e nome da empresa do leilão
    SELECT ma.user_id, c.razao_social INTO auction_user_id, company_name
    FROM public.monitored_auctions ma
    JOIN public.companies c ON c.user_id = ma.user_id
    WHERE ma.id = NEW.auction_id
    LIMIT 1;
    
    -- Verificar se há palavra-chave de contemplação
    has_keyword := EXISTS (
      SELECT 1 FROM unnest(contemplation_keywords) AS keyword
      WHERE LOWER(NEW.content) LIKE '%' || keyword || '%'
    );
    
    -- Se menciona empresa E tem palavra-chave, criar contemplação
    IF has_keyword AND LOWER(NEW.content) LIKE '%' || LOWER(company_name) || '%' THEN
      INSERT INTO public.contemplations (
        auction_id,
        user_id,
        chat_message_id,
        detection_reason,
        detected_at
      ) VALUES (
        NEW.auction_id,
        auction_user_id,
        NEW.id,
        'Detecção automática via mensagem do chat',
        NEW.timestamp
      );
      
      -- Marcar mensagem como crítica e que menciona usuário
      NEW.is_critical := TRUE;
      NEW.mentions_me := TRUE;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_detect_contemplation
  BEFORE INSERT ON public.chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION auto_detect_contemplation();

-- =============================================================================
-- FIM DA MIGRATION 003
-- =============================================================================
