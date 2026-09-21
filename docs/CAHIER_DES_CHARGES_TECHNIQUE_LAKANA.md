# Cahier des charges technique — LAKANA
### Guide de réalisation pour une équipe sans expérience préalable en IA
Digi.Dev — Hackathon National d'Innovation CIF 2026 (DigiCoop-WA+)

---

## 0. Lisez ceci avant tout le reste

Votre équipe n'a jamais fait de projet IA. C'est normal, et ce n'est **pas un obstacle** — à condition de ne pas essayer de faire ce que font les grandes fintechs. Le principe qui gouverne tout ce document :

> **On ne va PAS entraîner de modèle de machine learning.** On va construire un système à base de règles métier explicites (facile à coder, facile à expliquer à un jury, facile à déboguer) et, pour la touche "IA", on va appeler une API d'intelligence artificielle existante (comme on appelle une météo API) plutôt que d'en construire une nous-mêmes.

Ce choix n'est pas un compromis par manque d'ambition — c'est **la bonne architecture** même pour une vraie fintech à ce stade : un système de règles explicable est ce qu'un régulateur préfère de toute façon, parce qu'on peut justifier chaque alerte ligne par ligne. Vous allez donc construire quelque chose de réellement défendable, pas juste une démo.

Tout ce document part de ce principe. Chaque choix technique ci-dessous a été fait pour être **appris et codé par des débutants en moins de 72h**, pas pour impressionner un CV.

---

## 1. Vue d'ensemble du système à construire

```
[Données clients/transactions]
        │
        ▼
[1. Import / simulation de données]
        │
        ▼
[2. Moteur de filtrage]  ──── fuzzy matching contre listes sanctions/PPE
        │
        ▼
[3. Moteur de scoring]  ──── règles pondérées → Risk Score explicable
        │
        ▼
[4. Moteur de détection comportementale] ── comparaison historique vs récent
        │
        ▼
[5. Moteur d'alertes] ──── classement Bloquante / À analyser / Informative
        │
        ▼
[6. Interface conformité] ── Dashboard, Client 360°, Graphe, Investigations
        │
        ▼
[7. Assistant IA] ──── appel API LLM pour expliquer une alerte en langage clair
        │
        ▼
[Décision humaine de l'analyste]
```

Chaque bloc numéroté correspond à un module que vous pouvez développer et tester **indépendamment**, puis assembler. C'est la clé pour une équipe débutante : ne jamais attendre d'avoir "tout" pour tester quelque chose.

---

## 2. Stack technique recommandée (et pourquoi)

### 2.1 Vue d'ensemble

| Couche | Choix | Pourquoi ce choix pour des débutants |
|---|---|---|
| Frontend | **React + Vite + TailwindCSS** | Immense documentation, tutoriels vidéo abondants, TailwindCSS évite d'écrire du CSS manuellement (gain de temps énorme en 72h) |
| Backend | **Python + FastAPI** | Syntaxe simple, documentation interactive générée automatiquement (Swagger), messages d'erreur clairs, très proche de la logique métier |
| Base de données | **PostgreSQL** (ou SQLite pour démarrer) | SQL classique, aucune notion exotique à apprendre ; SQLite = zéro configuration pour développer en local dès le jour 1 |
| Scoring / règles | **Python natif** (dictionnaires + fonctions) | Pas de librairie ML à apprendre — un score est une somme pondérée de règles, codable en quelques heures |
| Fuzzy matching | **RapidFuzz** (librairie Python) | Une ligne de code pour comparer deux noms ; pas besoin de comprendre l'algorithme sous-jacent |
| Graphe de relations | **NetworkX** (Python) + **React Flow** (affichage) | Calcul du graphe en Python (simple), affichage visuel prêt à l'emploi côté React — **pas besoin de Neo4j** pour un MVP |
| Assistant IA | **API Claude ou équivalent**, appelée depuis le backend | Vous n'entraînez rien : vous envoyez les données de l'alerte dans un texte, l'API répond une explication en français |
| Authentification | **JWT simple** (librairie `python-jose` ou équivalent) | Standard, tutoriels FastAPI officiels très clairs sur ce point précis |
| Déploiement | **Docker Compose** en local + **Railway ou Render** pour la démo en ligne | Un seul fichier de config démarre toute l'application ; hébergement gratuit pour une démo de hackathon |

