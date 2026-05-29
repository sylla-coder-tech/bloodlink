# BloodLink Frontend

Un application React moderne pour connecter donneurs de sang et structures médicales.

## 🚀 Installation

```bash
# Installer les dépendances
npm install

# Copier le fichier d'environnement
cp .env.example .env

# Démarrer en développement
npm run dev

# Build pour production
npm run build

# Prévisualiser le build
npm run preview
```

## 📁 Structure du projet

```
src/
├── components/
│   ├── common/          # Composants réutilisables (Button, Input, Card)
│   └── layout/          # Layout (Navbar, Sidebar)
├── pages/              # Pages principales
│   ├── donneur/         # Pages donneur
│   ├── structure/       # Pages structure
│   └── Admin.jsx        # Page admin
├── services/           # Services API
├── contexts/           # Context API (Auth)
├── hooks/              # Custom hooks
├── styles/             # Styles globaux
└── App.jsx            # Route principale
```

## 🎨 Design System

### Couleurs
- **Rouge** : `#C0392B` (primaire)
- **Vert** : `#1E8449` (succès)
- **Orange** : `#D35400` (avertissement)
- **Bleu** : `#1A5276` (info)

### Typographie
- **Display** : Sora (titres)
- **Body** : Plus Jakarta Sans (contenu)

### Responsive
- Mobile : < 480px
- Tablet : 480px - 768px
- Desktop : > 768px

## 🔐 Authentification

L'authentification utilise JWT tokens stockés dans localStorage :
- `bl_token` : Token JWT
- `bl_role` : Rôle utilisateur (donneur/structure/admin)
- `bl_user` : Données utilisateur

## 📝 Pages disponibles

### Donneur
- `/donneur` - Accueil
- `/donneur/requests` - Demandes de sang
- `/donneur/profile` - Profil

### Structure
- `/structure` - Accueil
- `/structure/demands` - Mes demandes
- `/structure/donors` - Donneurs
- `/structure/settings` - Paramètres

### Admin
- `/admin` - Statistiques
- `/admin/users` - Gestion utilisateurs
- `/admin/reports` - Signalements
- `/admin/settings` - Paramètres

## 🔧 Configuration

Le projet utilise Vite pour le build et le dev server avec proxy API.

```js
// vite.config.js
proxy: {
  '/api': {
    target: 'http://localhost:3001',
    changeOrigin: true
  }
}
```

## 📦 Dépendances principales

- React 18
- React Router 6
- Axios
- CSS Modules

## 💡 Conseils de développement

1. Les styles sont séparés en CSS Modules (`*.module.css`)
2. Les composants sont dans `src/components`
3. Les pages dans `src/pages`
4. Utilise le hook `useAuth()` pour l'authentification
5. Les services API sont centralisés dans `src/services`

## 🚀 Déploiement

```bash
# Build
npm run build

# Le dossier dist/ est prêt pour être déployé
```

---

**BloodLink** — Partager du sang, c'est partager la vie 🩸
