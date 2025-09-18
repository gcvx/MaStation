# 🚗 Visualiseur de Données des Stations-Service

Une application web moderne pour visualiser et analyser les données des stations-service françaises, utilisant les données ouvertes de prix-carburants.gouv.fr.

## ✨ Fonctionnalités

- **Statistiques en temps réel** : Vue d'ensemble des prix par type de carburant avec moyennes, médianes, min/max
- **Carte interactive** : Localisation des stations avec filtres avancés et calcul de distances
- **Table détaillée** : Toutes les informations des stations avec pagination et filtres
- **Graphiques de distribution** : Visualisation des prix par type de carburant
- **Filtres intelligents** : Par localisation, type de carburant, services, et plus
- **Mise en cache** : Stockage local pour des performances optimales

## 🚀 Déploiement sur GitHub Pages

### Étape 1: Préparer votre repository

1. **Créer un nouveau repository GitHub** :
   ```bash
   # Créez un nouveau repository sur GitHub (public)
   # Par exemple: votre-nom/stations-service-app
   ```

2. **Cloner et pousser le code** :
   ```bash
   git clone https://github.com/votre-nom/stations-service-app.git
   cd stations-service-app
   
   # Copier tous les fichiers de ce projet dans le nouveau repository
   # Puis :
   git add .
   git commit -m "Initial commit: Station service data viewer"
   git push origin main
   ```

### Étape 2: Configuration pour GitHub Pages

3. **Modifier le fichier `vite.config.ts`** :
   Créez ou modifiez le fichier `vite.config.ts` à la racine du projet :
   ```typescript
   import { defineConfig } from 'vite'
   import react from '@vitejs/plugin-react-swc'
   import path from 'path'

   export default defineConfig({
     plugins: [react()],
     base: '/nom-de-votre-repository/', // Remplacez par le nom de votre repository
     resolve: {
       alias: {
         '@': path.resolve(__dirname, './src'),
       },
     },
     build: {
       outDir: 'dist',
       sourcemap: false,
       rollupOptions: {
         external: [],
         output: {
           manualChunks: {
             vendor: ['react', 'react-dom'],
             leaflet: ['leaflet', 'react-leaflet'],
             ui: ['@radix-ui/react-tabs', '@radix-ui/react-select', '@radix-ui/react-slider']
           }
         }
       }
     },
     optimizeDeps: {
       include: ['leaflet', 'react-leaflet']
     }
   })
   ```

4. **Créer le workflow GitHub Actions** :
   Créez le fichier `.github/workflows/deploy.yml` :
   ```yaml
   name: Deploy to GitHub Pages

   on:
     push:
       branches: [ main ]
     pull_request:
       branches: [ main ]

   jobs:
     build-and-deploy:
       runs-on: ubuntu-latest
       
       permissions:
         contents: read
         pages: write
         id-token: write

       steps:
       - name: Checkout
         uses: actions/checkout@v4

       - name: Setup Node.js
         uses: actions/setup-node@v4
         with:
           node-version: '18'
           cache: 'npm'

       - name: Install dependencies
         run: npm ci

       - name: Build
         run: npm run build

       - name: Setup Pages
         uses: actions/configure-pages@v4

       - name: Upload artifact
         uses: actions/upload-pages-artifact@v3
         with:
           path: './dist'

       - name: Deploy to GitHub Pages
         id: deployment
         uses: actions/deploy-pages@v4
   ```

### Étape 3: Activer GitHub Pages

5. **Configurer GitHub Pages** :
   - Allez dans les **Settings** de votre repository GitHub
   - Cliquez sur **Pages** dans le menu de gauche
   - Sous **Source**, sélectionnez **GitHub Actions**
   - Sauvegardez les paramètres

6. **Déclencher le déploiement** :
   ```bash
   # Faites un commit pour déclencher le workflow
   git add .
   git commit -m "Add GitHub Pages deployment configuration"
   git push origin main
   ```

### Étape 4: Vérification

7. **Vérifier le déploiement** :
   - Allez dans l'onglet **Actions** de votre repository
   - Vérifiez que le workflow s'exécute sans erreur
   - Une fois terminé, votre site sera disponible à :
     ```
     https://votre-nom.github.io/nom-de-votre-repository/
     ```

## 🛠️ Développement Local

### Prérequis
- Node.js 18+ 
- npm ou yarn

### Installation
```bash
npm install
```

### Développement
```bash
npm run dev
```

### Build de production
```bash
npm run build
```

### Aperçu de la build
```bash
npm run preview
```

## 📦 Structure du Projet

```
src/
├── components/          # Composants React
│   ├── ui/             # Composants UI (shadcn)
│   ├── StationTable.tsx
│   ├── StationMap.tsx
│   ├── StatisticsView.tsx
│   └── ...
├── lib/                # Utilitaires et services
│   ├── dataService.ts  # Service de récupération des données
│   ├── translations.ts # Traductions française
│   └── utils.ts
├── types/              # Types TypeScript
│   └── station.ts
├── App.tsx             # Composant principal
└── main.tsx           # Point d'entrée
```

## 🔧 Technologies Utilisées

- **React 19** - Framework frontend
- **TypeScript** - Typage statique
- **Tailwind CSS** - Styling
- **Shadcn/ui** - Composants UI
- **Leaflet** - Cartes interactives
- **Recharts** - Graphiques
- **Vite** - Build tool
- **GitHub Actions** - CI/CD

## 📊 Source des Données

Les données proviennent de l'API ouverte du gouvernement français :
- **URL de base** : https://donnees.roulez-eco.fr/opendata/
- **Endpoints disponibles** :
  - `/instantane` - Données instantanées
  - `/jour` - Données quotidiennes
- **Format** : XML compressé en ZIP
- **Mise à jour** : Régulière

## 📄 License

This project was created with GitHub Spark. The Spark Template files and resources from GitHub are licensed under the terms of the MIT license, Copyright GitHub, Inc.