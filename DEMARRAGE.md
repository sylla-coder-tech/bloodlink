# 🚀 DÉMARRAGE RAPIDE - BloodLink Frontend

## ⚡ Démarrage en 3 clics (Windows)

### Étape 1: Installation
Double-clique sur **`install-and-run.bat`**

Cela va:
- ✅ Vérifier que Node.js est installé
- ✅ Installer toutes les dépendances npm
- ✅ Afficher les prochaines étapes

### Étape 2: Configuration
Après l'installation, ouvre une invite de commande et copie:

```bash
copy .env.example .env
```

Ou crée un fichier `.env` à la racine avec ce contenu:

```env
VITE_API_URL=http://localhost:3001/api
VITE_APP_NAME=BloodLink
```

### Étape 3: Lancer le serveur
Double-clique sur **`start-dev.bat`**

Ouvre ton navigateur à: **http://localhost:3000**

---

## 📋 Vue d'ensemble des fichiers

| Fichier | Description |
|---------|-------------|
| `install-and-run.bat` | Installation automatique des dépendances |
| `start-dev.bat` | Lance le serveur de développement |
| `build.bat` | Build pour la production |
| `.env.example` | Template de configuration |
| `.env` | Configuration locale (à créer) |

---

## 🔧 Commandes manuelles (Terminal/CMD)

Si les scripts batch ne fonctionnent pas:

```bash
# Installation
npm install

# Développement
npm run dev

# Build
npm run build

# Prévisualiser le build
npm run preview
```

---

## ❓ Dépannage

### "Node.js not found"
- Télécharge Node.js depuis https://nodejs.org/
- Redémarre ton ordinateur après l'installation
- Relance le script `install-and-run.bat`

### "Port 3000 is already in use"
Le port 3000 est occupé par une autre application:

Option 1: Ferme l'autre application
Option 2: Change le port dans `vite.config.js`:
```js
server: {
  port: 3001  // Change 3000 en 3001 par exemple
}
```

### "npm install fails"
Essaie ceci:

```bash
# Supprimer le cache npm
npm cache clean --force

# Réinstaller
npm install
```

### "Module not found errors"
```bash
# Supprimer node_modules et réinstaller
rmdir /s /q node_modules
npm install
```

---

## 📝 Variables d'environnement

Créer un fichier `.env` à la racine avec:

```env
# API Backend URL
VITE_API_URL=http://localhost:3001/api

# App Name
VITE_APP_NAME=BloodLink

# Optional: Analytics
# VITE_ANALYTICS_ID=...

# Optional: Sentry
# VITE_SENTRY_DSN=...
```

---

## 🌐 Accès à l'application

- **Développement**: http://localhost:3000
- **Backend API**: http://localhost:3001/api

---

## 📱 Test de l'authentification

### Créer un compte donneur:
1. Clique sur "S'inscrire"
2. Remplis les données:
   - Prénom: Jean
   - Nom: Dupont
   - Email: jean@test.com
   - Téléphone: +224 XXX XX XX
   - Type de sang: O+
   - Je suis: Donneur
3. Clique "S'inscrire"

### Créer un compte structure:
1. Clique sur "S'inscrire"
2. Remplis les données:
   - Prénom: Hôpital
   - Nom: Central
   - Email: hospital@test.com
   - Téléphone: +224 XXX XX XX
   - Type de sang: (n'importe lequel)
   - Je suis: Structure
3. Clique "S'inscrire"

---

## 🔄 Workflow de développement

1. **Modifier le code** → Les changements se voient en temps réel
2. **Erreurs TypeScript** → Affichées dans le terminal
3. **Erreurs CSS** → Affichées dans la console du navigateur
4. **Recharger** → F5 ou Cmd+R

---

## 📊 Structure du projet

```
src/
├── components/        # Composants réutilisables
├── pages/            # Pages principales
├── services/         # Services API
├── contexts/         # Context API
├── hooks/            # Custom hooks
└── styles/           # Styles globaux
```

---

## 🎨 Composer un nouveau composant

```jsx
// src/components/common/NewComponent.jsx
export default function NewComponent({ prop1, prop2 }) {
  return <div>Mon composant</div>
}
```

```css
/* src/components/common/NewComponent.module.css */
.root {
  padding: 16px;
}
```

Puis l'exporter dans `src/components/common/index.js`

---

## 🚀 Déployer

### Build
```bash
npm run build
```

### Fichiers générés
Le dossier `dist/` contient les fichiers prêts pour production.

### Hébergement statique
Le contenu du dossier `dist/` peut être hébergé sur:
- Vercel
- Netlify
- GitHub Pages
- AWS S3
- Etc.

---

## 📞 Besoin d'aide?

Consulte:
- `README.md` - Documentation générale
- `QUICK_START.md` - Guide de démarrage complet
- `API_DOCS.md` - Documentation API
- `HOOKS_SERVICES.md` - Hooks et services

---

## ✅ Prérequis

- ✅ Node.js v18+ (https://nodejs.org/)
- ✅ npm (inclus avec Node.js)
- ✅ Backend en cours d'exécution (port 3001)
- ✅ Navigateur moderne (Chrome, Firefox, Safari, Edge)

---

**BloodLink** — Partager du sang, c'est partager la vie 🩸
