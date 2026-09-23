# LAKANA - SYSTEME DE CONFORMITE LBC/FT/FP POUR SFD ET MICROFINANCE

Plateforme integree de filtrage, de surveillance transactionnelle et d'aide a la decision reglementaire pour les Systemes Financiers Decentralises (SFD).
Conforme aux directives UEMOA, aux instructions de la BCEAO et aux recommandations CENTIF.

Projet presente au Hackathon National d'Innovation CIF 2026 - Programme DigiCoop-WA+
Equipe : Digi.Dev

---

## 1. PRESENTATION DU SYSTEME

LAKANA est une solution logicielle concue pour repondre aux exigences legales et operationnelles de lutte contre le blanchiment de capitaux, le financement du terrorisme et la proliferation des armes (LBC/FT/FP) dans l'espace UEMOA.

### Architecture non-intrusive
Le systeme s'integre directement en ecoute et en lecture sur la base de donnees du Core Banking System (CBS) de l'institution financiere. Il ne modifie en aucun cas les structures de donnees ou les regles internes du systeme bancaire existant.

### Modele d'habilitations strict (RBAC)
Le systeme applique une separation rigoureuse des responsabilites autour de deux profils metier exclusifs :
- Analyste de conformite : administration du referentiel des Personnes Politiquement Exposees (PPE), examen approfondi des alertes, arbitrage des operations suspendues au guichet, emission des declarations de soupcon a destination de la CENTIF.
- Agent guichet : verification immediate pre-transactionnelle, execution des flux financiers avec declenchement automatique du pare-feu reglementaire, consultation des decisions d'arbitrage et remise des recus certifies.

---

## 2. FONCTIONNALITES PRINCIPALES

### A. Gestion dynamique du referentiel PPE
- Importation directe de listes au format CSV avec identification automatique des separateurs (point-virgule, virgule, tabulation) et mappage souple des champs (Nom, Fonction, Agence, Numero de compte, Lieu de residence/naissance).
- Ajout manuel unitaire et radiation de societaire du registre des PPE en temps reel avec mise a jour instantanee des profils clients.
- Croisement phonetique et orthographique haute performance via l'algorithme RapidFuzz, calibre pour le traitement des patronymes d'Afrique de l'Ouest.

### B. Interception au guichet et arbitrage en direct
- Verification automatique lors de l'enregistrement de toute operation financiere au guichet (depot d'especes, retrait, virement).
- Suspension automatique de l'operation des lors que le societaire figure au registre des PPE ou que le montant atteint le seuil reglementaire UEMOA (5 000 000 FCFA) ou un seuil d'alerte renforcee (15 000 000 FCFA).
- Envoi simultane et instantane d'une notification WhatsApp et d'un courriel officiel aux analystes de conformite enregistres et a l'agent guichet.
- Interface d'arbitrage permettant a l'analyste d'accorder une derogation justifiee ou de consigner un refus formel.
- Transmission immediate de la decision sur le terminal guichet pour finaliser la transaction ou bloquer les fonds, avec emission d'une piste d'audit SHA-256.

### C. Surveillance des schemas de fractionnement (Smurfing)
- Analyse des operations multiples sur fenetre glissante de 48 heures pour detecter les depots fractionnes destines a contourner le seuil declaratif de 5 000 000 FCFA.

### D. Dossiers d'investigation et declarations CENTIF
- Fiche deSynthese Client 360 degres integrant l'indice de risque composite (0 a 100 points).
- Visualisation matricielle des relations financieres entre comptes et beneficiaires.
- Generation de rapports d'instruction formels exportables au format PDF pour transmission a la CENTIF.

---

## 3. PILE TECHNOLOGIQUE ET DEPENDANCES

