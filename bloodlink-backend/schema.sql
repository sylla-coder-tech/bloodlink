-- ============================================================
--  BLOODLINK — Schéma SQL complet pour Supabase (PostgreSQL)
--  Kɛnɛya Digital Guinée — 2025
--  Instructions : Copier ce fichier dans Supabase > SQL Editor > New Query > Run
-- ============================================================

-- ─── EXTENSION UUID ─────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLE : admins
-- ============================================================
CREATE TABLE IF NOT EXISTS admins (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom         VARCHAR(100) NOT NULL,
  email       VARCHAR(150) NOT NULL,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT admins_email_unique UNIQUE (email)
);

-- ============================================================
-- TABLE : donneurs
-- ============================================================
CREATE TABLE IF NOT EXISTS donneurs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prenom          VARCHAR(100) NOT NULL,
  nom             VARCHAR(100) NOT NULL,
  sexe            VARCHAR(10) CHECK (sexe IN ('Masculin','Féminin')) NOT NULL,
  telephone       VARCHAR(20) NOT NULL,
  email           VARCHAR(150),
  groupe_sanguin  VARCHAR(5) CHECK (groupe_sanguin IN ('A+','A−','B+','B−','AB+','AB−','O+','O−')) NOT NULL,
  commune         VARCHAR(50) NOT NULL,
  quartier        VARCHAR(100),
  disponibilite   BOOLEAN DEFAULT TRUE,
  statut          VARCHAR(20) DEFAULT 'actif' CHECK (statut IN ('actif','suspendu','inactif')),
  nb_dons         INTEGER DEFAULT 0,
  dernier_don     DATE,
  auth_user_id    UUID,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT donneurs_email_unique UNIQUE (email)
);

-- ============================================================
-- TABLE : structures
-- ============================================================
CREATE TABLE IF NOT EXISTS structures (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom                 VARCHAR(200) NOT NULL,
  type_structure      VARCHAR(100) NOT NULL,
  telephone           VARCHAR(20) NOT NULL,
  email               VARCHAR(150) NOT NULL,
  commune             VARCHAR(50) NOT NULL,
  quartier            VARCHAR(100),
  responsable         VARCHAR(150) NOT NULL,
  statut_validation   VARCHAR(20) DEFAULT 'en_attente'
                      CHECK (statut_validation IN ('en_attente','validé','refusé')),
  motif_refus         TEXT,
  auth_user_id        UUID,
  created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT structures_email_unique UNIQUE (email)
);

