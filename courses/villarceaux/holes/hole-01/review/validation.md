# Validation V1

## Commandes exécutées

- `npm install`
- `npm run typecheck`
- `npm run test`
- `npm run build`
- `npm run preview:web -- --host 0.0.0.0 --port 4173`

## Contrôles manuels

- Démarrage viewer web avec rendu terrain + objets au chargement.
- Vérification des vues Départ / Fairway / Green / Ensemble.
- Vérification visite automatique démarrer/arrêter et retour initial.
- Vérification panneau provenance/version/limites.
- Vérification gestion reduced-motion (autotour désactivé).
- Tentative de capture automatisée via outil Playwright de session: échec (`Transport closed`), donc aucune capture binaire ajoutée dans ce commit.

## Limites connues

- Reconstitution visuelle estimée sans relevé topographique certifié.
- Aucun benchmark FPS garanti dans ce dépôt; profils qualité fournis pour tests réels.