### 2.2 Ce qu'on évite délibérément (et pourquoi)

| Techno tentante | Pourquoi on l'évite pour ce projet |
|---|---|
| Entraîner un modèle de Machine Learning (scikit-learn, TensorFlow…) | Nécessite des données d'entraînement réelles que vous n'avez pas, un temps de mise au point que vous n'avez pas, et un modèle non entraîné correctement ferait moins bien qu'un bon système de règles. **Mentionnez-le en roadmap V2, ne le codez pas pour le MVP.** |
| Neo4j (base de données graphe) | Excellent outil, mais ajoute un système entier à apprendre en 72h pour un gain marginal face à NetworkX + une table SQL classique. |
| Microservices / Kubernetes | Sur-ingénierie totale pour un MVP à 4-5 personnes. Une seule application backend suffit. |
| Frameworks frontend complexes (Next.js, Angular) | React simple + Vite suffit largement et a une courbe d'apprentissage bien plus douce. |

**Règle d'or : à chaque fois qu'une techno vous semble impressionnante mais que personne dans l'équipe ne la maîtrise, posez-vous la question "est-ce qu'un choix plus simple donne 90% du résultat pour 30% de l'effort ?" La réponse est presque toujours oui en 72h.**

### 2.3 Est-ce que tous les développeurs doivent installer Docker ?

**Oui, les 4 développeurs — pas le designer (sauf s'il veut voir l'app tourner en local).**

Voici pourquoi ce n'est pas optionnel pour l'équipe technique : sans Docker, chaque développeur doit installer PostgreSQL, la bonne version de Python et la bonne version de Node.js **manuellement**, et le moindre écart de version entre deux machines ("chez moi ça marche") devient une source de bugs invisibles et de temps perdu — exactement le genre de friction qu'une équipe débutante ne peut pas se permettre en 72h.

Avec Docker, chaque développeur tape une seule commande (`docker compose up`, voir section 8.1) et obtient un environnement **strictement identique** à celui des trois autres, sans avoir à installer ni configurer quoi que ce soit d'autre. C'est en réalité ce qui *simplifie* le travail d'un débutant, pas ce qui le complique.

Ce qu'il faut réellement apprendre — et rien de plus :
- Installer **Docker Desktop** (Windows/Mac) ou **Docker Engine** (Linux) — un seul téléchargement, avant le hackathon si possible.
- Retenir **deux commandes** : `docker compose up` (démarrer) et `docker compose down` (arrêter). C'est suffisant à 95% du temps.
- Aucun développeur n'a besoin de savoir écrire un `Dockerfile` — le Lead Dev le prépare une seule fois pour toute l'équipe (voir 6.2).

Le designer n'a pas besoin de Docker s'il travaille uniquement sur des maquettes Figma. S'il veut voir l'interface réelle tourner en local pour ajuster ses recommandations visuelles, il peut installer Docker aussi — c'est la même commande unique pour lui.

---

## 3. Comment "faire de l'IA" sans expérience IA

C'est le point qui vous inquiète le plus — voici la méthode concrète.

### 3.1 Le Risk Score : ce n'est PAS du Machine Learning, c'est un score pondéré

Un Risk Score explicable se construit comme une grille d'évaluation, pas comme un modèle entraîné :