-- ============================================================
-- TABLE : demandes
-- ============================================================
CREATE TABLE IF NOT EXISTS demandes (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  structure_id    UUID NOT NULL REFERENCES structures(id) ON DELETE CASCADE,
  groupe_sanguin  VARCHAR(5) CHECK (groupe_sanguin IN ('A+','A−','B+','B−','AB+','AB−','O+','O−')) NOT NULL,
  quantite        INTEGER NOT NULL CHECK (quantite > 0 AND quantite <= 20),
  commune         VARCHAR(50) NOT NULL,
  urgence         VARCHAR(20) CHECK (urgence IN ('haute','moyenne','basse')) NOT NULL,
  date_limite     DATE NOT NULL,
  notes           TEXT,
  statut          VARCHAR(20) DEFAULT 'ouverte'
                  CHECK (statut IN ('ouverte','contactés','confirmés','clôturée')),
  -- Résultat du matching IA (stocké en JSON)
  matching_ia_result  JSONB,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- TABLE : reponses
-- ============================================================
CREATE TABLE IF NOT EXISTS reponses (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  donneur_id      UUID NOT NULL REFERENCES donneurs(id) ON DELETE CASCADE,
  demande_id      UUID NOT NULL REFERENCES demandes(id) ON DELETE CASCADE,
  statut_reponse  VARCHAR(20) DEFAULT 'intéressé'
                  CHECK (statut_reponse IN ('intéressé','confirmé','refusé')),
  message         TEXT,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Un donneur ne peut répondre qu'une seule fois par demande
  UNIQUE(donneur_id, demande_id)
);

-- ============================================================
-- TABLE : notifications
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  destinataire_id   UUID NOT NULL,
  destinataire_type VARCHAR(20) CHECK (destinataire_type IN ('donneur','structure','admin')) NOT NULL,
  type_alerte       VARCHAR(50) NOT NULL,
  contenu           TEXT NOT NULL,
  statut_lecture    BOOLEAN DEFAULT FALSE,
  created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- TABLE : messages (messagerie entre donneurs et structures)
-- ============================================================
CREATE TABLE IF NOT EXISTS messages (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  demande_id      UUID REFERENCES demandes(id) ON DELETE CASCADE,
  expediteur_id   UUID NOT NULL,
  expediteur_type VARCHAR(20) CHECK (expediteur_type IN ('donneur','structure')) NOT NULL,
  destinataire_id UUID NOT NULL,
  destinataire_type VARCHAR(20) CHECK (destinataire_type IN ('donneur','structure')) NOT NULL,
  contenu         TEXT NOT NULL,
  lu              BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour optimiser les requêtes de messagerie
CREATE INDEX IF NOT EXISTS idx_messages_demande_id ON messages(demande_id);
CREATE INDEX IF NOT EXISTS idx_messages_destinataire_id ON messages(destinataire_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

-- ============================================================
-- TABLE : ia_logs  (logs des appels Claude API)
-- ============================================================
CREATE TABLE IF NOT EXISTS ia_logs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type_appel      VARCHAR(50) NOT NULL, -- 'matching' ou 'chatbot'
  demande_id      UUID REFERENCES demandes(id),
  donneur_id      UUID REFERENCES donneurs(id),
  prompt_envoye   TEXT,
  reponse_ia      TEXT,
  tokens_utilises INTEGER,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- INDEX pour les performances
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_donneurs_groupe     ON donneurs(groupe_sanguin);
CREATE INDEX IF NOT EXISTS idx_donneurs_commune    ON donneurs(commune);
CREATE INDEX IF NOT EXISTS idx_donneurs_dispo      ON donneurs(disponibilite);
CREATE INDEX IF NOT EXISTS idx_demandes_statut     ON demandes(statut);
CREATE INDEX IF NOT EXISTS idx_demandes_groupe     ON demandes(groupe_sanguin);
CREATE INDEX IF NOT EXISTS idx_demandes_structure  ON demandes(structure_id);
CREATE INDEX IF NOT EXISTS idx_reponses_demande    ON reponses(demande_id);
CREATE INDEX IF NOT EXISTS idx_notifs_destinataire ON notifications(destinataire_id);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) — Supabase
-- ============================================================
ALTER TABLE donneurs      ENABLE ROW LEVEL SECURITY;
ALTER TABLE structures    ENABLE ROW LEVEL SECURITY;
ALTER TABLE demandes      ENABLE ROW LEVEL SECURITY;
ALTER TABLE reponses      ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE ia_logs       ENABLE ROW LEVEL SECURITY;

-- Politique : accès via le back-end Node.js uniquement (service_role)
-- Le back-end utilise la clé service_role qui bypass le RLS
-- Les politiques ci-dessous sont permissives pour le développement

CREATE POLICY "Allow all for service role" ON donneurs      FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON structures    FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON demandes      FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON reponses      FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON notifications FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON ia_logs       FOR ALL USING (true);

-- ============================================================
-- DONNÉES DE TEST (optionnel — commenter en production)
-- ============================================================

-- Admin par défaut (l'authentification se fait via Supabase Auth)
INSERT INTO admins (nom, email) VALUES
('Administrateur BloodLink', 'admin@bloodlink.gn')
ON CONFLICT (email) DO NOTHING;

-- Donneurs de test
INSERT INTO donneurs (prenom, nom, sexe, telephone, email, groupe_sanguin, commune, quartier, disponibilite) VALUES
('Mamadou',   'Diallo',  'Masculin', '620000001', 'mamadou@test.gn',   'O+',  'Ratoma',  'Kipé',       TRUE),
('Fatoumata', 'Bah',     'Féminin',  '621000002', 'fatoumata@test.gn', 'A+',  'Dixinn',  'Landréah',   TRUE),
('Ibrahima',  'Sow',     'Masculin', '622000003', 'ibrahima@test.gn',  'B+',  'Matam',   'Bonfi',      FALSE),
('Mariama',   'Camara',  'Féminin',  '628000004', 'mariama@test.gn',   'O−',  'Kaloum',  'Almamya',    TRUE),
('Moussa',    'Kouyaté', 'Masculin', '625000005', 'moussa@test.gn',    'AB+', 'Ratoma',  'Hamdallaye', TRUE)
ON CONFLICT (email) DO NOTHING;

-- Structure de test
INSERT INTO structures (nom, type_structure, telephone, email, commune, quartier, responsable, statut_validation) VALUES
('Hôpital National Donka', 'Hôpital national', '622102030', 'donka@test.gn', 'Dixinn', 'Donka', 'Dr. Alpha Condé', 'validé')
ON CONFLICT (email) DO NOTHING;

-- ============================================================
-- FONCTIONS UTILES
-- ============================================================

-- Fonction : mise à jour automatique de updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers updated_at
CREATE TRIGGER trg_donneurs_updated
  BEFORE UPDATE ON donneurs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_structures_updated
  BEFORE UPDATE ON structures
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_demandes_updated
  BEFORE UPDATE ON demandes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- VUES UTILES POUR LE DASHBOARD ADMIN
-- ============================================================

CREATE OR REPLACE VIEW vue_stats_globales AS
SELECT
  (SELECT COUNT(*) FROM donneurs WHERE statut = 'actif')                        AS total_donneurs,
  (SELECT COUNT(*) FROM donneurs WHERE disponibilite = TRUE AND statut = 'actif') AS donneurs_disponibles,
  (SELECT COUNT(*) FROM structures WHERE statut_validation = 'validé')           AS structures_actives,
  (SELECT COUNT(*) FROM structures WHERE statut_validation = 'en_attente')       AS structures_en_attente,
  (SELECT COUNT(*) FROM demandes WHERE statut = 'ouverte')                       AS demandes_ouvertes,
  (SELECT COUNT(*) FROM demandes WHERE statut = 'clôturée')                      AS demandes_cloturees,
  (SELECT COUNT(*) FROM demandes)                                                AS total_demandes;

CREATE OR REPLACE VIEW vue_donneurs_par_groupe AS
SELECT groupe_sanguin, COUNT(*) AS total
FROM donneurs WHERE statut = 'actif'
GROUP BY groupe_sanguin ORDER BY total DESC;

CREATE OR REPLACE VIEW vue_donneurs_par_commune AS
SELECT commune, COUNT(*) AS total
FROM donneurs WHERE statut = 'actif'
GROUP BY commune ORDER BY total DESC;
