-- Migration : ajout validation donneurs + audit_logs
-- À exécuter dans Supabase > SQL Editor

-- 1. Ajouter statut_validation aux donneurs
ALTER TABLE donneurs
  ADD COLUMN IF NOT EXISTS statut_validation VARCHAR(20) DEFAULT 'en_attente'
  CHECK (statut_validation IN ('en_attente','validé','rejeté','suspendu'));

-- Mettre les donneurs existants comme validés (rétrocompatibilité)
UPDATE donneurs SET statut_validation = 'validé' WHERE statut_validation IS NULL OR statut_validation = 'en_attente';

-- 2. Table audit_logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id      UUID NOT NULL,
  admin_email   VARCHAR(150),
  action        VARCHAR(100) NOT NULL,
  cible_type    VARCHAR(50) NOT NULL,  -- 'donneur' | 'structure' | 'demande'
  cible_id      UUID NOT NULL,
  details       JSONB,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_admin    ON audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_cible    ON audit_logs(cible_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created  ON audit_logs(created_at DESC);

-- RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for service role" ON audit_logs FOR ALL USING (true);