```python
def calculer_risk_score(client, transactions_recentes, historique):
    score = 0
    facteurs = []

    # Règle 1 : montant inhabituel
    montant_moyen_historique = historique["montant_moyen"]
    montant_moyen_recent = moyenne([t["montant"] for t in transactions_recentes])
    if montant_moyen_recent > montant_moyen_historique * 3:
        score += 25
        facteurs.append("Volume de transaction 3x supérieur à l'habitude")

    # Règle 2 : fréquence inhabituelle
    if len(transactions_recentes) > historique["frequence_moyenne"] * 2:
        score += 20
        facteurs.append("Fréquence de transactions anormalement élevée")

    # Règle 3 : fractionnement potentiel (plusieurs montants proches du seuil)
    montants_proches_seuil = [t for t in transactions_recentes if 900000 <= t["montant"] < 1000000]
    if len(montants_proches_seuil) >= 3:
        score += 30
        facteurs.append(f"{len(montants_proches_seuil)} transactions groupées juste sous le seuil de déclaration")

    # Règle 4 : correspondance PPE ou liste de sanctions
    if client["est_ppe"]:
        score += 15
        facteurs.append("Client classé Personne Politiquement Exposée")

    return {"score": min(score, 100), "facteurs": facteurs}
```

C'est tout. Ce sont ~40 lignes de Python que n'importe quel membre de l'équipe peut écrire, tester et faire évoluer en ajustant les seuils. **C'est exactement ce qu'un jury conformité veut voir** : un score qu'on peut justifier ligne par ligne, contrairement à une boîte noire de Machine Learning.

### 3.2 L'assistant IA : un appel API, pas un modèle

Pour la fonctionnalité "Assistant IA d'aide à l'analyse", vous n'avez rien à entraîner. Vous envoyez le contexte de l'alerte à une API existante et récupérez une explication en français :

```python
import anthropic

client_ia = anthropic.Anthropic(api_key="VOTRE_CLE_API")

def expliquer_alerte(client_data, facteurs_risque, score):
    prompt = f"""Tu es un assistant pour un analyste conformité LBC/FT au Mali.
Explique en 3-4 phrases claires, en français, pourquoi ce client présente
un risque, à partir de ces éléments factuels uniquement (n'invente rien) :

Score de risque : {score}/100
Facteurs détectés : {", ".join(facteurs_risque)}

Ta réponse doit rester factuelle et se terminer en rappelant que la décision
finale revient à l'analyste."""

    reponse = client_ia.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=300,
        messages=[{"role": "user", "content": prompt}]
    )
    return reponse.content[0].text
```

Point important pour la démo et pour votre crédibilité devant le jury : **l'IA ne fait qu'expliquer un score déjà calculé par vos règles — elle ne décide de rien.** C'est plus simple à coder, plus robuste, et plus défendable.

Si vous n'avez pas accès à une clé API pendant le hackathon (coût, connectivité), prévoyez un plan B : un générateur de phrase basé sur un template Python (`f"Ce client est à risque {niveau} en raison de : {', '.join(facteurs)}"`). Moins impressionnant, mais fonctionnel à 100% et sans dépendance externe — mentionnez ce compromis assumé au jury plutôt que de risquer une démo qui plante.

### 3.3 Le fuzzy matching : une librairie, pas un algorithme à inventer

```python
from rapidfuzz import fuzz

def comparer_noms(nom_client, liste_sanctions):
    resultats = []
    for entree in liste_sanctions:
        score_similarite = fuzz.ratio(nom_client.lower(), entree["nom"].lower())
        if score_similarite > 80:  # seuil à ajuster
            resultats.append({"nom_liste": entree["nom"], "similarite": score_similarite})
    return resultats
```

Trois lignes utiles. `pip install rapidfuzz` et c'est prêt.

### 3.4 Le graphe de relations : calcul simple, affichage prêt à l'emploi

```python
import networkx as nx

def construire_graphe(client_id, comptes, transactions):
    G = nx.Graph()
    G.add_node(client_id, type="client")
    for compte in comptes:
        G.add_node(compte["id"], type="compte")
        G.add_edge(client_id, compte["id"])
    for t in transactions:
        G.add_edge(t["compte_source"], t["compte_destination"])
    # Convertir en JSON pour l'envoyer au frontend
    return {"noeuds": list(G.nodes(data=True)), "liens": list(G.edges())}
```

Côté frontend, la librairie **React Flow** affiche ce JSON en graphe interactif sans code de rendu complexe à écrire.

---

