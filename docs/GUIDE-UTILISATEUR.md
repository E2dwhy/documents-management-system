# Guide utilisateur — Suivi de Dossiers par QR Code

Ce guide explique comment utiliser l'application au quotidien : se connecter, créer et faire
circuler un dossier, scanner une étiquette, consulter l'historique, et gérer les paramètres si
vous êtes administrateur. Il ne suppose aucune connaissance technique.

> 💡 L'application fonctionne aussi **hors connexion** pour l'écran Scanner — voir la section
> [Fonctionnement hors ligne](#fonctionnement-hors-ligne).

## Sommaire

1. [Premiers pas](#1-premiers-pas)
2. [Se repérer dans l'application](#2-se-repérer-dans-lapplication)
3. [Le tableau de bord](#3-le-tableau-de-bord)
4. [Gérer les dossiers](#4-gérer-les-dossiers)
5. [Scanner un dossier](#5-scanner-un-dossier)
6. [Fonctionnement hors ligne](#6-fonctionnement-hors-ligne)
7. [Les alertes de retard](#7-les-alertes-de-retard)
8. [L'audit et les exports](#8-laudit-et-les-exports)
9. [Administration (réservé aux administrateurs)](#9-administration-réservé-aux-administrateurs)
10. [Rôles et permissions — tableau récapitulatif](#10-rôles-et-permissions--tableau-récapitulatif)
11. [Questions fréquentes](#11-questions-fréquentes)

---

## 1. Premiers pas

### 1.1 Se connecter

1. Ouvrez l'application dans votre navigateur (ou depuis l'icône, si vous l'avez installée sur
   votre téléphone — voir [1.3](#13-installer-lapplication-sur-votre-téléphone)).
2. Saisissez votre **email** et votre **mot de passe**.
3. Cliquez sur **Connexion**.

Vous n'avez pas encore de compte ? Seul un administrateur peut en créer un pour vous (voir
[9.3 Gérer les utilisateurs](#93-gérer-les-utilisateurs)). Vous recevrez un email pour définir
votre mot de passe.

### 1.2 Mot de passe oublié

1. Sur l'écran de connexion, cliquez sur **Mot de passe oublié**.
2. Saisissez votre email et validez.
3. Un lien vous est envoyé par email pour choisir un nouveau mot de passe.

### 1.3 Installer l'application sur votre téléphone

L'application est une PWA (application web installable) : depuis votre navigateur mobile, ouvrez
le menu puis choisissez **Ajouter à l'écran d'accueil** (ou équivalent selon votre téléphone).
Une fois installée, elle se lance comme une application normale et fonctionne aussi hors
connexion pour le scan.

---

## 2. Se repérer dans l'application

Une fois connecté, une **barre de navigation** apparaît en bas de l'écran avec les rubriques
disponibles pour votre rôle :

| Icône | Rubrique | Description |
|---|---|---|
| 🏠 | **Tableau de bord** | Vue d'ensemble et statistiques |
| 📁 | **Dossiers** | Liste, recherche et création des dossiers |
| 📷 | **Scanner** | Scanner un QR code ou saisir une référence |
| 📋 | **Audit** | Historique complet de tous les mouvements |
| 🔔 | **Alertes** | Notifications de dossiers en retard |
| ⚙️ | **Administration** | Services, types, utilisateurs, paramètres (admin uniquement) |

> Les rubriques affichées dépendent de votre rôle : par exemple, un **auditeur** ne voit pas
> Scanner (lecture seule), et seul un **administrateur** voit Administration. Voir le
> [tableau des rôles](#10-rôles-et-permissions--tableau-récapitulatif).

En haut de l'écran, vous trouverez :
- le **nom de votre organisation** (et son logo, si configuré) ;
- une **icône de synchronisation** (☁️/📡), visible uniquement s'il y a des scans en attente
  d'envoi — voir [Fonctionnement hors ligne](#6-fonctionnement-hors-ligne) ;
- le **menu utilisateur** (votre nom, déconnexion).

---

## 3. Le tableau de bord

C'est l'écran d'accueil après connexion. Il affiche un résumé adapté à votre rôle et votre
service : nombre de dossiers en cours, dossiers en retard, répartition par statut, etc., sous
forme de graphiques.

---

## 4. Gérer les dossiers

### 4.1 Consulter la liste des dossiers

Dans **Dossiers**, vous voyez la liste des dossiers auxquels vous avez accès (voir le
[tableau des rôles](#10-rôles-et-permissions--tableau-récapitulatif) pour savoir lesquels).

Vous pouvez :
- **Rechercher** par référence, titre ou nom du propriétaire ;
- **Filtrer** par statut, service ou type de dossier ;
- **Exporter** la liste filtrée en PDF ou Excel (voir [8.2](#82-exporter-en-pdf-ou-excel)).

### 4.2 Créer un nouveau dossier

> Non disponible pour le rôle **auditeur** (lecture seule).

1. Depuis **Dossiers**, cliquez sur **Nouveau**.
2. Renseignez :
   - **Titre du dossier** (obligatoire) ;
   - **Propriétaire du dossier** — le nom de la personne concernée (optionnel) ;
   - **Type de dossier** — détermine le nombre d'étapes du circuit (par ex. « Demande
     d'attestation » = 2 étapes, « Permis de construire » = 5 étapes) ;
   - **Service initial** — le service qui détient le dossier au départ.
3. Cliquez sur **Créer le dossier et générer le QR**.

Une **référence unique** (format `DOS-AAAA-NNNNN`) et un **QR code** sont générés
automatiquement. Le dossier est prêt à circuler.

### 4.3 La fiche d'un dossier

En ouvrant un dossier depuis la liste, vous voyez :
- sa **référence**, son **titre**, son **propriétaire** et son **statut** (badge coloré :
  *En cours*, *Validé*, *Rejeté*, *Clôturé*, *Archivé*) ;
- sa **progression** dans le circuit (ex. « 1/2 » = une étape sur deux franchie) ;
- ses **informations** : type, service actuel, créé par/le, clôturé par/le le cas échéant ;
- son **historique complet** des mouvements (qui, quand, quelle action, quelle note).

Depuis cette fiche, selon votre rôle et l'état du dossier, des boutons d'action apparaissent :

| Bouton | Effet |
|---|---|
| **Étiquette QR** | Affiche l'étiquette imprimable du dossier (voir [4.4](#44-imprimer-létiquette-qr)) |
| **Scanner** | Ouvre l'écran de confirmation pour enregistrer un mouvement sur ce dossier |
| **Clôturer** | Termine le circuit une fois la dernière étape atteinte |
| **Rouvrir** | Réouvre un dossier clôturé (admin uniquement) |

### 4.4 Imprimer l'étiquette QR

Chaque dossier a une étiquette QR à coller sur le dossier physique.

1. Depuis la fiche du dossier, cliquez sur **Étiquette QR**.
2. Cliquez sur **Imprimer**.

L'étiquette contient le nom de l'organisation, le QR code, la référence, le titre et le type du
dossier — au format adapté à une imprimante d'étiquettes (80×50 mm).

### 4.5 Clôturer un dossier

Un dossier ne peut être clôturé qu'une fois **toutes ses étapes franchies** (progression
complète, ex. « 2/2 »). Le bouton **Clôturer** n'apparaît qu'à ce moment-là, pour un
**administrateur** ou un **responsable de service** sur les dossiers de son service.

### 4.6 Rouvrir un dossier

Seul un **administrateur** peut rouvrir un dossier clôturé, depuis sa fiche, en cliquant sur
**Rouvrir**. À utiliser en cas d'erreur de clôture.

---

## 5. Scanner un dossier

C'est l'action la plus fréquente : enregistrer le passage d'un dossier d'un service à un autre,
ou sa validation/son rejet.

> Non disponible pour le rôle **auditeur** (lecture seule).

### 5.1 Démarrer un scan

Deux façons d'y arriver :
- **Depuis la rubrique Scanner** (barre de navigation) : scannez n'importe quel QR code à la
  caméra, ou saisissez manuellement la référence du dossier (`DOS-AAAA-NNNNN`).
- **Depuis la fiche d'un dossier déjà ouverte** : cliquez sur le bouton **Scanner**.

### 5.2 Confirmer l'action

Une fois le dossier identifié, choisissez l'action à enregistrer :

| Action | Effet |
|---|---|
| **Transférer** | Envoie le dossier vers un autre service (à sélectionner dans la liste) |
| **Valider** | Marque l'étape actuelle comme validée |
| **Rejeter** | Marque le dossier comme rejeté |

Vous pouvez ajouter une **note** optionnelle (commentaire libre, 2000 caractères max.), puis
cliquez sur **Confirmer**.

Le mouvement est immédiatement ajouté à l'historique du dossier, et sa progression est mise à
jour.

### 5.3 Enchaîner plusieurs scans

Depuis la rubrique **Scanner**, après confirmation, vous revenez automatiquement à l'écran de
saisie pour scanner le dossier suivant — pratique pour traiter une pile de dossiers à la suite.

---

## 6. Fonctionnement hors ligne

L'écran **Scanner** fonctionne **même sans connexion internet** — utile sur le terrain ou en cas
de coupure réseau.

**Comment ça marche :**

1. Chaque scan est d'abord enregistré **sur votre appareil**, que vous soyez en ligne ou non.
2. S'il y a du réseau, il est envoyé immédiatement.
3. S'il n'y a pas de réseau, il reste **« en attente »** : une pastille apparaît sur l'icône ☁️
   en haut de l'écran, avec le nombre de mouvements en attente.
4. Dès que la connexion revient, l'envoi se relance automatiquement (et une vérification a
   lieu toutes les minutes en filet de sécurité).
5. Vous pouvez aussi forcer l'envoi manuellement : cliquez sur l'icône ☁️, puis sur
   **Synchroniser maintenant**.

**En cas de problème** (par exemple, le dossier a été clôturé entre-temps par quelqu'un d'autre) :
le mouvement reste visible dans la liste d'attente avec un message d'erreur clair, et vous pouvez
soit **Réessayer**, soit **Ignorer**.

**Limite à connaître :** un dossier ne peut être scanné hors ligne que si vous l'avez **déjà
consulté au moins une fois en ligne** (fiche du dossier ou écran Scanner). Sans connexion,
l'application n'a aucun moyen de reconnaître un dossier jamais vu auparavant.

> 🔒 Chaque scan porte un identifiant unique généré sur votre appareil : même s'il est envoyé
> deux fois par erreur (par ex. après une coupure réseau), il ne sera **jamais compté deux
> fois**.

---

## 7. Les alertes de retard

Un dossier est considéré **en retard** lorsque le temps écoulé depuis son **dernier mouvement**
dépasse le seuil défini pour son type (par exemple 48h pour une demande d'attestation).

Dans la rubrique **Alertes**, vous retrouvez la liste des dossiers signalés en retard. La
vérification se fait automatiquement toutes les heures. Un administrateur peut aussi la
déclencher manuellement avec le bouton **Vérifier maintenant**.

Une pastille sur l'icône 🔔 de la barre de navigation indique le nombre d'alertes non lues.

---

## 8. L'audit et les exports

### 8.1 Consulter l'historique complet

> Réservé aux rôles **administrateur** et **auditeur**.

La rubrique **Audit** liste **tous les mouvements**, tous dossiers et tous services confondus —
utile pour un contrôle global ou une recherche précise (par service, par utilisateur, par
période).

### 8.2 Exporter en PDF ou Excel

Disponible à la fois sur la liste des **Dossiers** et sur l'**Audit**, via les boutons **PDF** et
**Excel** en haut de la liste.

> ⚠️ L'export porte toujours sur **l'ensemble des lignes filtrées**, pas seulement sur celles
> affichées à l'écran. Pensez à ajuster vos filtres avant d'exporter si vous voulez restreindre
> le résultat.

---

## 9. Administration (réservé aux administrateurs)

Seul le rôle **administrateur** voit la rubrique **Administration**, qui regroupe quatre écrans.

### 9.1 Gérer les services

Un **service** est un bureau/département par lequel les dossiers circulent (ex. Accueil,
Secrétariat Général, Direction Juridique…).

- **Créer** un service : nom + description.
- **Modifier** ou **désactiver** un service existant (un service désactivé n'apparaît plus dans
  les listes de destination pour un transfert, mais son historique reste intact).

### 9.2 Gérer les types de dossiers

Un **type de dossier** définit le circuit qu'un dossier suivra :
- son **nombre d'étapes** (`max_scans`) — combien de scans sont nécessaires avant de pouvoir
  clôturer un dossier de ce type ;
- son **seuil de retard**, en heures — au-delà duquel un dossier sans mouvement est signalé
  comme en retard (voir [7. Les alertes de retard](#7-les-alertes-de-retard)).

### 9.3 Gérer les utilisateurs

Depuis **Administration → Utilisateurs**, vous pouvez :

1. **Inviter un utilisateur** :
   - cliquez sur **Inviter** ;
   - renseignez son **email**, son **nom complet**, son **rôle** et, si pertinent, son
     **service** ;
   - un email est envoyé automatiquement à la personne pour qu'elle définisse son mot de
     passe.
2. **Modifier** le rôle ou le service d'un utilisateur existant.
3. **Activer/désactiver** un compte — un compte désactivé ne peut plus se connecter, mais son
   historique d'actions passées reste conservé.

### 9.4 Paramètres de l'organisation

Depuis **Administration → Paramètres**, personnalisez :
- le **nom de l'organisation**, affiché dans l'en-tête, les étiquettes QR et les exports ;
- le **logo**.

---

## 10. Rôles et permissions — tableau récapitulatif

| Rôle | Ce qu'il peut faire |
|---|---|
| **Administrateur** | Accès complet : gère services, types de dossiers et utilisateurs ; voit et modifie tous les dossiers ; seul rôle pouvant rouvrir un dossier clôturé. |
| **Responsable de service** | Scanne, transfère et clôture les dossiers de son service ; consulte leur historique. |
| **Agent** | Crée des dossiers, scanne/transfère, consulte l'historique des dossiers de son service ou qu'il a créés lui-même. |
| **Auditeur** | Lecture seule : consultation des dossiers, de l'historique et des exports. Ne peut ni créer, ni scanner, ni modifier quoi que ce soit. |

---

## 11. Questions fréquentes

**Je ne vois pas la rubrique Administration.**
Elle n'est visible que pour le rôle administrateur. Contactez votre administrateur si vous pensez
devoir y avoir accès.

**Le bouton « Clôturer » n'apparaît pas sur un dossier.**
Il n'apparaît que lorsque toutes les étapes du circuit ont été franchies (progression complète,
ex. « 2/2 »), et uniquement pour un administrateur ou un responsable du service concerné.

**J'ai scanné un dossier hors connexion, et rien ne semble s'être passé.**
C'est normal : le mouvement est enregistré sur votre appareil et affiché « en attente » (icône ☁️
en haut de l'écran). Il sera envoyé automatiquement dès que la connexion reviendra — vous pouvez
aussi cliquer sur **Synchroniser maintenant** une fois en ligne.

**Le scanner me dit qu'un dossier n'est pas disponible hors ligne.**
Vous devez avoir consulté ce dossier au moins une fois en ligne (sa fiche ou l'écran Scanner)
avant de pouvoir le scanner hors connexion.

**J'ai oublié mon mot de passe.**
Depuis l'écran de connexion, cliquez sur **Mot de passe oublié** et suivez les instructions
reçues par email.

**Comment obtenir un compte ?**
Seul un administrateur peut créer votre compte (voir [9.3](#93-gérer-les-utilisateurs)). Vous
recevrez un email pour définir votre mot de passe.
