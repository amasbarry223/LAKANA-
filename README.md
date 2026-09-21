# LAKANA — « Le Bouclier » 🛡️
### Plateforme Intelligente de Filtrage Clients et de Conformité LBC/FT/FP pour les Systèmes Financiers Décentralisés (SFD)
**Hackathon National d'Innovation CIF 2026 — Programme DigiCoop-WA+ | Équipe Digi.Dev**

---

## 1. Organisation du Projet

Le projet est organisé selon les meilleures pratiques d'ingénierie logicielle en deux sous-systèmes découplés :

```
LAKANA/
├── docker-compose.yml              # Orchestre PostgreSQL + FastAPI Backend + Next.js Frontend
├── docs/                           # Cahiers des charges, guides d'équipe et notes de cadrage
│   ├── CAHIER_DES_CHARGES_TECHNIQUE_LAKANA.md
│   ├── LAKANA_Guide_Equipe_Developpement.docx
│   ├── LAKANA_note_explicative_v3.docx
│   └── ...
│
├── frontend/                       # Interface Utilisateur Next.js 16 / React 19 / TailwindCSS v4
│   ├── src/                        # 18 vues complètes (Client 360°, Graphe, Investigations, etc.)
│   ├── public/
│   ├── package.json
│   └── ...
│
└── backend/                        # API REST FastAPI & Moteur de Règles LBC/FT/FP
    ├── Dockerfile
    ├── requirements.txt
    ├── app/
    │   ├── core/                   # Configuration pydantic-settings, sécurité JWT
    │   ├── db/                     # Session SQLAlchemy (PostgreSQL / fallback dev SQLite) & seeds
    │   ├── models/                 # Modèles ORM (Client, Compte, Transaction, Alerte, etc.)
    │   ├── schemas/                # Validation & DTOs Pydantic v2
    │   ├── repositories/           # Couche d'accès aux données (Principe DIP / SOLID)
    │   ├── services/               # Logique métier pure (Scoring, Filtrage, Fractionnement, IA...)
    │   ├── api/v1/                 # Endpoints REST documentés via OpenAPI / Swagger
    │   └── main.py                 # Application FastAPI
```

---

## 2. Principes Architecturaux & SOLID

* **Single Responsibility Principle (SRP) :** Chaque service métier a une responsabilité unique (`ScoringService` calcule les scores, `FilteringService` gère le fuzzy matching, `StructuringService` analyse les séquences sous seuil).
* **Dependency Inversion Principle (DIP) :** Les routes API dépendent d'abstractions de repositories et de sessions injectées (`Depends(get_db)`).
* **Explicabilité & Décision Humaine :** L'Assistant IA explique les facteurs calculés de manière 100 % déterministe et factuelle (IA-02) et rappelle obligatoirement que la décision finale revient à l'agent humain habilité (IA-03).
* **Double compatibilité Base de données :** Conçu nativement pour **PostgreSQL 16** avec détection et fallback transparent sur **SQLite** local pour les tests sans conteneur actif.

---

## 3. Démarrage Rapide

### Option A : Avec Docker Compose (Recommandé)

Démarre PostgreSQL, FastAPI et Next.js en une seule commande :
```bash
docker compose up --build
```
* **Frontend :** [http://localhost:3000](http://localhost:3000)
* **Backend API :** [http://localhost:8000](http://localhost:8000)
* **Documentation interactive Swagger :** [http://localhost:8000/docs](http://localhost:8000/docs)

---

### Option B : Démarrage Local Indépendant

#### 1. Démarrer le Backend FastAPI :
```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # ou .venv\Scripts\activate sous Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
La base est automatiquement initialisée et alimentée avec les cas de test réels (Moussa Traoré, Fatoumata Diarra, listes sanctions, transactions de fractionnement).

#### 2. Démarrer le Frontend Next.js :
```bash
cd frontend
npm install
npm run dev
```

---

## 4. Endpoints Principaux de l'API (`/api/v1`)

| Méthode | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/auth/login` | Authentification JWT multi-rôles (Analyste, Responsable, Admin) |
| `GET` | `/api/v1/clients` | Liste et recherche de clients |
| `GET` | `/api/v1/clients/{id}` | Fiche Client 360° avec comptes et historique |
| `GET` | `/api/v1/clients/{id}/score` | Calcul dynamique du Risk Score (0-100 pts) et facteurs |
| `POST` | `/api/v1/transactions` | Ingestion et contrôle temps réel (fractionnement / seuils) |
| `GET` | `/api/v1/alerts` | Centre d'alertes filtrable (bloquante, à analyser, informative) |
| `POST` | `/api/v1/investigations/{id}/close` | Clôture d'investigation avec décision motivée obligatoire |
| `GET` | `/api/v1/filtrage/verifier?nom=...` | Fuzzy matching patronymes ouest-africains contre ONU/CENTIF/PPE |
| `GET` | `/api/v1/graph/client/{id}` | Nœuds et arêtes du réseau financier (comptes, bénéficiaires) |
| `POST` | `/api/v1/assistant-ia/expliquer` | Synthèse factuelle d'une alerte en langage naturel |
| `GET` | `/api/v1/audit` | Consultation du journal d'audit réglementaire |
| `GET` | `/api/v1/stats/overview` | Métriques globales du tableau de bord |
