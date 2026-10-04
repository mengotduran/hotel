# FRIMA Guest Suites, site web & système de gestion

Site public et système de gestion-comptabilité pour **FRIMA Guest Suites**,
Ntoun, à proximité de l'aéroport de Nsimalen (Yaoundé, Cameroun).

Une seule application sert les deux faces :

| | |
| --- | --- |
| **`/`** | le **site public**, avec hébergements, tarifs et disponibilités en direct, réservation en ligne, actualités |
| **`/admin`** | l'**espace de gestion** : occupation, caisse, facturation, comptabilité générale et analytique, contenu du site |

Interface bilingue **français / anglais**, montants en **FCFA (XAF)**,
comptabilité selon le référentiel **SYSCOHADA révisé (OHADA)**.

---

## Démarrage

```bash
npm install
npx prisma migrate deploy     # crée data/frima.db
npm run db:seed               # plan comptable, départements, unités, prestations
npm run db:photos             # 3 illustrations par unité (voir ci-dessous)
npm run db:demo               # optionnel : un mois d'activité + actualités + demandes
npm run dev                   # http://localhost:3000
```

`next dev` affiche aussi une adresse réseau (`http://192.168.x.x:3000`) : c'est
par là que la réception accède à l'espace de gestion depuis le réseau de
l'hôtel. La base est un **fichier SQLite unique** (`data/frima.db`) et les
photos sont dans `data/uploads/`, une sauvegarde consiste à copier `data/`.

### Mise en production

```bash
npm run build && npm start
```

> **Le site public suppose un accès internet.** L'espace de gestion fonctionne
> hors ligne sur le réseau de l'hôtel, mais pour que des clients trouvent le
> site il faut l'exposer : un petit VPS, ou un tunnel (Cloudflare Tunnel) depuis
> la machine de l'hôtel. Rien dans le code ne fige ce choix.

---

## Le site public

| Page | Contenu |
| --- | --- |
| `/` | Accueil : présentation, services, hébergements mis en avant, dernières actualités |
| `/rooms` | **Toutes les unités**, avec disponibilité et tarif, filtrables par type et par dates |
| `/rooms/[slug]` | Fiche d'un hébergement : galerie, description, équipements, estimation du séjour |
| `/rooms/[slug]/book` | Formulaire de demande de réservation |
| `/booking` | Suivi d'une demande par sa référence |
| `/dining` | Restauration, avec la carte et les prix |
| `/events` | Séminaires et événements, capacités et formules |
| `/blog` + `/blog/[slug]` | Actualités, offres, événements, plus une section **hébergements en direct** |
| `/about`, `/contact` | Présentation de l'établissement, coordonnées, lien Maps |

### Langage visuel

Le site public suit une grammaire éditoriale : bandeau plein écran, grands
titres en graisse légère, intertitres en capitales très espacées, beaucoup de
blanc entre les bandes, et des apparitions au défilement.

- **Navigation en tiroir.** Le menu est un panneau flottant, détaché des bords,
  qui s'ouvre sur un arrière-plan flouté et assombri. Trois onglets (*Séjour*,
  *Services*, *L'hôtel*) regroupent les liens sous des intertitres en italique,
  chaque groupe se terminant par « Tout voir ». L'appel à l'action est fixé au
  bas du panneau. Au clavier : `Échap` ferme, `Tab` reste prisonnier du panneau,
  et le défilement de la page est bloqué tant qu'il est ouvert.
- **En-tête en verre dépoli.** Transparent au-dessus d'un bandeau. Il
  s'efface pendant la lecture vers le bas et revient en verre dépoli
  (`backdrop-filter` avec saturation) dès qu'on remonte. Un repli opaque prend
  le relais là où `backdrop-filter` n'existe pas.
- **Apparitions au défilement.** Chaque bande monte en fondu via
  `IntersectionObserver`. `prefers-reduced-motion` les désactive, et sans
  JavaScript un bloc `<noscript>` lève l'état masqué, donc le contenu reste
  lisible. Les outils automatisés (Lighthouse, robots, captures) peuvent couper
  le flux temps réel avec `?nolive=1`, sinon la connexion ouverte les ferait
  attendre indéfiniment.

La palette reste celle de FRIMA : bleu nuit et or du logo. Seules la mise en
page et les interactions sont inspirées de la référence.

### Photographies

Le site tourne sur un jeu de photographies libres de droits (licence Unsplash),
récupérées et contrôlées automatiquement :

```bash
npm run db:fetch-photos     # télécharge le lot et rejette les images floues
npm run db:import-photos    # les répartit sur les unités
```

Chaque candidate est décodée, mesurée et notée : toute image sous 1500 px de
large, trop compressée, ou dont la mesure de netteté passe sous le seuil est
**rejetée** plutôt que publiée. Une photo floue abîme plus la page qu'une photo
absente.

