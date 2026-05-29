# 🚀 Guide de Démarrage Rapide - BloodLink Frontend

## 📋 Prérequis

- **Node.js** (v18.0.0 ou plus) - [Télécharger](https://nodejs.org/)
- **npm** (inclus avec Node.js)
- **Git** (pour le versioning)
- Backend BloodLink en cours d'exécution (port 3001)

## 🎯 Installation rapide

### 1️⃣ Sur Windows

Double-clique sur `install.bat` ou ouvre PowerShell et exécute:

```bash
npm install
```

### 2️⃣ Sur macOS/Linux

Rends le script exécutable et lance-le:

```bash
chmod +x setup.sh
./setup.sh
```

Ou directement:

```bash
npm install
```

## ⚙️ Configuration

### 1. Créer le fichier `.env`

```bash
cp .env.example .env
```

### 2. Modifier `.env` si nécessaire

```env
VITE_API_URL=http://localhost:3001/api
VITE_APP_NAME=BloodLink
```

## 🏃 Démarrer le développement

```bash
npm run dev
```

L'application sera disponible à: **http://localhost:3000**

## 📦 Scripts disponibles

| Commande | Description |
|----------|-------------|
| `npm run dev` | Démarre le serveur de développement |
| `npm run build` | Build pour la production |
| `npm run preview` | Prévisualise le build de production |

## 🔐 Authentification par défaut

Pour tester, utilise ces credentials (tu dois d'abord créer un compte):

**Donneur:**
- Email: `donneur@test.com`
- Password: `Test123!`
- Type de sang: `O+`

**Structure:**
- Email: `structure@test.com`
- Password: `Test123!`

## 📁 Structure des dossiers

```
src/
├── components/          # Composants réutilisables
│   ├── common/         # Button, Input, Card, Modal, Badge
│   └── layout/         # Navbar, Sidebar
├── pages/              # Pages principales
│   ├── Login.jsx
│   ├── Register.jsx
│   ├── DashboardDonneur.jsx
│   ├── DashboardStructure.jsx
│   ├── Admin.jsx
│   ├── donneur/        # Pages du donneur
│   │   ├── Home.jsx
│   │   ├── Requests.jsx
│   │   └── Profile.jsx
│   └── structure/      # Pages de la structure
│       ├── Home.jsx
│       ├── Demands.jsx
│       └── Settings.jsx
├── services/           # Services API (apiClient, services)
├── contexts/           # AuthContext
├── hooks/              # Custom hooks (useAuth)
├── styles/             # CSS global
└── App.jsx            # Routing principal
```

## 🎨 Palette de couleurs

- **Rouge** (primaire): `#C0392B`
- **Vert** (succès): `#1E8449`
- **Orange** (warning): `#D35400`
- **Bleu** (info): `#1A5276`
- **Gris** (neutral): `#8A96A8`

## 📱 Responsive Design

L'app est optimisée pour:
- **Mobile** < 480px
- **Tablet** 480px - 768px
- **Desktop** > 768px

## 🔗 Routes disponibles

### Donneur
- `/donneur` - Accueil
- `/donneur/requests` - Demandes de sang
- `/donneur/profile` - Mon profil

### Structure
- `/structure` - Accueil
- `/structure/demands` - Mes demandes
- `/structure/donors` - Donneurs disponibles
- `/structure/settings` - Paramètres

### Admin
- `/admin` - Statistiques
- `/admin/users` - Gestion des utilisateurs
- `/admin/reports` - Signalements
- `/admin/settings` - Paramètres

## 🐛 Debugging

### Mode développement avec React DevTools

1. Installe l'extension [React Developer Tools](https://react-devtools-tutorial.vercel.app/)
2. Ouvre les DevTools (F12)
3. Va dans l'onglet "Components"

### Console errors?

Vérifie dans la console:

```bash
npm run dev -- --debug
```

## 🚀 Build pour production

```bash
npm run build
```

Le dossier `dist/` sera généré et prêt à être déployé.

## 📚 Documentation utile

- [React Documentation](https://react.dev)
- [React Router](https://reactrouter.com)
- [Vite Guide](https://vitejs.dev)
- [CSS Modules](https://create-react-app.dev/docs/adding-a-css-modules-stylesheet/)

## 🆘 Dépannage courants

### Le port 3000 est déjà utilisé?

```bash
# Sur Windows PowerShell
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess

# Sur macOS/Linux
lsof -i :3000
```

### L'API ne répond pas?

1. Vérifie que le backend est en cours d'exécution (port 3001)
2. Vérifie l'URL dans `.env`
3. Regarde les erreurs dans la console du navigateur (F12)

### Module not found?

```bash
# Réinstalle les dépendances
rm -rf node_modules
npm install
```

## 💡 Conseils de développement

1. **Utilise les composants réutilisables** - Button, Input, Card, etc.
2. **Styles en CSS Modules** - `NomComposant.module.css`
3. **Appels API via services** - `src/services/index.js`
4. **Auth hook** - Utilise `useAuth()` pour accéder à l'utilisateur

```jsx
import { useAuth } from '../hooks/useAuth'

export default function MonComposant() {
  const { user, logout, isLoggedIn } = useAuth()
  
  return <div>Bienvenue, {user?.firstName}!</div>
}
```

## 🎯 Prochaines étapes

- [ ] Implémenter la logique IA (Groq)
- [ ] Ajouter les tests unitaires
- [ ] Optimiser les images
- [ ] Setup du CI/CD
- [ ] Déployer sur un serveur

## 📞 Support

En cas de problème, consulte:
- [Issues GitHub](https://github.com/)
- La documentation du projet
- Les commentaires dans le code

---

**BloodLink** — Partager du sang, c'est partager la vie 🩸
