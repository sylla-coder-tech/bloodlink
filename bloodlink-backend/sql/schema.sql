-- ============================================================
--  BLOODLINK — Schéma SQL complet pour Supabase (PostgreSQL)
--  Kɛnɛya Digital Guinée — 2025
--  À copier-coller dans : Supabase > SQL Editor > New Query
-- ============================================================

-- ─── EXTENSION UUID ──────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── TABLE : ADMINS ──────────────────────────────────────────
CREATE TABLE admins (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom         VARCHAR(100) NOT NULL,
  email       VARCHAR(150) UNIQUE NOT NULL,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─── TABLE : DONNEURS ────────────────────────────────────────
CREATE TABLE donneurs (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prenom           VARCHAR(100) NOT NULL,
  nom              VARCHAR(100) NOT NULL,
  sexe             VARCHAR(10)  CHECK (sexe IN ('Masculin','Féminin')),
  telephone        VARCHAR(20)  NOT NULL,
  email            VARCHAR(150),
  groupe_sanguin   VARCHAR(5)   NOT NULL CHECK (groupe_sanguin IN ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
  commune          VARCHAR(50)  NOT NULL CHECK (commune IN ('Kaloum','Dixinn','Matam','Ratoma','Matoto')),
  quartier         VARCHAR(100),
  disponibilite    BOOLEAN DEFAULT TRUE,
  nb_dons          INTEGER DEFAULT 0,
  dernier_don      DATE,
  statut           VARCHAR(20) DEFAULT 'actif' CHECK (statut IN ('actif','suspendu','inactif')),
  auth_user_id     UUID UNIQUE,  -- lié à Supabase Auth
  created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─── TABLE : STRUCTURES DE SANTÉ ─────────────────────────────
CREATE TABLE structures (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom                 VARCHAR(200) NOT NULL,
  type                VARCHAR(100) NOT NULL CHECK (type IN (
                        'Hôpital national','Hôpital préfectoral','Clinique privée',
                        'Centre de santé communautaire','Banque de sang (CNTS)',
                        'Maternité','Autre'
                      )),
  telephone           VARCHAR(20)  NOT NULL,
  email               VARCHAR(150) NOT NULL,
  commune             VARCHAR(50)  NOT NULL CHECK (commune IN ('Kaloum','Dixinn','Matam','Ratoma','Matoto')),
  quartier            VARCHAR(100),
  responsable         VARCHAR(150) NOT NULL,
  statut_validation   VARCHAR(20) DEFAULT 'en_attente' CHECK (statut_validation IN ('en_attente','valide','refuse')),
  motif_refus         TEXT,
  auth_user_id        UUID UNIQUE,  -- lié à Supabase Auth
  created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─── TABLE : DEMANDES URGENTES ───────────────────────────────
CREATE TABLE demandes (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reference       VARCHAR(20) UNIQUE NOT NULL,  -- ex: DEM-2025-001
  structure_id    UUID NOT NULL REFERENCES structures(id) ON DELETE CASCADE,
  groupe_sanguin  VARCHAR(5) NOT NULL CHECK (groupe_sanguin IN ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
  quantite        INTEGER NOT NULL CHECK (quantite BETWEEN 1 AND 20),
  commune         VARCHAR(50) NOT NULL,
  urgence         VARCHAR(20) NOT NULL CHECK (urgence IN ('haute','moyenne','basse')),
  date_limite     DATE NOT NULL,
  notes           TEXT,
  statut          VARCHAR(20) DEFAULT 'ouverte' CHECK (statut IN ('ouverte','contactes','confirmes','cloturee')),
  -- Résultat du matching IA
  ia_analyse      TEXT,  -- explication IA du contexte de la demande
  nb_matches      INTEGER DEFAULT 0,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─── TABLE : RÉPONSES DONNEURS ───────────────────────────────
CREATE TABLE reponses (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  donneur_id    UUID NOT NULL REFERENCES donneurs(id) ON DELETE CASCADE,
  demande_id    UUID NOT NULL REFERENCES demandes(id) ON DELETE CASCADE,
  statut        VARCHAR(20) DEFAULT 'interesse' CHECK (statut IN ('interesse','confirme','refuse')),
  message       TEXT,
  -- Score IA pour ce donneur sur cette demande
  ia_score      INTEGER,          -- score 0-100 calculé par l'IA
  ia_explication TEXT,            -- explication IA du score
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(donneur_id, demande_id)  -- un donneur répond une seule fois par demande
);

-- ─── TABLE : NOTIFICATIONS ───────────────────────────────────
CREATE TABLE notifications (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  destinataire_id UUID NOT NULL,  -- peut être donneur_id ou structure_id
  destinataire_type VARCHAR(20) CHECK (destinataire_type IN ('donneur','structure','admin')),
  type            VARCHAR(50) NOT NULL CHECK (type IN (
                    'nouvelle_demande','demande_cloturee','reponse_recue',
                    'compte_valide','compte_refuse','rappel','info'
                  )),
  titre           VARCHAR(200) NOT NULL,
  contenu         TEXT NOT NULL,
  lue             BOOLEAN DEFAULT FALSE,
  demande_id      UUID REFERENCES demandes(id) ON DELETE SET NULL,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─── TABLE : HISTORIQUE IA ───────────────────────────────────
CREATE TABLE ia_historique (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type          VARCHAR(50) CHECK (type IN ('matching','chatbot','analyse_demande')),
  input_data    JSONB,           -- données envoyées à l'IA
  output_data   JSONB,           -- réponse de l'IA
  tokens_used   INTEGER,
  duree_ms      INTEGER,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
--  INDEX POUR LES PERFORMANCES
-- ============================================================
CREATE INDEX idx_donneurs_commune        ON donneurs(commune);
CREATE INDEX idx_donneurs_groupe         ON donneurs(groupe_sanguin);
CREATE INDEX idx_donneurs_disponibilite  ON donneurs(disponibilite);
CREATE INDEX idx_donneurs_statut         ON donneurs(statut);
CREATE INDEX idx_demandes_statut         ON demandes(statut);
CREATE INDEX idx_demandes_groupe         ON demandes(groupe_sanguin);
CREATE INDEX idx_demandes_commune        ON demandes(commune);
CREATE INDEX idx_reponses_demande        ON reponses(demande_id);
CREATE INDEX idx_notifs_destinataire     ON notifications(destinataire_id);
CREATE INDEX idx_notifs_lue              ON notifications(lue);

-- ============================================================
--  SÉQUENCE POUR LES RÉFÉRENCES DE DEMANDES
-- ============================================================
CREATE SEQUENCE demande_seq START 1;

CREATE OR REPLACE FUNCTION generate_demande_reference()
RETURNS TRIGGER AS $$
BEGIN
  NEW.reference := 'DEM-' || EXTRACT(YEAR FROM NOW()) || '-' || LPAD(NEXTVAL('demande_seq')::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_demande_reference
BEFORE INSERT ON demandes
FOR EACH ROW EXECUTE FUNCTION generate_demande_reference();

-- ============================================================
--  TRIGGER : updated_at automatique
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_donneurs_updated_at    BEFORE UPDATE ON donneurs    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_structures_updated_at  BEFORE UPDATE ON structures  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_demandes_updated_at    BEFORE UPDATE ON demandes    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
--  ROW LEVEL SECURITY (RLS) — Sécurité Supabase
-- ============================================================
ALTER TABLE donneurs    ENABLE ROW LEVEL SECURITY;
ALTER TABLE structures  ENABLE ROW LEVEL SECURITY;
ALTER TABLE demandes    ENABLE ROW LEVEL SECURITY;
ALTER TABLE reponses    ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Les admins voient tout (via service_role key dans le back-end)
-- Le front-end utilise uniquement le back-end Node.js (anon key protégée)

-- ============================================================
--  DONNÉES DE TEST (optionnel — à supprimer en production)
-- ============================================================
-- INSERT INTO admins (nom, email) VALUES ('Administrateur BloodLink', 'admin@bloodlink.gn');
