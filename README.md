# Family Explorer – Les sorties deviennent des aventures

PWA mobile (HTML/CSS/JS, sans build ni dépendance) qui transforme une sortie à Antibes / Juan-les-Pins en mission : chasse au trésor, enquête, nature, défi photo, challenges ou aventure imaginaire.

## Lancer en local

```powershell
node tools/serve.mjs 5188
```

Puis ouvrir http://localhost:5188 (sur téléphone, mode « mobile » des outils développeur).

## Installer sur un téléphone

Une PWA doit être servie en **HTTPS**. Déposez le dossier tel quel sur n'importe quel hébergement statique (Netlify, GitHub Pages, Cloudflare Pages, Vercel…), ouvrez l'URL sur le téléphone puis :
- Android / Chrome : menu ⋮ → « Installer l'application » (ou bouton dans l'onglet Famille) ;
- iPhone / Safari : Partager → « Sur l'écran d'accueil ».

## Structure

| Fichier | Rôle |
|---|---|
| `index.html` | Coquille de l'application et barre d'onglets |
| `css/app.css` | Interface (jetons de couleurs sur `:root`, gros boutons, lisible en plein soleil) |
| `js/data.js` | **Contenu de base** : 12 lieux, missions, 6 types d'aventures, personnages, mots-codes, badges |
| `js/data-extra.js` | **Contenu ajouté** : 4 lieux (Villa Thuret, parc de la Brague, plage de la Salis, musée Peynet), missions supplémentaires, missions de saison, nouveaux scénarios |
| `js/art.js` | **Kit graphique** SVG maison : mascotte Pistou (5 expressions, 11 costumes), 52 objets et pictogrammes, médailles, carte au trésor illustrée |
| `js/photos.js` | **Photos réelles** (23, Wikimedia Commons) avec auteur, licence et source ; photos de repère par mission |
| `js/generator.js` | Générateur d'aventures (lieu, âges, durée, type, météo, heure, missions déjà jouées) |
| `js/app.js` | Écrans : Accueil, Explorer, Aventure, Collection, Famille + création / aperçu / souvenir |
| `js/store.js` | Sauvegarde locale (localStorage + photos dans IndexedDB), export / import |
| `js/souvenir.js` | Carte souvenir PNG (titre, date, participants, photos, badges) |
| `sw.js` | Service worker : fonctionnement hors connexion, cache des tuiles de carte |
| `tools/make-icons.mjs` | Regénère les icônes PNG (`node tools/make-icons.mjs`) |

## Ajouter du contenu

Le plus simple est d'ajouter dans `js/data-extra.js` (fusionné automatiquement au chargement), ou directement dans `js/data.js` :
- **un lieu** : ajouter un objet dans `PLACES` (coordonnées, consignes de sécurité, badge, missions) ;
- **une mission** : `{ id, kind, types, title, easy, hard }`, avec `quiz` pour une énigme, `timer` pour un chrono, `wx` pour exiger une météo, `coop` pour une mission d'équipe, `seasons` / `months` pour une mission de saison, `outdoor` pour l'exclure des musées ;
- **un badge** : ajouter une entrée dans `COLLECTIONS` avec sa condition `cond(stats, aventure)`.

Après modification, incrémenter `VERSION` dans `sw.js` pour mettre à jour les téléphones déjà installés.

## Bibliothèque visuelle

Trois familles de visuels, un seul univers « carnet d'explorateur » :
1. **Photographies réelles** (`js/photos.js`) pour reconnaître lieux et objets : bandeau de chaque lieu et « photo de repère » dans certaines missions (pour les énigmes, elle s'affiche une fois la réponse trouvée). Licences libres uniquement (CC0, domaine public, CC BY, CC BY-SA) ; l'auteur et la licence sont affichés sous chaque image et dans **Famille › Crédits**.
2. **Illustrations** (`js/art.js`) : Pistou, le renard explorateur, déguisé selon le guide (pirate, détective, botaniste…) et selon le rôle de chaque enfant.
3. **Éléments de jeu** : objets, pictogrammes de missions, médailles de badges, parchemins, lettres du code, carte au trésor.

Toute la bibliothèque est visible dans l'app : **Famille › Bibliothèque visuelle**.

Pour ajouter une photo : choisir un fichier sous licence libre sur Wikimedia Commons, l'ajouter dans `PHOTOS` (`src` = vignette 960 px, `author`, `license`, `licenseUrl`, `page`) puis l'associer à un lieu (`place`) ou à une mission (`STEP_PHOTOS`).

⚠️ Avant un usage commercial : le Nomade de Jaume Plensa est une œuvre récente protégée, et la France n'a pas de « liberté de panorama » pour les œuvres d'art. Sa photo est sous licence libre, mais l'œuvre elle-même reste protégée. Mieux vaut la retirer ou demander l'accord de l'artiste.

## Services externes (facultatifs)

- Météo : [Open-Meteo](https://open-meteo.com) (sans clé), pour Antibes uniquement ; la position n'est jamais envoyée.
- Carte : Leaflet + tuiles © OpenStreetMap (nécessite internet ; les tuiles vues sont gardées en cache).
- Polices : Google Fonts (Baloo 2, Nunito).
- Photos : vignettes chargées depuis Wikimedia Commons, préchargées au lancement d'une aventure et gardées en cache pour le hors-connexion.