## 4. Modèle de données (base de données)

Six tables suffisent pour le MVP :

| Table | Champs clés |
|---|---|
| `clients` | id, nom, date_naissance, profession, est_ppe (bool), niveau_risque, date_creation |
| `comptes` | id, client_id, type_compte, solde, date_ouverture |
| `transactions` | id, compte_source_id, compte_destination_id, montant, date, type |
| `alertes` | id, client_id, type_alerte (bloquante/analyser/informative), score, facteurs (JSON), statut, date_creation |
| `investigations` | id, alerte_id, analyste_id, notes, decision, date_cloture |
| `utilisateurs` | id, nom, role (analyste/responsable), mot_de_passe_hash |

Utilisez le champ `facteurs` en JSON (PostgreSQL supporte le type `JSONB` nativement) pour stocker la liste des raisons d'une alerte sans créer une table séparée — plus simple pour un MVP.

---

## 5. Endpoints API à construire (liste de référence)

```
POST   /api/clients                    → créer un client
GET    /api/clients/{id}               → fiche Client 360°
POST   /api/transactions                → enregistrer une transaction (déclenche l'analyse)
GET    /api/clients/{id}/score         → recalculer/consulter le Risk Score
GET    /api/alertes                    → liste des alertes, filtrable par statut/priorité
GET    /api/alertes/{id}               → détail d'une alerte + facteurs
POST   /api/alertes/{id}/investigation → ouvrir un dossier d'investigation
PUT    /api/investigations/{id}        → mettre à jour/clôturer une investigation
GET    /api/clients/{id}/graphe        → données du graphe de relations
POST   /api/filtrage                   → vérifier un nom contre les listes sanctions/PPE
POST   /api/assistant-ia               → obtenir une explication en langage naturel
POST   /api/auth/login                 → authentification
```

FastAPI génère automatiquement une documentation interactive de ces routes sur `/docs` — utilisez-la constamment pendant le développement pour tester chaque endpoint sans avoir besoin du frontend.

---

## 6. Méthodologie de développement pour 72h — équipe de 5 (4 développeurs + 1 designer)

Votre organisation — un lead qui crée le dépôt et les branches, qui organise le travail — est exactement la bonne approche pour une équipe de débutants : elle évite que chacun improvise sa propre façon de faire, et elle évite les conflits Git en amont plutôt que de les gérer dans l'urgence. Voici comment la structurer complètement.

### 6.1 Rôles et responsabilités précis

| Rôle | Qui | Responsabilités |
|---|---|---|
| **Lead Dev** | 1 des 4 développeurs | Crée le dépôt GitHub, met en place Docker Compose et le squelette FastAPI + React (H0-H4), crée les branches de chaque module, définit le modèle de données commun, **relit et fusionne toutes les Pull Requests**, arbitre les décisions techniques en cas de désaccord, code lui-même le module Import de données + Risk Score (le cœur du système, à faire en premier car les autres modules en dépendent). |
| **Dev 2** | 1 développeur | Module Filtrage sanctions/PPE (fuzzy matching) + Centre d'alertes et priorisation. |
| **Dev 3** | 1 développeur | Module Détection comportementale/fractionnement + Gestion des investigations. |
| **Dev 4** | 1 développeur | Module Graphe de relations + Client 360° + intégration de l'Assistant IA. |
| **Designer** | 1 personne | Maquettes Figma de tous les écrans **avant** que les développeurs n'attaquent le frontend (H0-H12, priorité absolue), charte graphique (couleurs, typographie, code couleur des alertes rouge/orange/bleu), puis accompagne chaque développeur pour intégrer proprement les styles TailwindCSS, prépare les visuels du pitch final (slides, captures d'écran soignées). |

Cette répartition reprend le découpage vertical du plan initial, simplement consolidé à 4 personnes au lieu de 5 : le Lead absorbe le module "Import + Risk Score" en plus de la coordination, parce que c'est le module dont tous les autres dépendent (personne ne peut tester une alerte sans un score déjà calculé) — il doit donc être prêt en premier, et c'est plus sûr que ce soit le lead qui le porte.

