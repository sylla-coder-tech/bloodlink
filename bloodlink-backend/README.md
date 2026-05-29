# BloodLink — Back-end API
**Kɛnɛya Digital Guinée · Conakry, 2025**

## Stack technique
- Node.js + Express
- Supabase (PostgreSQL)
- Groq API (Llama 3.3) — Matching IA + Chatbot (GRATUIT)
- JWT Authentication

## Installation rapide

```bash
# 1. Installer les dépendances
npm install

# 2. Configurer les variables d'environnement
cp .env.example .env
# Remplir .env avec tes clés Supabase et Groq

# 3. Créer la base de données
# Supabase > SQL Editor > New query
# Coller et exécuter : sql/schema.sql

# 4. Démarrer le serveur
npm run dev

# 5. Tester
# http://localhost:3001/api/health
```

## Obtenir la clé Groq (gratuit, sans carte bancaire)
1. Va sur https://groq.com
2. Clique "Start Building"
3. Inscris-toi avec ton email
4. Va dans "API Keys" → "Create API Key"
5. Copie la clé dans ton .env : GROQ_API_KEY=gsk_...

## Endpoints API

| Méthode | Route | Rôle | Description |
|---------|-------|------|-------------|
| POST | /api/auth/register/donneur | Public | Inscription donneur |
| POST | /api/auth/register/structure | Public | Inscription structure |
| POST | /api/auth/login | Public | Connexion tous rôles |
| GET  | /api/auth/me | Connecté | Profil connecté |
| GET  | /api/donneur/demandes | Donneur | Demandes compatibles |
| PUT  | /api/donneur/disponibilite | Donneur | Changer disponibilité |
| PUT  | /api/donneur/profil | Donneur | Mettre à jour profil |
| GET  | /api/donneur/reponses | Donneur | Mes réponses |
| POST | /api/donneur/demandes/:id/repondre | Donneur | Répondre à une demande |
| POST | /api/structure/demandes | Structure | Créer demande urgente |
| GET  | /api/structure/demandes | Structure | Mes demandes |
| GET  | /api/structure/demandes/:id/matching | Structure | Matching IA Groq |
| PUT  | /api/structure/demandes/:id/cloturer | Structure | Clôturer demande |
| GET  | /api/admin/dashboard | Admin | Stats globales |
| GET  | /api/admin/structures | Admin | Liste structures |
| PUT  | /api/admin/structures/:id/valider | Admin | Valider/Refuser structure |
| GET  | /api/admin/donneurs | Admin | Liste donneurs |
| GET  | /api/admin/demandes | Admin | Toutes les demandes |
| POST | /api/ia/chatbot | Connecté | Chatbot IA Groq |

## Fonctionnalités IA (Groq — Llama 3.3)
1. **Matching intelligent** : score 0-100 par donneur avec explication en français
2. **Chatbot assistant** : répond aux questions des donneurs et structures en français

## Structure du projet
```
bloodlink-backend/
├── server.js                    Point d'entrée
├── package.json                 Dépendances
├── .env.example                 Variables à configurer
├── sql/schema.sql               Schéma base de données Supabase
├── config/supabase.js           Connexion Supabase
├── middleware/auth.js           JWT + contrôle des rôles
├── controllers/
│   ├── authController.js        Inscription + Connexion
│   ├── donneurController.js     Profil, disponibilité
│   ├── demandeController.js     Créer, clôturer, répondre
│   └── adminController.js       Dashboard, validation
├── services/
│   └── iaService.js             Groq API (matching + chatbot)
└── routes/                      Endpoints API REST
```