### Backend
- Langage : Python 3.10 ou superieur
- Framework API : FastAPI (v0.109+) avec Pydantic v2 pour la validation stricte des contrats de donnees
- Serveur ASGI : Uvicorn avec rechargement a chaud
- Base de donnees et ORM : PostgreSQL 16 (production) avec compatibilite SQLite integree pour les environnements de test, orchestres via SQLAlchemy 2.0
- Moteur de filtrage : RapidFuzz 3.6+ pour l'appariement flou des identites
- Analyse statistique et apprentissage : Scikit-learn, NumPy
- Passerelle de messagerie WhatsApp : Httpx via l'API REST WasenderAPI (format international E.164)
- Passerelle de messagerie Courriel : Module standard smtplib avec chiffrement TLS (port 587)
- Generation documentaire : ReportLab pour l'exportation des fiches reglementaires PDF

### Frontend
- Environnement d'execution : Node.js (version 18 ou superieure) et npm
- Framework applicatif : Next.js 16 (App Router, React 19, TypeScript 5)
- Feuilles de style : TailwindCSS v4 configure sans feuille parasite
- Iconographie : Lucide React (bibliotheque d'icones vectorielles fonctionnelles)
- Composants d'interface : Primitives Radix UI
- Notifications utilisateur : Sonner

---

## 4. GUIDE D'INSTALLATION ET DE DEPLOYEMENT

### Prerequis systeme
- Git
- Python 3.10+ avec gestionnaire de paquets pip
- Node.js 18+ avec npm
- PostgreSQL 16 (facultatif, un fichier local SQLite est instancie automatiquement en l'absence d'instance active)

---

### Etape 1 : Configuration des variables d'environnement

Creer un fichier `.env` a la racine du dossier `backend/` sur la base du modele suivant :

```ini
# Configuration générale
PROJECT_NAME="LAKANA API"
VERSION="1.0.0"

# Base de données (PostgreSQL ou fallback SQLite)
DATABASE_URL="postgresql://postgres:password@localhost:5432/lakana_db"

# Sécurité JWT
SECRET_KEY="votre_cle_secrete_de_developpement_lakana_2026"
ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES=480

# Règles de conformité
SEUIL_DECLARATION_CENTIF=5000000.0
FENETRE_FRACTIONNEMENT_HEURES=48
SEUIL_SIMILARITE_SANCTIONS=80.0

# Passerelle WhatsApp (WasenderAPI)
WASENDER_API_KEY=""
WASENDER_BASE_URL="https://wasenderapi.com/api"
WASENDER_ALERT_PHONE="+22364663918"

# Passerelle Courriel (SMTP)
ALERT_EMAIL="fombadaouda72@gmail.com"
SMTP_SERVER="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="fombadaouda72@gmail.com"
SMTP_PASSWORD=""
SMTP_FROM="fombadaouda72@gmail.com"
SMTP_TLS=True
```

---

### Etape 2 : Lancement du Backend (API FastAPI)

Ouvrir un premier terminal :

```bash
cd backend

# Creation et activation de l'environnement virtuel
python -m venv .venv

# Sous Linux/macOS :
source .venv/bin/activate
# Sous Windows (PowerShell) :
.venv\Scripts\Activate.ps1

# Installation des dependances
pip install -r requirements.txt

# Demarrage du serveur FastAPI
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Le backend demarre sur :
- API REST : http://localhost:8000
- Documentation OpenAPI (Swagger) : http://localhost:8000/docs

---

### Etape 3 : Lancement du Frontend (Application Next.js)

Ouvrir un second terminal :

```bash
cd frontend

# Installation des dependances
npm install

# Demarrage du serveur de developpement
npm run dev
```

L'application est accessible a l'adresse : http://localhost:3000

---

## 5. PROTOCOLE DE TEST POUR LE JURY (DEMONSTRATION METIER)

Ce guide permet aux membres du jury de verifier l'ensemble du cycle de conformite en conditions reelles en moins de 10 minutes.

### Test 1 : Authentification et cloisonnement des roles
1. Naviguer sur http://localhost:3000.
2. Deux roles sont disponibles :
   - Analyste de conformite (par exemple : Aminata Toure, login : `aminata.toure@sfd-bamako.ml`, mot de passe : `password123`)
   - Agent guichet (par exemple : Bakary Diarra, login : `bakary.diarra@sfd-bamako.ml`, mot de passe : `password123`)
3. Verifier la separation des menus : l'agent guichet n'a pas acces a l'instruction des dossiers CENTIF ni a la configuration systeme.

### Test 2 : Referentiel PPE et importation de fichier CSV
1. Se connecter avec le profil Analyste de conformite.
2. Ouvrir le menu "Verification Sanctions & PPE", puis cliquer sur le sous-onglet "Referentiel PPE & Import CSV".
3. Cliquer sur "Importer un CSV" et selectionner un fichier contenant des noms et fonctions de personnalites publiques.
4. Constater l'integration immediate des enregistrements sans modification du Core Banking existant.
5. Utiliser le bouton "Ajouter une PPE" pour creer une entree unitaire ou cliquer sur l'icone de suppression pour retirer un societaire de la surveillance active.

### Test 3 : Simulation guichet et interception en temps reel
1. Basculer sur le menu "Controle & Pre-filtrage Societaire" (onglet Controle Societaire).
2. Selectionner un societaire figurant au registre des PPE (ou avec montant eleve).
3. Dans la section "Guichet Bancaire : Execution d'Operation & Interception LAKANA", saisir :
   - Type d'operation : Retrait Especes
   - Montant : 6 500 000 FCFA
   - Motif : Achat intrants agricoles
4. Cliquer sur "Valider & Executer au Guichet (Trigger CBS)".
5. Constater le declenchement instantane du pare-feu :
   - L'operation passe au statut "OPERATION INTERCEPTEE - EN ATTENTE DU VISA DE CONFORMITE".
   - Une notification WhatsApp et un courriel de mise en demeure sont expedies simultanement aux analystes enregistres (+223 64663918 et fombadaouda72@gmail.com).

### Test 4 : Arbitrage de conformite et delivrance du recu guichet
1. Directement sous la transaction suspendue (ou dans l'onglet "File d'Arbitrage") :
2. L'analyste saisit le motif de son analyse reglementaire (ex : "Justificatifs de mandat et bordereau de provenance valides").
3. Cliquer sur "Accorder la Derogation (Autoriser)".
4. Constater l'actualisation instantanee du statut :
   - Message de validation a l'ecran avec attribution d'une reference d'audit SHA-256.
   - Message de confirmation WhatsApp transmis au guichet autorisant le decaissement des fonds.
   - Le bouton "Imprimer recu" devient actif pour permettre la cloture de l'operation.

### Test 5 : Traitement des alertes de fractionnement et rapport CENTIF
1. Ouvrir le menu "Gestion des Alertes".
2. Examiner les alertes de fractionnement (Smurfing) detectees sur fenetre de 48 heures.
3. Cliquer sur une alerte pour ouvrir le dossier d'investigation associe, instruire la cause et generer la fiche declarative pre-formatee pour la CENTIF.

---

## 6. CADRE REGLEMENTAIRE DE REFERENCE

Le moteur de regles LAKANA s'appuie rigoureusement sur les textes officiels suivants :
- Directive n°02/2015/CM/UEMOA sur la lutte contre le blanchiment de capitaux et le financement du terrorisme dans les Etats membres de l'UEMOA.
- Instruction n°003/2020 de la BCEAO fixant les regles de vigilance et de declaration applicables aux institutions financieres et SFD.
- Recommandations n°12 et n°20 du Groupe d'Action Financiere (GAFI) concernant les Personnes Politiquement Exposees et les Declarations d'Operations Suspectes (DOS).
- Loi uniforme relative a la lutte contre le blanchiment de capitaux applicable au Mali et dans les pays membres de l'UMOA.