### 6.2 Mise en place par le Lead Dev (à faire dans les 4 premières heures)

1. **Créer le dépôt GitHub**, avec un `README.md` minimal et un `.gitignore` (incluant `.env`, `node_modules/`, `__pycache__/`).
2. **Protéger la branche `main`** dans les réglages GitHub : aucun push direct autorisé, seules les Pull Requests peuvent la modifier. Ça oblige toute l'équipe (lead inclus) à passer par une revue, même rapide — c'est ce qui évite qu'un push mal testé casse le travail des autres.
3. **Poser le squelette commun** : `docker-compose.yml` (section 8.1), structure de dossiers (`/backend`, `/frontend`, `/docs`), un endpoint `/health` côté FastAPI qui répond "OK", un écran React qui l'affiche. Ça valide que toute la chaîne fonctionne avant que quiconque commence sa fonctionnalité.
4. **Créer une branche par module**, à partir de `main` :
   ```bash
   git checkout main
   git checkout -b feature/import-risk-score      # Lead
   git checkout main
   git checkout -b feature/filtrage-alertes        # Dev 2
   git checkout main
   git checkout -b feature/comportement-investigation  # Dev 3
   git checkout main
   git checkout -b feature/graphe-assistant-ia      # Dev 4
   git push origin --all
   ```
5. **Partager le modèle de données** (section 4) avec toute l'équipe avant que chacun ne commence à coder — c'est le contrat commun qui permet à 4 personnes de travailler en parallèle sans se marcher dessus.

### 6.3 Git au quotidien — règles simples à respecter absolument

```bash
# Chaque développeur travaille sur SA branche, jamais directement sur main
git checkout feature/filtrage-alertes

# Commits fréquents et clairs, en français ou en anglais mais toujours descriptifs
git commit -m "Ajoute le calcul de similarité fuzzy matching sur les noms"

# Avant de pousser : toujours récupérer les derniers changements de main
git checkout main
git pull origin main
git checkout feature/filtrage-alertes
git merge main          # résout les conflits ici, à petite échelle, pas dans la PR finale

# Puis on pousse sa branche et on ouvre une Pull Request vers main
git push origin feature/filtrage-alertes
```

**Le lead relit chaque Pull Request avant de la fusionner** — même une relecture de 5 minutes suffit : est-ce que ça fonctionne, est-ce que ça respecte le modèle de données commun, est-ce qu'il y a une clé API ou un mot de passe oublié dans le code. Cette étape n'est pas de la bureaucratie : c'est ce qui évite qu'une erreur d'un membre casse le travail des trois autres à quelques heures du pitch.

**Fusionnez vers `main` au moins toutes les 4 à 6 heures**, même si le module n'est pas terminé (tant que le code ne casse rien) — mieux vaut un petit conflit fréquent et vite résolu qu'un conflit énorme à la 60ème heure entre quatre branches parties trop loin les unes des autres.

### 6.4 Definition of Done — quand une Pull Request est-elle prête ?

Avant d'ouvrir une PR, chaque développeur vérifie :
- [ ] Le code s'exécute sans erreur via `docker compose up`.
- [ ] L'endpoint concerné est testé manuellement sur `/docs` (Swagger) et fonctionne avec des données réalistes.
- [ ] Aucune clé API, mot de passe ou donnée sensible n'est codée en dur dans le fichier.
- [ ] Le module respecte les noms de champs du modèle de données commun (section 4) — sinon l'intégration avec les autres modules casse.

### 6.5 Kanban (GitHub Projects, gratuit et déjà intégré au dépôt)

Trois colonnes suffisent : **À faire / En cours / En revue (PR ouverte) / Terminé**. Chaque tâche = une carte assignée à une personne, liée à sa branche. Le Lead Dev l'actualise à chaque stand-up ; c'est aussi son meilleur outil pour repérer qui est bloqué.

### 6.6 Stand-up toutes les 6 heures (pas seulement le matin)

