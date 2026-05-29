-- Migration : stock sanguin CNTS + convocations
-- À exécuter dans Supabase > SQL Editor

-- Table stock sanguin CNTS
CREATE TABLE IF NOT EXISTS stock_sanguin (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  groupe_sanguin VARCHAR(5) NOT NULL CHECK (groupe_sanguin IN ('A+','A−','B+','B−','AB+','AB−','O+','O−')),
  quantite       INTEGER NOT NULL DEFAULT 0 CHECK (quantite >= 0),
  seuil_alerte   INTEGER NOT NULL DEFAULT 5,
  updated_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT stock_groupe_unique UNIQUE (groupe_sanguin)
);

-- Initialiser le stock à 0 pour chaque groupe
INSERT INTO stock_sanguin (groupe_sanguin, quantite, seuil_alerte) VALUES
  ('A+', 0, 5), ('A−', 0, 3), ('B+', 0, 5), ('B−', 0, 3),
  ('AB+', 0, 3), ('AB−', 0, 2), ('O+', 0, 8), ('O−', 0, 5)
ON CONFLICT (groupe_sanguin) DO NOTHING;

-- Table convocations (CNTS → Donneurs)
CREATE TABLE IF NOT EXISTS convocations (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  donneur_id     UUID NOT NULL REFERENCES donneurs(id) ON DELETE CASCADE,
  admin_id       UUID NOT NULL,
  type           VARCHAR(20) NOT NULL DEFAULT 'renouvellement'
                 CHECK (type IN ('renouvellement','urgence')),
  message        TEXT NOT NULL,
  statut         VARCHAR(20) NOT NULL DEFAULT 'envoyée'
                 CHECK (statut IN ('envoyée','confirmée','refusée')),
  date_rdv       DATE,
  created_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_convocations_donneur ON convocations(donneur_id);

-- RLS
ALTER TABLE stock_sanguin ENABLE ROW LEVEL SECURITY;
ALTER TABLE convocations  ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for service role" ON stock_sanguin FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON convocations  FOR ALL USING (true);
