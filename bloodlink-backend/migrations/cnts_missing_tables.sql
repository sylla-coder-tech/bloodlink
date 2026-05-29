-- ============================================================
--  MIGRATION CNTS — version corrigée (sans conflits)
--  Supabase > SQL Editor > New Query > Run
-- ============================================================

-- ─── 1. stock_sanguin ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS stock_sanguin (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  groupe_sanguin  VARCHAR(5) NOT NULL UNIQUE
                  CHECK (groupe_sanguin IN ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
  quantite        INTEGER NOT NULL DEFAULT 0 CHECK (quantite >= 0),
  seuil_alerte    INTEGER NOT NULL DEFAULT 5,
  updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE stock_sanguin ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for service role" ON stock_sanguin;
CREATE POLICY "Allow all for service role" ON stock_sanguin FOR ALL USING (true);

INSERT INTO stock_sanguin (groupe_sanguin, quantite, seuil_alerte) VALUES
  ('A+',  0, 5), ('A-',  0, 5), ('B+',  0, 5), ('B-',  0, 5),
  ('AB+', 0, 5), ('AB-', 0, 5), ('O+',  0, 5), ('O-',  0, 5)
ON CONFLICT (groupe_sanguin) DO NOTHING;

-- ─── 2. convocations ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS convocations (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  donneur_id  UUID NOT NULL REFERENCES donneurs(id) ON DELETE CASCADE,
  admin_id    UUID NOT NULL,
  type        VARCHAR(30) DEFAULT 'renouvellement'
              CHECK (type IN ('renouvellement','urgence','autre')),
  message     TEXT NOT NULL,
  date_rdv    TIMESTAMP WITH TIME ZONE,
  statut      VARCHAR(20) DEFAULT 'en_attente'
              CHECK (statut IN ('en_attente','confirmée','refusée')),
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE convocations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for service role" ON convocations;
CREATE POLICY "Allow all for service role" ON convocations FOR ALL USING (true);

CREATE INDEX IF NOT EXISTS idx_convocations_donneur ON convocations(donneur_id);

-- ─── 3. Corriger messages (ajouter type 'admin') ─────────────
ALTER TABLE messages
  DROP CONSTRAINT IF EXISTS messages_expediteur_type_check,
  DROP CONSTRAINT IF EXISTS messages_destinataire_type_check;

ALTER TABLE messages
  ADD CONSTRAINT messages_expediteur_type_check
    CHECK (expediteur_type IN ('donneur','structure','admin')),
  ADD CONSTRAINT messages_destinataire_type_check
    CHECK (destinataire_type IN ('donneur','structure','admin'));

ALTER TABLE messages ADD COLUMN IF NOT EXISTS lu BOOLEAN DEFAULT FALSE;

-- ─── 4. statut_validation sur donneurs ───────────────────────
ALTER TABLE donneurs
  ADD COLUMN IF NOT EXISTS statut_validation VARCHAR(20) DEFAULT 'en_attente'
    CHECK (statut_validation IN ('en_attente','validé','rejeté','suspendu'));

-- ─── 5. audit_logs (si pas encore créée) ─────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id      UUID,
  admin_email   VARCHAR(150),
  action        VARCHAR(100) NOT NULL,
  cible_type    VARCHAR(50),
  cible_id      UUID,
  details       JSONB DEFAULT '{}',
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for service role" ON audit_logs;
CREATE POLICY "Allow all for service role" ON audit_logs FOR ALL USING (true);

CREATE INDEX IF NOT EXISTS idx_audit_action     ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_cible_type ON audit_logs(cible_type);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON audit_logs(created_at DESC);