En hackathon de 72h, un stand-up quotidien classique est trop rare. Le Lead Dev anime un point de 5-10 minutes toutes les 6 heures : qu'est-ce qui est fait, qu'est-ce qui bloque, qui a besoin d'aide. C'est aussi le moment où le lead décide de réassigner quelqu'un si un module avance plus vite que prévu et qu'un autre est bloqué.

### 6.7 Communication continue

Un canal unique (WhatsApp, Discord ou Slack) dédié au hackathon, séparé des discussions générales de l'équipe — pour que personne ne rate un message bloquant ("j'ai changé le nom du champ `montant` en `amount`, mettez à jour vos appels API") au milieu d'une conversation sans rapport.

---

## 7. Plan de développement heure par heure

| Bloc horaire | Lead Dev | Dev 2 | Dev 3 | Dev 4 | Designer |
|---|---|---|---|---|---|
| **H0–H4** | Crée le dépôt, Docker Compose, squelette FastAPI+React, branches (section 6.2) | Installe son environnement, explore le squelette | Installe son environnement, explore le squelette | Installe son environnement, explore le squelette | Démarre les maquettes Figma : dashboard, liste d'alertes, Client 360° |
| **H4–H12** | Modèle de données commun (section 4), tables créées, jeu de données simulé | Étudie la structure des listes de sanctions/PPE à utiliser | Étudie la logique de détection comportementale à coder | Étudie NetworkX et React Flow | Termine les maquettes + charte graphique (couleurs alertes rouge/orange/bleu) |
| **H12–H24** | Risk Score fonctionnel, testable via `/docs` | Fuzzy matching fonctionnel sur liste d'exemple | Commence la détection comportementale (comparaison historique) | Commence le calcul du graphe en backend | Livre les maquettes à l'équipe, commence l'intégration Tailwind avec le Lead |
| **H24–H36** | Écrans frontend de base (liste clients, fiche client) + connexion au backend | Écran de résultat du filtrage | Détection du fractionnement | Premier rendu du graphe avec React Flow | Ajuste les styles avec chaque développeur au fur et à mesure des écrans |
| **H36–H48** | Intègre les PR des autres modules, résout les conflits | Centre d'alertes avec priorisation visuelle | Dossier d'investigation (création, notes) | Fiche Client 360° | Peaufine dashboard et centre d'alertes |
| **H48–H56** | Authentification (JWT) | Finalise alertes + tests | Finalise investigations + tests | Assistant IA branché à l'API | Prépare les visuels du pitch (slides, captures) |
| **H56–H64** | Nettoyage des bugs critiques uniquement — **pas de nouvelle fonctionnalité après H56** | idem | idem | idem | Finalise le support de présentation |
| **H64–H70** | Déploiement de la démo (section 8), jeu de données soigné | Aide au déploiement/tests | Aide au déploiement/tests | Aide au déploiement/tests | Répétition du pitch avec le produit réel |
| **H70–H72** | Marge de sécurité pour un imprévu technique + repos avant la présentation | | | | |

**Règle non négociable : à H56, vous arrêtez d'ajouter des fonctionnalités, quoi qu'il arrive.** Une démo qui montre 6 fonctionnalités qui marchent parfaitement bat toujours une démo qui en montre 10 dont 3 plantent en direct.

---

## 8. Déploiement

### 8.1 En local pendant le développement — Docker Compose

Un seul fichier permet à toute l'équipe de lancer l'application identique sur chaque machine :

```yaml
# docker-compose.yml
version: "3.8"
services:
  db:
    image: postgres:16
    environment:
      POSTGRES_DB: aml_shield
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: motdepasse_dev
    ports:
      - "5432:5432"

  backend:
    build: ./backend
    ports:
      - "8000:8000"
    depends_on:
      - db
    environment:
      DATABASE_URL: postgresql://admin:motdepasse_dev@db:5432/aml_shield

  frontend:
    build: ./frontend
    ports:
      - "5173:5173"
    depends_on:
      - backend
```

`docker compose up` démarre toute l'application. C'est le seul point à faire fonctionner impérativement dès H0-H4.

