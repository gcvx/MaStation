# 🇫🇷 Visualiseur de Données des Stations-Service

Une application web moderne pour visualiser et analyser les données des stations-service françaises en temps réel. Cette application récupère les données ouvertes de [donnees.roulez-eco.fr](https://donnees.roulez-eco.fr/opendata/instantane) et les présente sous forme de tableaux, statistiques et cartes interactives.

## ✨ Fonctionnalités

- 📊 **Statistiques en temps réel** : Visualisation des prix des carburants par type avec moyennes, médianes, min/max
- 🗺️ **Carte interactive** : Localisation des stations-service avec filtres avancés
- 📋 **Tableau détaillé** : Liste complète des stations avec toutes les informations disponibles
- 🔍 **Filtres puissants** : Recherche par localisation, type de carburant, services, etc.
- 📱 **Interface responsive** : Compatible mobile et desktop
- 🚀 **Performance optimisée** : Mise en cache et pagination intelligente

## 🚀 Déploiement sur GitHub Pages

Cette application peut être déployée facilement sur GitHub Pages. Suivez ces étapes :

### 📋 Prérequis

- Un compte GitHub
- Node.js 18+ installé localement (pour les tests)
- Git installé

### 🔧 Étapes de déploiement

#### 1. Forker ou copier le repository

```bash
# Cloner le repository
git clone https://github.com/votre-username/votre-repo-name.git
cd votre-repo-name

# Ou créer un nouveau repository et copier les fichiers
```

#### 2. Installation des dépendances

```bash
npm install
```

#### 3. Configuration pour GitHub Pages

L'application inclut déjà tous les fichiers nécessaires pour le déploiement :
- `vite.config.standalone.ts` - Configuration Vite sans dépendances GitHub Spark
- `src/App.standalone.tsx` - Version standalone de l'application
- `src/main.standalone.tsx` - Point d'entrée standalone
- `src/hooks/useKV.ts` - Hook de persistance utilisant localStorage
- `.github/workflows/deploy.yml` - Workflow de déploiement automatique

#### 4. Activer GitHub Pages

1. Allez dans les **Settings** de votre repository GitHub
2. Naviguez vers **Pages** dans le menu de gauche
3. Sous **Source**, sélectionnez **GitHub Actions**

#### 5. Configuration automatique (RECOMMANDÉ)

Poussez simplement vers GitHub et le déploiement se fera automatiquement :

```bash
git add .
git commit -m "Initial commit with standalone deployment"
git push origin main
```

Le déploiement se lancera automatiquement ! ✨

#### 6. Configuration manuelle (alternative)

Si vous préférez configurer manuellement :

```bash
# Configurer pour le déploiement standalone
cp vite.config.standalone.ts vite.config.ts
cp src/main.standalone.tsx src/main.tsx
cp src/App.standalone.tsx src/App.tsx

# Construire et déployer
npm run build
npm run deploy
```

### 🌐 Accès à votre application

Après le déploiement, votre application sera accessible à :
```
https://votre-username.github.io/votre-repo-name/
```

### ⚙️ Configuration avancée

#### Personnaliser l'URL de base

Si votre repository a un nom spécifique, modifiez la base dans `vite.config.standalone.ts` :

```typescript
export default defineConfig({
  base: '/votre-repo-name/', // Remplacez par le nom de votre repo
  // ... reste de la configuration
})
```

#### Domaine personnalisé

Pour utiliser un domaine personnalisé :

1. Créez un fichier `public/CNAME` avec votre domaine :
   ```
   votre-domaine.com
   ```
2. Configurez votre DNS pour pointer vers `votre-username.github.io`

## 🛠️ Développement local

### Installation

```bash
npm install
npm run dev
```

L'application sera disponible sur `http://localhost:5173`

### Scripts disponibles

- `npm run dev` - Serveur de développement
- `npm run build` - Build de production
- `npm run preview` - Prévisualisation du build
- `npm run deploy` - Déploiement sur GitHub Pages

### Test de la version standalone

Pour tester la version qui sera déployée sur GitHub Pages :

```bash
# Configuration standalone
cp vite.config.standalone.ts vite.config.ts
cp src/main.standalone.tsx src/main.tsx
cp src/App.standalone.tsx src/App.tsx

# Test local
npm run dev
```

## 📊 Sources des données

Les données proviennent du site officiel du gouvernement français :
- **Source principale** : [donnees.roulez-eco.fr](https://donnees.roulez-eco.fr/opendata/instantane)
- **Documentation** : [prix-carburants.gouv.fr](https://www.prix-carburants.gouv.fr/rubrique/opendata/)
- **Licence** : Licence Ouverte / Open Licence

## 🔧 Technologies utilisées

- **Frontend** : React 19, TypeScript
- **UI** : Tailwind CSS, Radix UI, shadcn/ui
- **Cartes** : Leaflet
- **Graphiques** : Recharts, D3.js
- **Build** : Vite
- **Déploiement** : GitHub Pages, GitHub Actions

## 📝 Structure du projet

```
src/
├── components/         # Composants React réutilisables
├── hooks/             # Hooks personnalisés (useKV, etc.)
├── lib/               # Utilitaires et services
├── types/             # Définitions TypeScript
├── App.standalone.tsx # Version standalone pour GitHub Pages
└── main.standalone.tsx # Point d'entrée standalone
```

## 🐛 Dépannage

### L'application ne se charge pas
- Vérifiez que GitHub Pages est activé dans les settings du repository
- Contrôlez que le workflow de déploiement s'est exécuté sans erreur dans l'onglet Actions
- Vérifiez la configuration de la base URL dans `vite.config.ts`

### Erreurs de CORS
- L'application utilise plusieurs stratégies de fallback pour récupérer les données
- Les proxies CORS publics sont utilisés automatiquement si nécessaire

### Données non à jour
- Cliquez sur "Actualiser les données" pour forcer une nouvelle récupération
- Les données sont mises en cache localement pour améliorer les performances

### Problèmes de carte
- Vérifiez que Leaflet CSS est bien chargé dans index.html
- Consultez la console du navigateur pour des erreurs JavaScript

### Caractères chinois au lieu d'accents français
- L'application inclut une correction automatique des encodages
- Si le problème persiste, vérifiez l'encodage du fichier source

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à :
- Signaler des bugs
- Proposer des améliorations
- Soumettre des pull requests

## 📄 Licence

Ce projet est sous licence MIT. Les données sont sous Licence Ouverte du gouvernement français.

---

**Support** : Si cette application vous est utile, considérez [m'offrir un café](https://www.buymeacoffee.com/gcvx) ! ☕

## 🚀 Déploiement rapide

Pour déployer rapidement cette application :

1. **Fork** ce repository
2. **Activez GitHub Pages** dans Settings > Pages > Source: GitHub Actions
3. **Push** vers la branche main
4. **Attendez** que le déploiement se termine (onglet Actions)
5. **Accédez** à votre app sur `https://votre-username.github.io/votre-repo-name/`

C'est tout ! 🎉