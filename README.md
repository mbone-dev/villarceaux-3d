# Villarceaux 3D · Trou 01 (V1 visuelle)

Module web TypeScript + Babylon.js pour visualiser une **reconstitution estimée** du trou 01 du Golf de Villarceaux.

## Démarrage rapide

```bash
npm install
npm run dev:web
```

URL locale par défaut: `http://localhost:5173/`

## Vérifications

```bash
npm run typecheck
npm run test
npm run build
npm run preview:web
```

## Ce que montre la V1

- rendu 3D réel au chargement (terrain, fairway, green, bunker creusé, végétation, barrières, chemin, drapeau)
- vues prédéfinies : Départ / Fairway / Green / Ensemble
- visite automatique démarrer/arrêter + retour initial
- profil qualité `high` / `tablet`
- panneau de provenance/version/limites de précision

## API module viewer

`packages/viewer` expose:

- `mountHoleViewer({ container, sceneData, holeData, quality, autoStartTour })`
- API retournée : `setView`, `startTour`, `stopTour`, `setQuality`, `dispose`

## Structure principale

- `courses/villarceaux/...` : données versionnées séparées du viewer
- `packages/scene-contract` : contrat de statuts et validation ciblée
- `packages/viewer` : moteur de rendu Babylon indépendant
- `apps/web-demo` : démonstrateur intégrable
- `apps/android-host` : notes d'intégration future (non testée)
- `docs/*.md` : conventions, pipeline, limites

## Données documentées / estimées / manquantes

- distance trou 1 `353 m` : `documented` (FFGolf)
- dévers fairway vers la droite, green gauche->droite : `documented` (page club)
- géométrie, pentes fines, positionnement exact : `estimated`
- coordonnées géographiques/altimétrie certifiées : `unknown` (null)

## Références et droits

Registre: `courses/villarceaux/holes/hole-01/references/index.json`

- Les 3 visuels utilisateur restent enregistrés avec statut `pending_binary_access` si les binaires ne sont pas accessibles en session.
- Aucun média protégé n'est redistribué comme texture/source dans cette V1.