### 8.2 Pour la démo/pitch — hébergement simple

- **Backend** : **Render** est recommandé en priorité — offre gratuite sans carte bancaire, backend + PostgreSQL + site statique inclus, adaptée à un usage continu pendant plusieurs jours avant la présentation. Railway fonctionne aussi très bien mais son offre gratuite est un petit crédit de démarrage qui peut s'épuiser si l'app reste allumée plusieurs jours d'affilée — réservez-le à une démo ponctuelle si vous l'utilisez.
- **Frontend** : Vercel ou Netlify (déploiement automatique à chaque push sur `main`, offre gratuite généreuse).
- **Base de données** : PostgreSQL gratuit intégré à Render suffit largement pour une démo.

**Aucun nom de domaine à acheter.** Chaque plateforme fournit automatiquement une adresse gratuite et fonctionnelle en HTTPS, du type `aml-shield-mali.vercel.app` ou `aml-shield-backend.onrender.com` — c'est un vrai lien partageable, cliquable depuis n'importe quel appareil, exactement ce qu'il faut pour la démo. Un nom de domaine personnalisé (`.ml`, `.com`…) est une option purement esthétique, jamais un pré-requis technique.

Faites ce déploiement dès le **H24**, avec une version minimale — pas d'attendre la dernière minute. Vous garderez ainsi une version en ligne fonctionnelle en permanence, même si votre version locale a un bug temporaire pendant que vous codez.

---

## 9. Sécurité et bonnes pratiques (niveau MVP, mais non négociables)

- **Jamais de mot de passe en clair** : utilisez `bcrypt` ou `passlib` pour hacher les mots de passe, même pour une démo.
- **Jamais de clé API dans le code** : mettez-la dans un fichier `.env` (non commité sur Git — ajoutez `.env` à votre `.gitignore` dès H0).
- **Validez les entrées** : FastAPI le fait presque automatiquement avec Pydantic — utilisez cette validation plutôt que de la contourner pour "aller plus vite".
- **HTTPS uniquement en production** : Railway/Vercel le fournissent automatiquement, ne le désactivez pas.

---

## 10. Pièges classiques d'une équipe débutante (à éviter activement)

1. **Vouloir tout faire "propre" dès le début.** En 72h, du code qui fonctionne et qui est compris par l'équipe bat du code parfaitement architecturé mais inachevé.
2. **Négliger les données de démonstration.** Un jury retient une démo avec des exemples réalistes (noms maliens, montants en FCFA cohérents) bien plus qu'une architecture élégante invisible à l'écran.
3. **Développer en silo puis intégrer à la fin.** Intégrez en continu (voir 6.2) — l'intégration de dernière minute est la cause n°1 d'échec en hackathon.
4. **Changer la stack en cours de route** parce qu'un tutoriel vante une autre technologie. Tenez-vous-en à ce document une fois le hackathon commencé.
5. **Ne pas répéter le pitch avec le vrai produit.** Répétez votre présentation en cliquant réellement sur l'application déployée — pas en décrivant ce qu'elle "est censée" faire à partir de slides. Un décalage entre ce que vous dites à l'oral et ce que montre l'écran fait perdre toute crédibilité en quelques secondes.

---

## 11. Checklist finale avant la présentation

- [ ] L'application est accessible en ligne (pas seulement en local) — testez sur un autre réseau/téléphone.
- [ ] Le jeu de données de démo raconte une histoire claire (un client à risque évident, un client normal, pour montrer le contraste).
- [ ] Le parcours complet fonctionne sans bug : Transaction → Détection → Score → Alerte → Investigation → Décision.
- [ ] Chaque membre de l'équipe (y compris le designer) sait présenter au moins un module ou un aspect du produit.
- [ ] Un plan B existe si la connexion internet fait défaut pendant le pitch (captures d'écran ou vidéo de secours).

---

*Ce cahier des charges est un document de travail interne à l'équipe — il ne fait pas partie du dossier de candidature. Faites-le évoluer librement à mesure que vous apprenez.*
