-- =============================================================================
-- Migration 001: Schema Inicial do Licifácil
-- Data: 2026-02-10
-- Descrição: Tabelas principais (profiles, companies, bids, alerts)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- PROFILES (estende auth.users)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: usuários podem ler/editar apenas seu próprio perfil
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Trigger: criar profile automaticamente ao registrar usuário
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- -----------------------------------------------------------------------------
-- COMPANIES (empresas cadastradas pelos usuários)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  cnpj TEXT UNIQUE NOT NULL,
  razao_social TEXT NOT NULL,
  nome_fantasia TEXT,
  uf TEXT,
  municipio TEXT,
  porte TEXT, -- ME, EPP, GRANDE
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: usuários podem gerenciar apenas suas próprias empresas
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own companies"
  ON public.companies FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own companies"
  ON public.companies FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own companies"
  ON public.companies FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own companies"
  ON public.companies FOR DELETE
  USING (auth.uid() = user_id);

-- Índice para busca por CNPJ
CREATE INDEX IF NOT EXISTS idx_companies_cnpj ON public.companies(cnpj);

-- -----------------------------------------------------------------------------
-- BIDS (licitações/editais coletados pelos scrapers)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Origem
  portal TEXT NOT NULL, -- 'pncp', 'compras.gov.br', etc.
  external_id TEXT NOT NULL, -- ID único no portal de origem
  
  -- Dados principais
  numero_edital TEXT,
  orgao TEXT NOT NULL,
  objeto TEXT NOT NULL,
  modalidade TEXT, -- Pregão Eletrônico, Concorrência, etc.
  tipo_licitacao TEXT, -- Menor Preço, Técnica e Preço, etc.
  
  -- Valores
  valor_estimado NUMERIC(15,2),
  
  -- Datas
  data_publicacao TIMESTAMPTZ,
  data_abertura TIMESTAMPTZ,
  data_encerramento TIMESTAMPTZ,
  
  -- Localização
  uf TEXT,
  municipio TEXT,
  
  -- Status
  status TEXT DEFAULT 'aberto', -- aberto, suspenso, cancelado, homologado, etc.
  
  -- Links
  url TEXT,
  url_edital TEXT,
  
  -- Dados brutos da API (para análise posterior)
  raw_data JSONB,
  
  -- Metadados
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraint: não duplicar editais do mesmo portal
  UNIQUE(portal, external_id)
);

-- Índices para otimizar buscas
CREATE INDEX IF NOT EXISTS idx_bids_portal ON public.bids(portal);
CREATE INDEX IF NOT EXISTS idx_bids_data_abertura ON public.bids(data_abertura);
CREATE INDEX IF NOT EXISTS idx_bids_data_publicacao ON public.bids(data_publicacao);
CREATE INDEX IF NOT EXISTS idx_bids_uf_municipio ON public.bids(uf, municipio);
CREATE INDEX IF NOT EXISTS idx_bids_status ON public.bids(status);
CREATE INDEX IF NOT EXISTS idx_bids_modalidade ON public.bids(modalidade);

-- Índice para busca full-text no objeto
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_bids_objeto_trgm ON public.bids USING gin (objeto gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_bids_orgao_trgm ON public.bids USING gin (orgao gin_trgm_ops);

-- RLS: todos podem ler editais (dados públicos), só service_role pode escrever
ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view bids"
  ON public.bids FOR SELECT
  USING (true);

CREATE POLICY "Only service role can insert bids"
  ON public.bids FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role' OR true); -- Temporário: permitir inserção durante desenvolvimento

-- -----------------------------------------------------------------------------
-- ALERTS (alertas configurados pelos usuários)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  
  -- Nome do alerta
  name TEXT NOT NULL,
  
  -- Filtros (armazenados como JSON)
  filters JSONB NOT NULL, -- { "keywords": ["computador"], "uf": ["SP"], "modalidade": ["Pregão Eletrônico"] }
  
  -- Configurações
  active BOOLEAN DEFAULT true,
  email_enabled BOOLEAN DEFAULT true,
  whatsapp_enabled BOOLEAN DEFAULT false,
  
  -- Metadados
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: usuários podem gerenciar apenas seus próprios alertas
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own alerts"
  ON public.alerts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own alerts"
  ON public.alerts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own alerts"
  ON public.alerts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own alerts"
  ON public.alerts FOR DELETE
  USING (auth.uid() = user_id);

-- Índice para busca por usuário
CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON public.alerts(user_id);

-- -----------------------------------------------------------------------------
-- ALERT_LOGS (histórico de alertas enviados)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.alert_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id UUID REFERENCES public.alerts(id) ON DELETE CASCADE NOT NULL,
  bid_id UUID REFERENCES public.bids(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Canal de envio
  channel TEXT NOT NULL, -- 'email', 'whatsapp', 'web'
  
  -- Status do envio
  status TEXT DEFAULT 'pending', -- pending, sent, failed
  error_message TEXT,
  
  -- Metadados
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: usuários podem ver apenas logs de seus alertas
ALTER TABLE public.alert_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own alert logs"
  ON public.alert_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Índice para busca por alerta
CREATE INDEX IF NOT EXISTS idx_alert_logs_alert_id ON public.alert_logs(alert_id);
CREATE INDEX IF NOT EXISTS idx_alert_logs_created_at ON public.alert_logs(created_at);

-- -----------------------------------------------------------------------------
-- FUNÇÕES AUXILIARES
-- -----------------------------------------------------------------------------

-- Atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualizar updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bids_updated_at BEFORE UPDATE ON public.bids
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_alerts_updated_at BEFORE UPDATE ON public.alerts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- FIM DA MIGRATION 001
-- =============================================================================
