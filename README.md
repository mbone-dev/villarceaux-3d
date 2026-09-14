# Villarceaux 3D — trou 1

Projet de visite du trou 1, « La Via Calciata », pour préparer une future simulation Android.

**État : refonte en cours, récupérée et réorganisée après interruption de l’environnement de développement.** Ce dépôt n’est pas une copie binaire intégrale du site initial. Il conserve le code reconstituable, les contours, les scripts d’acquisition et les corrections entreprises. Il ne signifie pas que la nouvelle version est publiée ni que son rendu est validé.

La version précédemment publiée est [accessible ici](https://villarceaux-trou-un-studio.maisonneuve-erwan.chatgpt.site). Son archive et son origine sont identifiées dans `data/recovery-manifest.json`.

## Reprendre le projet

Node.js 22 ou ultérieur :

```sh
npm install
npm run assets
npm test
npm run dev
```

`npm run assets` acquiert une grille IGN réelle et des matériaux PBR auprès de Poly Haven. Il échoue explicitement si les données requises manquent : aucun relief de remplacement n’est inventé. Il conserve une grille déjà importée dans `public/assets/terrain-grid.json`. Les textures sont choisies parmi des entrées existantes du catalogue ; leur adéquation artistique reste à contrôler, notamment la finesse du gazon. Les téléchargements, identifiants et empreintes sont conservés dans `public/assets/materials.json`.

`npm run build` produit une visite statique dans `dist/`. Les fichiers binaires sont ignorés par Git ; le workflow de revue les conserve avec le résultat et les captures pendant 30 jours. Pour conserver indéfiniment un jeu de matériaux choisi, l’importer ensuite dans un stockage durable adapté.

## Corrections prises en compte

- L’axe horizontal est corrigé : avec une caméra regardant vers +Z, la droite du joueur correspond à −X dans la scène. La D142 est donc à droite.
- La route est subdivisée tous les 2 m et suit le terrain au lieu de relier quelques altitudes par de grandes faces.
- Le départ comporte une haie persistante à droite, un talus boisé à gauche, une clôture droite plus longue et une clôture gauche courte.
- Quatre arbres à ramure ouverte sont interprétés derrière le green à partir de la troisième référence.
- Les bunkers ont des contours lissés, un creusement et une lèvre. Ces détails ne sont pas des mesures.
- Les matériaux utilisent des cartes de couleur et de normales. Les arbres sont instanciés et ont deux niveaux de détail selon la distance.

## Références et précision

Le plan du trou est conservé dans `data/course-layout.json`, en mètres : X vers la droite du joueur, Z vers le green. Le rendu reflète X ; les données originales ne changent pas de convention.

Départ : longitude 1.711045, latitude 49.115037. Green : longitude 1.70716, latitude 49.11686. Grille IGN : 29 × 56 points, pas de 10 m, emprise locale X −140..140 m, Z −70..480 m. La distance entre les repères est proche de 348 m ; la carte officielle indique 353 m depuis les blancs.

- [Fiche officielle du trou 1](https://www.villarceaux.com/grand-parcours-trou-1/)
- [Plan du trou](https://www.villarceaux.com/wp-content/uploads/2019/01/1-697x1024.jpg)
- [Photo du départ](https://www.villarceaux.com/wp-content/uploads/2019/01/Trou-1.jpg)
- [Plan général](https://www.villarceaux.com/wp-content/uploads/2022/05/Plan-Golf-de-Villarceaux-2.png)
- [Documentation altimétrique IGN](https://cartes.gouv.fr/aide/fr/guides-utilisateur/utiliser-les-services-de-la-geoplateforme/calcul-altimetrique/)
- Orthophoto IGN : service `https://data.geopf.fr/wms-r`, couche `ORTHOIMAGERY.ORTHOPHOTOS`, emprise de référence [1.706,49.1148,1.712,49.1178], CRS:84.
- Trois captures fournies par l’utilisateur : départ, approche, green. Elles ne sont pas copiées dans ce dépôt, car leurs fichiers ne sont plus accessibles depuis les outils de cette session.

L’espèce et le placement des arbres, les haies, la profondeur des bunkers et les détails du tee sont interprétés. La grille 10 m ne permet pas une simulation crédible des pentes fines du putting.

## Validation et limites

Le workflow **Vérifier la scène** construit le projet, vérifie que la route se projette à droite, teste les commandes et produit des captures départ / approche / green / survol / mobile. Un workflow présent n’est pas un workflow réussi : consulter son résultat.

Les captures sont produites par un rendu logiciel sur un ordinateur de CI. Elles ne prouvent ni des performances Android ni une fidélité photographique. Les paramètres de lumière, l’échelle du gazon et la végétation doivent être comparés aux trois références avant de déclarer la refonte satisfaisante.

Le bouton GLB exporte uniquement le maillage du terrain avec un matériau uni. Il n’exporte pas le shader de gazon ni les arbres. La physique de balle, le putting et l’intégration Android restent à réaliser.

## Dépendances et droits

Three.js 0.169.0 et EZ-Tree 1.1.0 sont utilisés comme dépendances npm, sous leurs licences MIT respectives. Les matériaux Poly Haven sont sous CC0 et leurs références exactes sont enregistrées à l’acquisition. Les cartes et photos du club sont citées comme références, pas redistribuées.

Aucun identifiant d’accès, jeton GitHub ou secret de publication ne doit être ajouté au dépôt.