Les unités d'un même type reçoivent des **lots différents** : l'image de tête ne
se répète jamais d'une unité à l'autre, tandis que les vues secondaires (salles
d'eau, coins bureau) peuvent se partager, comme dans un vrai établissement.

> Ce sont des photographies d'autres établissements. Elles tiennent la place
> jusqu'à la séance photo de FRIMA et doivent être remplacées avant la mise en
> ligne publique.

Pour vos propres photos, déposez-les dans `photos/` puis relancez l'import :

| Dossier | S'applique à |
| --- | --- |
| `photos/101/` | l'unité 101 seulement |
| `photos/ROOM/` | toutes les chambres |
| `photos/STUDIO/` | tous les studios |
| `photos/APARTMENT/` | tous les appartements |
| `photos/HALL/` | toutes les salles |

Un dossier nommé d'après une unité précise l'emporte sur le dossier de type.
Les fichiers sont pris dans l'ordre alphabétique : préfixez-les `1-`, `2-`,
`3-` pour choisir la couverture. L'import redimensionne à 2400 px, convertit en
JPEG progressif, supprime les métadonnées de l'appareil et corrige l'orientation.

Comptez **1600 px de large au minimum** : en dessous, l'image paraît floue
derrière un bandeau plein écran, et le script le signale. Les unités sans photo
conservent leurs illustrations.

### Illustrations des hébergements

`npm run db:photos` donne **trois images à chaque unité**, choisies selon son
type :

| Type | Les trois vues |
| --- | --- |
| Chambre | vue d'ensemble · coin bureau · salle d'eau |
| Studio | espace de vie · coin cuisine · salle d'eau |
| Appartement | salon · chambre · balcon |
| Salle | configuration conférence · réunion · réception |

Ce sont des **dessins vectoriels**, rendus en JPEG 1600×1200, pas des
photographies : ils donnent au site une allure finie avant que les vraies
photos existent, sans jamais prétendre montrer l'établissement. Le script est
idempotent, il efface ce qu'il avait produit avant de régénérer, et les
images ajoutées à la main depuis `/admin/content` sont destinées à les
remplacer.

### Identité

Le fichier fourni (`brand/frima-logo.svg`) est une image bitmap transparente
encapsulée dans une balise SVG : il n'y a pas de tracé vectoriel à redimensionner.
`npm run brand:logo` la rend une fois aux tailles réellement utilisées, en WebP
et en PNG, plutôt que d'envoyer les 600 Ko d'origine à chaque visiteur.

```bash
npm run brand:logo     # brand/frima-logo.svg  ->  public/brand/logo-{320,640}.{webp,png}
```

Le bloc se limite à **l'emblème, FRIMA et GUEST SUITES**. La signature et les
coordonnées ne figurent pas dans le fichier fourni et vivent ailleurs dans les
pages.

**Les couleurs du logo ne changent jamais, et rien n'est posé derrière lui.**
Il n'existe pas de version blanche, ni de plaque, ni de fond : le bloc garde sa
vraie transparence partout, y compris sur une photographie et sur le bleu nuit
du pied de page. L'or, le blanc interne du tracé et le dégradé suffisent à le
garder lisible sans habillage supplémentaire.

### Diaporamas

- **Bandeau d'accueil.** Fondu enchaîné plutôt que glissement, pour que le titre
  posé dessus ne bouge jamais. Avance seul, s'arrête quand l'onglet passe en
  arrière-plan ou que la souris survole les commandes, et ne tourne pas du tout
  sous `prefers-reduced-motion`. Glissement du doigt pris en charge.
- **Bandes d'images.** `Rail` masque la barre de défilement du navigateur tout
  en gardant l'inertie et l'accrochage natifs sur mobile, et ajoute flèches,
  navigation au clavier et une fine ligne de progression. `scroll-padding`
  aligne la première image sur la gouttière de la page.

### Lisibilité sur les photographies

Un voile sombre ne suffit pas sur toutes les images : un ciel clair avale un
titre blanc. Les textes posés sur une photographie portent donc une ombre douce
et large (`.on-image`, `.on-image-soft`), et les bandeaux combinent deux voiles,
l'un de bas en haut, l'autre sur le côté où se trouve le texte.

### Mise à jour en direct

Une modification faite dans l'espace de gestion apparaît **sans rechargement**
sur les pages déjà ouvertes chez les visiteurs : changement de tarif, ajout ou
retrait d'une photo, publication d'une unité, passage de libre à réservé,
nouvelle actualité.

Le mécanisme : chaque action d'administration publie un événement sur un bus
interne ; la route `/api/live` le diffuse en *server-sent events* ; le composant
`<LiveRefresh>` rafraîchit l'arbre serveur pour les sujets qui concernent la
page affichée.

> Le bus est volontairement **mono-processus**, ce qui correspond au mode de
> déploiement (un processus Node à côté d'un fichier SQLite). Plusieurs
> instances derrière un répartiteur de charge demanderaient Redis pub/sub.

### Réservation en ligne

Le flux est **demande → confirmation par la réception** :

1. Le visiteur remplit le formulaire sur une unité libre.
2. La demande arrive dans `/admin/bookings` au statut *en attente*. **Elle ne
   bloque pas l'unité** : celle-ci reste proposée à tout le monde. C'est ce qui
   empêche un inconnu d'immobiliser l'hôtel avec un faux nom.
3. La réception confirme, le système revérifie que l'unité est toujours libre,
   crée la fiche client (ou retrouve l'existante par son numéro de téléphone) et
   crée la réservation, ou refuse en indiquant un motif.
4. Le visiteur suit sa demande sur `/booking` avec sa référence (`DEM-2026-0001`).

Le règlement se fait à l'arrivée, à la réception.

---

## L'espace de gestion

| Demande du cahier des charges | Où |
| --- | --- |
| Présentation des différents départements | `/admin/departments` |
| Suivi de l'occupation des chambres, studios et appartements | `/admin/occupancy`, `/admin/rooms` |
| Suivi de l'état des clients | `/admin/clients` |
| Enregistrement des revenus (recettes) | `/admin/invoices`, `/admin/payments` |
| Reçus de caisse numérotés actualisés | `/admin/receipts` |
| Flux de trésorerie (encaissements / décaissements) | `/admin/payments`, `/admin/expenses` |
| État journalier des encaissements et décaissements | `/admin/cashbook` |
| Tableau de bord (revenus, charges, marge, clients, fournisseurs) | `/admin` |
| Comptabilité générale | `/admin/accounting/journal`, `/ledger`, `/trial-balance` |
| Comptabilité analytique par département | `/admin/accounting/analytical` |
| *(ajouté)* Demandes de réservation en ligne | `/admin/bookings` |
| *(ajouté)* Photos, descriptions et tarifs publiés | `/admin/content` |
| *(ajouté)* Actualités du site | `/admin/blog` |

### Les trois départements

| Code | Département | Compte de produits |
| --- | --- | --- |
| `HEB` | Hébergement, ventes de nuitées | `7061` |
| `RES` | Restauration, petit-déjeuner, bar, restaurant | `7062` |
| `ESP` | Disposition d'espace, conférence, réunions | `7063` |

### Les cinq familles de charges directes

`ENERGY` (eau, électricité, carburant) · `RAW_MATERIALS` (denrées et boissons) ·
`ADMIN` (internet, fournitures, encre, impôts) · `OPERATING_SUPPLIES`
(entretien, savons, kits, linge) · `DIRECT_STAFF` (salaires, cotisations).

---

## Comment la comptabilité est tenue

Le point central : **aucune écriture n'est saisie deux fois**. Chaque opération
d'exploitation génère automatiquement son écriture équilibrée, et chaque ligne
de charge ou de produit porte le département qui l'a supportée. C'est ce qui
permet de servir l'angle **général** et l'angle **analytique** depuis une seule
saisie.

| Opération | Journal | Écriture |
| --- | --- | --- |
| Émission d'une facture | `VT` | Débit `411` Clients / Crédit `706x` par département + `4431` TVA |
| Encaissement | `CA` / `BQ` | Débit `5711` / `521` / `531` / Crédit `411` (ou `4191` pour un acompte) |
| Décaissement réglé | `CA` / `BQ` | Débit `6xx` (+ département) + `4452` TVA / Crédit trésorerie |
| Charge à crédit | `AC` | Débit `6xx` (+ département) / Crédit `401` Fournisseurs |
| Règlement fournisseur | `CA` / `BQ` | Débit `401` / Crédit trésorerie |

### Règles qui protègent les documents

- **Les reçus ne sont jamais supprimés.** Une erreur est *annulée* : le reçu
  reste dans la séquence, marqué annulé avec son motif, et l'écriture est
  contre-passée par une écriture miroir. La numérotation reste ininterrompue.
- **Les compteurs sont transactionnels** : un numéro n'est consommé que si
  l'opération aboutit.
- **Une facture émise ne se modifie plus.** Ouverte, la note de séjour s'édite
  librement ; à l'émission elle devient un document figé.
- **La facturation des nuitées** part de la date d'arrivée *réservée* et court
  jusqu'à la date de départ *réelle*, les deux ramenées à minuit, l'heure à
  laquelle le client rend la clé ne peut pas faire basculer un séjour de trois
  nuits sur une quatrième.
- **Le solde d'ouverture est une écriture**, pas un paramètre : la trésorerie
  affichée se rapproche toujours du journal.

### TVA

Taux par défaut **19,25 %** (17,5 % + 10 % de centimes additionnels communaux),
modifiable dans `/admin/settings`. Les prix affichés aux clients sont **TTC** :
le système en extrait la base hors taxe et la TVA collectée.

---

## Vérification

```bash
npm run test     # 126 contrôles sur une base jetable
npm run lint
npm run build
```

- **`tests/e2e.ts` (110 contrôles)** rejoue un cycle complet, client, séjour,
  arrivée, consommations, départ, émission, encaissements partiels, charges,
  annulation, contre-passation, puis le site public : publication des unités,
  retrait d'une unité en maintenance, et le cycle complet d'une demande de
  réservation (capacité, confirmation, création du client et de la réservation,
  double confirmation refusée, conflit de dates, refus motivé). Il vérifie à
  chaque étape que **le journal est équilibré**, que chaque écriture l'est
  individuellement, et que les montants en toutes lettres respectent les règles
  d'accord du français (`quatre-vingt mille`, `deux cents millions`,
  `un million de francs CFA`).
- **`tests/live.ts` (16 contrôles)** vérifie la mise à jour en direct de bout en
  bout dans un même processus : une action publie, la route SSE est abonnée au
  même bus, et les octets qu'un navigateur recevrait portent bien l'événement.

---

## Architecture

```
src/
  app/
    (public)/           site public
    (admin)/admin/      espace de gestion
    api/live/           flux server-sent events
    media/[id]/         service des images téléversées
  components/
    site/               interface du site public
      primitives.tsx    Container, Eyebrow, Reveal, SectionHeading, GhostLink
      NavDrawer.tsx     menu en tiroir (onglets, groupes, CTA fixe)
    admin/              réservations, contenu, actualités
    shell/ ui/ live/    cadre, briques d'interface, abonnement temps réel
  lib/
    accounting/         plan comptable, moteur de double saisie, états
    actions/            server actions, seules portes d'écriture
    availability.ts     disponibilité telle que le site la présente
    live/bus.ts         bus de diffusion interne
    media/storage.ts    stockage des fichiers sur disque
    folio.ts            notes de séjour
    i18n/               dictionnaires FR/EN
    money.ts            FCFA : format et montants en toutes lettres
prisma/
  schema.prisma         modèle de données
  seed.ts               référentiel + contenu public des unités
  demo.ts               jeu de démonstration
  illustrations.ts      scènes vectorielles (chambre, cuisine, salle…)
  photos.ts             rend les illustrations et les rattache aux unités
tests/                  suites de vérification
data/
  frima.db              base SQLite
  uploads/              photos téléversées
```

**Pile technique** : Next.js 16 (App Router, Turbopack) · React 19 ·
TypeScript · Tailwind CSS 4 · Prisma 7 · SQLite.

Les montants sont des **entiers de FCFA**, le franc CFA n'a pas de subdivision
en usage, donc aucun arrondi flottant n'intervient dans les totaux.

---

## À prévoir avant la mise en service

- **Authentification, le point le plus important.** `/admin` n'a pas de
  comptes utilisateurs : toute personne qui atteint l'application y a accès.
  C'était déjà vrai sur le réseau de l'hôtel ; **dès que le site est exposé sur
  internet, l'espace de gestion l'est aussi.** Il faut des identifiants et des
  rôles (réception / comptabilité / direction) avant toute mise en ligne.
- **Photos, à remplacer.** Chaque unité est livrée avec **trois
  illustrations** générées par `npm run db:photos` (dessins vectoriels à plat
  dans la palette de l'établissement, pas des photographies). Elles existent
  pour que le site soit présentable avant la séance photo, et se remplacent une
  par une dans `/admin/content`. JPEG, PNG, WebP ou AVIF, 6 Mo maximum.
- **Sauvegarde.** Copier le dossier `data/` (base + photos) selon un rythme
  défini, une copie quotidienne après l'arrêté de caisse est le minimum.
- **Inventaire réel.** Les 10 chambres/studios/appartements et les 3 espaces
  livrés sont un jeu de départ : à remplacer par l'inventaire réel dans
  `/admin/rooms`, avec les tarifs pratiqués.
- **Taxe de séjour.** Le champ existe dans `/admin/settings` mais n'est pas
  encore appliqué automatiquement aux nuitées ; à activer selon le barème
  communal.
- **Notification des demandes.** Une demande de réservation apparaît dans
  `/admin/bookings` mais n'envoie ni e-mail ni SMS : la réception doit consulter
  la page. Un envoi automatique (e-mail ou WhatsApp) est l'étape suivante
  naturelle.
