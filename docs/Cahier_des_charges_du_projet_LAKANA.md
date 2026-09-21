# Cahier des charges du projet LAKANA

**Projet :** Plateforme de filtrage clients et de conformité LBC/FT/FP pour les Systèmes Financiers Décentralisés (SFD) au Mali
**Nom du produit :** LAKANA — « le bouclier », en bambara
**Programme :** Hackathon National d'Innovation CIF 2026 — DigiCoop-WA+
**Thématique :** Thématique 1 — Filtrage des clients et conformité LBC/FT/FP
**Équipe :** Digi.Dev
**Version :** 1.0
**Date :** 19 août 2026

---

## 1. Résumé exécutif

LAKANA est une plateforme numérique de filtrage clients et de conformité LBC/FT/FP destinée aux Systèmes Financiers Décentralisés (SFD) du Mali. Plutôt que de remplacer les applications de gestion des membres, comptes et opérations déjà utilisées par les institutions, LAKANA se branche sur ces systèmes existants pour analyser en continu les clients et leurs transactions, détecter les comportements financiers inhabituels, filtrer les personnes politiquement exposées et les listes de sanctions, puis transformer ces signaux en dossiers d'investigation exploitables par le responsable conformité.

Le projet repose sur une idée centrale : disposer de données ne signifie pas être en mesure d'identifier rapidement un comportement financier inhabituel, surtout lorsque les volumes sont importants et que les équipes conformité disposent de ressources limitées. LAKANA ne vise donc pas à stocker davantage de données, mais à transformer les données déjà détenues par les institutions en informations exploitables, priorisées et défendables devant un contrôle réglementaire.

Le nom LAKANA — « le bouclier », en bambara — porte la promesse du projet : détecter les signaux à risque, permettre à l'analyste de comprendre pourquoi un client ou une opération est signalé, et l'aider à agir rapidement, sans jamais se substituer à la décision humaine finale.

## 2. Contexte et justification du projet

Les institutions de microfinance disposent aujourd'hui de systèmes informatiques pour enregistrer clients, comptes et transactions. Mais l'analyse de ces données reste largement manuelle, ponctuelle ou limitée à des règles isolées, alors que le risque de blanchiment de capitaux, de financement du terrorisme ou de la prolifération se révèle souvent dans le comportement global d'un client plutôt que dans une transaction prise isolément.

Exemple concret : une transaction de 950 000 FCFA peut sembler normale isolément. Mais si le même client réalise dans les heures suivantes plusieurs opérations de 920 000, 980 000 et 870 000 FCFA — soit 4 710 000 FCFA au total — l'analyse de l'ensemble du comportement révèle une situation nécessitant une investigation, alors qu'aucune transaction individuelle ne dépasse un seuil isolé. C'est ce type de signal que les outils actuels des SFD ne mettent pas en évidence.

LAKANA répond à ce besoin en proposant une couche d'analyse complémentaire, non intrusive, qui réduit le coût et le risque d'adoption pour des institutions ayant déjà investi dans leurs outils de gestion, tout en les alignant sur les exigences réglementaires en vigueur dans l'espace UMOA.

## 3. Vision du projet

La vision de LAKANA est de devenir la couche de conformité intelligente de référence pour les Systèmes Financiers Décentralisés en Afrique de l'Ouest : une solution qui s'intègre aux outils existants plutôt que de les remplacer, qui explique chacune de ses décisions plutôt que de fonctionner comme une boîte noire, et qui reste utilisable par des agents non spécialistes de la data.

LAKANA n'a pas vocation à remplacer le jugement du responsable conformité. Son rôle est de détecter précocement les comportements à risque, de prioriser les dossiers à traiter en premier, de produire une première analyse structurée et explicable, et de laisser la décision finale — gel, blocage, déclaration de soupçon — entièrement entre les mains de l'agent habilité.

| Élément de vision | Description opérationnelle |
|---|---|
| Détection explicable | Chaque score et chaque alerte doit être accompagné des facteurs qui l'expliquent, condition indispensable pour qu'un agent conformité documente et défende sa décision. |
| Complémentarité | LAKANA se branche sur les systèmes existants (API, fichiers d'échange) plutôt que de remplacer les outils de gestion déjà en place. |
| Ancrage régional | Le moteur de filtrage et les règles de scoring doivent être calibrés sur les réalités ouest-africaines : noms, volumes, connectivité, cadre BCEAO/UMOA. |
| Décision humaine | Une alerte n'est ni une preuve ni une déclaration de soupçon ; elle déclenche une analyse dont la décision reste soumise aux procédures de l'institution. |
| Continuité hors ligne | Le système doit rester fiable et sûr même en connectivité limitée, sans jamais faire l'impasse sur une mise à jour critique des listes de sanctions. |

## 4. Objectifs du projet

L'objectif général de LAKANA est de fournir aux Systèmes Financiers Décentralisés une couche d'analyse comportementale et de filtrage capable de transformer leurs données transactionnelles en alertes priorisées et en dossiers d'investigation exploitables. Cet objectif général se décline en objectifs spécifiques.

| Catégorie | Objectifs spécifiques |
|---|---|
| Objectifs de détection | Identifier les comportements financiers inhabituels, les tentatives de fractionnement et les correspondances avec les listes de sanctions ou de PPE, y compris lorsqu'aucune transaction individuelle ne dépasse un seuil isolé. |
| Objectifs de conformité réglementaire | Aligner le système sur la loi uniforme LBC/FT/FP de l'UMOA et sur les instructions d'application de la BCEAO, notamment la classification des clients par niveau de risque et la piste d'audit complète. |
| Objectifs d'efficacité opérationnelle | Réduire le temps d'analyse manuelle des équipes conformité et prioriser les dossiers critiques plutôt que de traiter les alertes dans l'ordre d'arrivée. |
| Objectifs d'intégration | S'interfacer avec les systèmes de gestion existants des SFD (API, fichiers d'échange) sans exiger leur remplacement. |
| Objectifs de gouvernance | Garantir la traçabilité de chaque alerte et de chaque décision, et maintenir une frontière claire entre l'analyse automatisée et la décision humaine. |
| Objectifs d'accessibilité | Rester utilisable en connectivité instable, adapté aux réalités opérationnelles des coopératives ouest-africaines. |

## 5. Périmètre du projet

Le périmètre fonctionnel initial de LAKANA couvre l'intégration aux systèmes existants, le filtrage sanctions/PPE, le scoring comportemental, la détection du fractionnement, la visualisation des relations financières et la gestion des alertes et investigations. Le projet pourra ensuite évoluer vers des modules complémentaires tels que la déduplication biométrique à l'enrôlement.

| Périmètre | Inclus dans le MVP | Évolution future |
|---|---|---|
| Filtrage sanctions & PPE (fuzzy matching) | Oui | Oui — élargissement des sources |
| Risk Score explicable | Oui | Oui |
| Détection comportementale | Oui | Oui |
| Détection du fractionnement | Oui | Oui |
| Graphe des relations financières | Oui | Oui |
| Centre d'alertes priorisées | Oui | Oui |
| Client 360° | Oui | Oui |
| Gestion des investigations | Oui | Oui |
| Assistant IA d'aide à l'analyse | Oui | Oui |
| Back-office d'administration | Oui | Oui — multi-institutions |
| Authentification et RBAC | Oui | Oui — MFA généralisée |
| Fonctionnement à connectivité limitée | Partielle | Oui |
| Module anti-structuration (biométrie) | Non | Oui — V2 |
| API publique pour éditeurs partenaires | Non | Oui |

## 6. Publics cibles et parties prenantes

LAKANA doit être conçu comme une plateforme multi-acteurs, où chaque profil dispose d'un niveau d'accès et d'une expérience adaptés à son rôle dans le dispositif de conformité.

| Partie prenante | Besoin principal | Valeur apportée par LAKANA |
|---|---|---|
| Analystes conformité | Traiter les alertes prioritaires sans être submergés de faux positifs. | Centre d'alertes priorisées, Client 360°, assistant IA explicatif. |
| Responsables conformité / superviseurs | Superviser l'activité, ajuster les règles, produire des rapports défendables. | Back-office de paramétrage, tableaux de bord, export réglementaire. |
| Directions des SFD | Adopter une solution peu coûteuse à intégrer et à faible risque opérationnel. | Couche complémentaire branchée sur les systèmes existants, sans remplacement. |
| Administrateurs système | Gérer les comptes, les droits d'accès et la disponibilité technique. | Back-office technique, gestion des rôles, supervision des synchronisations. |
| Auditeurs internes / externes | Vérifier la traçabilité des décisions et la conformité des procédures. | Journal d'audit complet, piste d'audit par alerte et par utilisateur. |
| BCEAO / CENTIF-Mali | Disposer d'un dispositif de conformité aligné sur le cadre réglementaire. | Classification des risques, filtrage PPE, piste d'audit conforme aux textes en vigueur. |

## 7. Cadre réglementaire

Au Mali, les Systèmes Financiers Décentralisés sont assujettis à la Loi uniforme relative à la LBC/FT/FP adoptée par le Conseil des Ministres de l'UMOA le 31 mars 2023, ainsi qu'aux instructions d'application de la BCEAO — en particulier l'Instruction n°003-03-2025 du 18 mars 2025, qui précise les modalités d'identification, de vérification de l'identité et de connaissance de la clientèle (KYC). L'UEMOA a par ailleurs harmonisé à 10 millions FCFA le seuil de déclaration pour les transports physiques d'espèces entre États membres.

LAKANA est conçu pour s'aligner directement sur ce cadre : classification des clients par niveau de risque, filtrage des Personnes Politiquement Exposées, et piste d'audit complète pour chaque alerte — trois exigences explicitement portées par ces textes. Les listes de sanctions et de PPE utilisées par le système doivent provenir de sources officielles ou autorisées (ONU, GAFI, CENTIF), et toute correspondance automatique doit être confirmée par une revue humaine avant toute mesure de gel ou de blocage.

## 8. Parcours opérationnel attendu

Le parcours principal part des systèmes existants des SFD et se termine par une décision humaine documentée, en passant par une chaîne d'analyse automatisée qui priorise le travail de l'analyste plutôt que de décider à sa place.

| Étape | Description | Résultat attendu |
|---|---|---|
| Ingestion | Réception des données clients, comptes et transactions depuis les systèmes existants (API, fichiers d'échange, synchronisation). | Les données sont disponibles et horodatées dans LAKANA. |
| Filtrage sanctions/PPE | Vérification du client contre les listes de sanctions et PPE via fuzzy matching. | Les correspondances potentielles sont identifiées et scorées. |
| Scoring comportemental | Calcul d'un Risk Score explicable à partir de règles pondérées. | Un score et ses facteurs explicatifs sont produits. |
| Détection comportementale | Comparaison du comportement récent au comportement historique du client. | Les écarts significatifs sont signalés. |
| Détection du fractionnement | Repérage de séquences de transactions groupées sous le seuil de déclaration. | Les séquences suspectes sont regroupées et présentées. |
| Génération de l'alerte | Consolidation des signaux en une alerte classée par niveau. | Une alerte bloquante, à analyser ou informative est créée. |
| Priorisation | Classement des alertes dans le centre d'alertes. | Les dossiers critiques apparaissent en premier. |
| Investigation | Prise en charge de l'alerte par un analyste, consultation du Client 360° et du graphe de relations. | Un dossier d'investigation documenté est constitué. |
| Décision humaine | Clôture de l'investigation par l'analyste ou le responsable conformité. | Une décision motivée est enregistrée et tracée. |
| Traçabilité continue | Journalisation de chaque étape et de chaque accès. | Le dossier est intégralement auditable a posteriori. |

## 9. Architecture fonctionnelle proposée

L'architecture de LAKANA sépare clairement les systèmes sources, la couche d'intégration, le moteur d'analyse, le référentiel de sanctions/PPE, l'interface conformité, le back-office d'administration et la couche d'authentification. Cette séparation permet de faire évoluer chaque brique — notamment les règles de scoring ou les sources de sanctions — sans remettre en cause l'ensemble de la plateforme.

| Couche | Composants | Rôle |
|---|---|---|
| Systèmes sources | Applications de gestion membres/comptes/opérations déjà utilisées par les SFD. | Fournir les données brutes de clients, comptes et transactions. |
| Couche d'intégration | Connecteurs API, import de fichiers d'échange, synchronisation différée. | Alimenter LAKANA sans dupliquer la gestion opérationnelle des SFD. |
| Référentiel sanctions/PPE | Listes ONU, GAFI, CENTIF, moteur de fuzzy matching orthographique/phonétique. | Détecter les correspondances avec les listes officielles. |
| Moteur d'analyse | Règles de scoring, détection comportementale, détection du fractionnement, calcul du graphe. | Transformer les données en scores, écarts et alertes explicables. |
| Interface conformité (front-office) | Dashboard, centre d'alertes, Client 360°, graphe, investigations, assistant IA. | Permettre à l'analyste de traiter les alertes et documenter ses décisions. |
| Back-office d'administration | Gestion des utilisateurs, des listes, des règles et des seuils, rapports réglementaires. | Permettre au responsable conformité et à l'administrateur de configurer et superviser le système. |
| Authentification & contrôle d'accès | Login, gestion des sessions, rôles et permissions (RBAC). | Garantir que chaque utilisateur n'accède qu'aux fonctions autorisées par son rôle. |
| Observabilité | Journal d'audit, logs techniques, indicateurs de synchronisation. | Auditer les décisions et diagnostiquer les incidents. |

## 10. Fonctionnalités par module

Cette section détaille les exigences fonctionnelles de LAKANA, organisées par module. Chaque exigence est identifiée par un code utilisable pour les tests d'acceptation et la priorisation du développement.

### 10.1 Module Intégration & Ingestion des données

| Code | Exigence fonctionnelle | Priorité |
|---|---|---|
| INT-01 | Importer les données clients, comptes et transactions depuis les systèmes existants via API ou fichiers d'échange (CSV, Excel). | Haute |
| INT-02 | Valider le format et la complétude des données importées avant intégration. | Haute |
| INT-03 | Détecter et signaler les doublons ou incohérences lors de l'import. | Moyenne |
| INT-04 | Journaliser chaque import : source, date, volume, résultat. | Haute |
| INT-05 | Permettre une synchronisation différée en cas de connectivité instable. | Haute |
| INT-06 | Déclencher automatiquement l'analyse (scoring, filtrage) dès qu'une nouvelle transaction est intégrée. | Haute |

### 10.2 Module Filtrage Sanctions & PPE

| Code | Exigence fonctionnelle | Priorité |
|---|---|---|
| FLT-01 | Comparer chaque client aux listes de sanctions et de PPE (ONU, GAFI, CENTIF) par correspondance exacte et approximative (fuzzy matching). | Haute |
| FLT-02 | Calibrer le moteur de correspondance sur les variations orthographiques et phonétiques des noms ouest-africains (ex. Traoré/Traore). | Haute |
| FLT-03 | Afficher un score de similarité pour chaque correspondance potentielle. | Haute |
| FLT-04 | Exiger une revue humaine avant toute mesure de gel ou de blocage liée à une correspondance. | Haute |
| FLT-05 | Permettre le rejet motivé d'une correspondance identifiée comme faux positif. | Moyenne |
| FLT-06 | Relancer automatiquement le filtrage de la base clients après chaque mise à jour des listes. | Haute |

### 10.3 Module Risk Score

| Code | Exigence fonctionnelle | Priorité |
|---|---|---|
| SCR-01 | Calculer un score de risque dynamique par client, exprimé sur 100 points. | Haute |
| SCR-02 | Associer à chaque score la liste des facteurs qui l'expliquent (volume, fréquence, écart historique, relations). | Haute |
| SCR-03 | Recalculer le score à chaque nouvelle transaction ou changement de statut du client. | Haute |
| SCR-04 | Permettre au responsable conformité de consulter et d'ajuster la pondération des règles depuis le back-office. | Moyenne |
| SCR-05 | Conserver l'historique des scores successifs d'un client. | Moyenne |

### 10.4 Module Détection comportementale

| Code | Exigence fonctionnelle | Priorité |
|---|---|---|
| CMP-01 | Comparer automatiquement le comportement récent d'un client à son historique (montant moyen, fréquence). | Haute |
| CMP-02 | Déclencher un facteur de risque en cas d'écart significatif au comportement habituel. | Haute |
| CMP-03 | Prendre en compte le solde consolidé d'un même client sur plusieurs comptes. | Moyenne |
| CMP-04 | Permettre l'ajustement des seuils de détection par le responsable conformité. | Moyenne |

### 10.5 Module Détection du fractionnement

| Code | Exigence fonctionnelle | Priorité |
|---|---|---|
| FRC-01 | Repérer les séquences de transactions individuellement sous le seuil de déclaration mais dont le cumul le dépasse. | Haute |
| FRC-02 | Regrouper ces séquences et les présenter à l'analyste comme un ensemble cohérent, pas comme des alertes isolées. | Haute |
| FRC-03 | Paramétrer la fenêtre temporelle et le seuil de proximité utilisés pour la détection. | Moyenne |

### 10.6 Module Graphe des relations financières

| Code | Exigence fonctionnelle | Priorité |
|---|---|---|
| GRF-01 | Visualiser les liens entre un client, ses comptes et les bénéficiaires de ses transactions. | Haute |
| GRF-02 | Permettre la navigation interactive dans le graphe (zoom, exploration des nœuds liés). | Moyenne |
| GRF-03 | Mettre en évidence les nœuds associés à une alerte active. | Moyenne |
| GRF-04 | Exporter le graphe d'un client comme pièce jointe d'un dossier d'investigation. | Basse |

### 10.7 Module Centre d'alertes

| Code | Exigence fonctionnelle | Priorité |
|---|---|---|
| ALR-01 | Classer les alertes selon trois niveaux : bloquante, à analyser, informative. | Haute |
| ALR-02 | Permettre le filtrage des alertes par statut, priorité, module d'origine et analyste assigné. | Haute |
| ALR-03 | Afficher pour chaque alerte les facteurs de risque qui l'ont déclenchée. | Haute |
| ALR-04 | Permettre l'assignation d'une alerte à un analyste et le suivi de son traitement. | Haute |
| ALR-05 | Notifier le responsable conformité en cas d'alerte bloquante non traitée après un délai paramétrable. | Moyenne |

### 10.8 Module Client 360°

| Code | Exigence fonctionnelle | Priorité |
|---|---|---|
| C360-01 | Afficher en une seule vue le profil, les comptes, l'historique, le score, les alertes et les relations d'un client. | Haute |
| C360-02 | Afficher l'historique des investigations antérieures liées au client. | Haute |
| C360-03 | Permettre l'accès direct au graphe de relations et au détail des alertes depuis la fiche client. | Moyenne |

### 10.9 Module Gestion des investigations

| Code | Exigence fonctionnelle | Priorité |
|---|---|---|
| INV-01 | Permettre à un analyste de prendre en charge une alerte et d'ouvrir un dossier d'investigation. | Haute |
| INV-02 | Documenter le dossier par des notes, pièces jointes et une décision motivée. | Haute |
| INV-03 | Clôturer une investigation avec un statut (classée, transmise, déclaration de soupçon envisagée). | Haute |
| INV-04 | Conserver la traçabilité complète : qui a agi, quand, et quelle décision a été prise. | Haute |
| INV-05 | Permettre la réouverture motivée d'un dossier clôturé par un responsable conformité. | Basse |

### 10.10 Module Assistant IA d'aide à l'analyse

| Code | Exigence fonctionnelle | Priorité |
|---|---|---|
| IA-01 | Générer une explication en langage clair du score et des facteurs de risque d'un client. | Haute |
| IA-02 | Fonder l'explication exclusivement sur les facteurs déjà calculés par les règles métier, sans rien inventer. | Haute |
| IA-03 | Rappeler systématiquement que la décision finale revient à l'analyste habilité. | Haute |
| IA-04 | Prévoir un mode de secours fondé sur des modèles de phrases si l'API IA est indisponible. | Moyenne |

### 10.11 Module Synchronisation & mode hors ligne

| Code | Exigence fonctionnelle | Priorité |
|---|---|---|
| OFF-01 | Maintenir une base locale chiffrée des listes de sanctions/PPE utilisable hors connexion. | Haute |
| OFF-02 | Resynchroniser automatiquement la base locale à chaque fenêtre de connectivité disponible. | Haute |
| OFF-03 | Afficher un indicateur visuel de l'ancienneté des données locales au-delà d'un seuil paramétrable. | Moyenne |
| OFF-04 | Mettre en file d'attente les alertes générées hors ligne et les remonter au responsable conformité à la reconnexion, sans perte de traçabilité. | Haute |

## 11. Back-office / Administration

Le back-office de LAKANA est l'espace réservé aux responsables conformité et aux administrateurs système. Il permet de configurer le comportement du moteur d'analyse, d'administrer les comptes utilisateurs, de superviser l'état technique de la plateforme et de produire les rapports destinés au régulateur — sans jamais exposer ces fonctions aux analystes en charge du seul traitement des alertes.

| Fonction back-office | Description | Utilisateurs concernés |
|---|---|---|
| Gestion des utilisateurs et des rôles | Créer, désactiver et modifier les comptes ; attribuer un rôle et un périmètre d'accès. | Administrateur système |
| Gestion des listes de sanctions/PPE | Importer, mettre à jour et historiser les listes officielles utilisées par le filtrage. | Responsable conformité, Administrateur |
| Paramétrage du scoring | Ajuster la pondération des règles de calcul du Risk Score et les seuils de déclenchement. | Responsable conformité |
| Paramétrage des seuils réglementaires | Configurer les seuils de déclaration, de fractionnement et les fenêtres temporelles associées. | Responsable conformité |
| Journal d'audit | Consulter l'historique complet des connexions, actions et décisions de tous les utilisateurs. | Responsable conformité, Auditeur |
| Rapports réglementaires | Générer des exports destinés à la BCEAO, au CENTIF-Mali ou aux contrôles internes. | Responsable conformité |
| Supervision technique | Suivre l'état des connecteurs d'intégration, des synchronisations et des files d'attente hors ligne. | Administrateur système |
| Gestion des institutions (multi-SFD) | Isoler les données et les paramétrages propres à chaque institution cliente. | Super administrateur Digi.Dev |
| Gestion des notifications | Configurer les alertes internes (délais de traitement, seuils dépassés). | Responsable conformité, Administrateur |

**Exigences fonctionnelles associées au back-office :**

| Code | Exigence fonctionnelle | Priorité |
|---|---|---|
| BO-01 | Permettre la création, la modification et la désactivation d'un compte utilisateur avec attribution d'un rôle. | Haute |
| BO-02 | Permettre l'import d'une nouvelle version des listes de sanctions/PPE avec horodatage et traçabilité de la source. | Haute |
| BO-03 | Permettre la modification des pondérations du Risk Score avec conservation d'un historique des versions appliquées. | Haute |
| BO-04 | Permettre la configuration des seuils de déclaration et de fractionnement par institution. | Haute |
| BO-05 | Fournir une vue consultable et exportable du journal d'audit, filtrable par utilisateur, module et période. | Haute |
| BO-06 | Générer un export réglementaire structuré (PDF ou tableur) sur une période donnée. | Moyenne |
| BO-07 | Afficher l'état des connecteurs d'intégration et la date de dernière synchronisation par source. | Moyenne |
| BO-08 | Isoler strictement les données de chaque institution dans une architecture multi-institutions. | Moyenne |
| BO-09 | Empêcher toute modification des paramètres critiques (listes, seuils, rôles) par un utilisateur non habilité. | Haute |

## 12. Authentification, rôles et contrôle d'accès (RBAC)

LAKANA traite des données clients et financières sensibles ; l'authentification et le contrôle d'accès constituent donc une exigence non négociable, distincte des autres modules fonctionnels. Le système repose sur une authentification forte et sur un modèle de contrôle d'accès basé sur les rôles (Role-Based Access Control — RBAC), où chaque utilisateur n'accède qu'aux fonctions et aux données strictement nécessaires à son rôle.

### 12.1 Authentification

| Code | Exigence d'authentification | Priorité |
|---|---|---|
| AUTH-01 | Authentifier chaque utilisateur par identifiant et mot de passe avant tout accès à la plateforme. | Haute |
| AUTH-02 | Hacher les mots de passe avec un algorithme robuste (bcrypt ou équivalent) ; aucun mot de passe en clair ne doit être stocké. | Haute |
| AUTH-03 | Imposer une politique de mot de passe (longueur minimale, complexité) et son renouvellement périodique. | Haute |
| AUTH-04 | Verrouiller temporairement un compte après un nombre défini de tentatives de connexion échouées. | Haute |
| AUTH-05 | Exiger une authentification à deux facteurs (MFA) pour les rôles Responsable conformité, Administrateur et Super administrateur. | Haute |
| AUTH-06 | Émettre un jeton de session (JWT) à durée de vie limitée, renouvelable par un jeton de rafraîchissement. | Haute |
| AUTH-07 | Déconnecter automatiquement une session inactive au-delà d'un délai paramétrable. | Moyenne |
| AUTH-08 | Journaliser chaque tentative de connexion, réussie ou échouée, avec horodatage et adresse d'origine. | Haute |
| AUTH-09 | Permettre la réinitialisation sécurisée d'un mot de passe oublié, sans divulguer d'information sur l'existence du compte. | Moyenne |

### 12.2 Rôles utilisateurs

La plateforme distingue six rôles, chacun avec des droits spécifiques. Cette séparation est indispensable pour protéger les données clients, éviter les manipulations du moteur de scoring et garantir que seules les personnes habilitées peuvent modifier les paramètres réglementaires de la plateforme.

| Rôle | Droits principaux |
|---|---|
| Analyste conformité | Consulter le centre d'alertes, la fiche Client 360° et le graphe de relations ; prendre en charge et documenter des investigations. Aucun accès au back-office. |
| Responsable conformité / Superviseur | Tous les droits de l'analyste, plus l'accès au back-office fonctionnel : paramétrage du scoring, des seuils, des listes, génération des rapports réglementaires. |
| Administrateur système | Gestion des comptes utilisateurs et des rôles, supervision technique des connecteurs et synchronisations. Pas d'accès aux paramètres métier de scoring. |
| Auditeur (lecture seule) | Consultation intégrale du journal d'audit et des dossiers d'investigation clôturés, sans droit de modification. |
| Agent guichet (optionnel, lecture limitée) | Consultation du statut de filtrage d'un client au moment de l'ouverture d'un compte, sans accès aux détails de scoring ni aux alertes en cours. |
| Super administrateur Digi.Dev | Gestion multi-institutions : création d'une nouvelle institution cliente, isolation des données, supervision globale de la plateforme. |

### 12.3 Matrice des droits par module

Lecture (L) — Écriture (E) — Aucun accès (—)

| Module / Fonction | Analyste | Responsable | Administrateur | Auditeur |
|---|---|---|---|---|
| Centre d'alertes | E | E | — | L |
| Client 360° et graphe | L | L | — | L |
| Investigations | E | E | — | L |
| Paramétrage du scoring | — | E | — | L |
| Listes sanctions/PPE | L | E | — | L |
| Gestion des utilisateurs | — | — | E | L |
| Rapports réglementaires | — | E | L | L |
| Journal d'audit | — | L | L | L |

## 13. Modèle de données (aperçu)

Le modèle de données détaillé (champs, types, contraintes) est décrit dans le cahier des charges technique de LAKANA. Les entités principales sont résumées ci-dessous, à titre de référence pour la conception fonctionnelle.

| Entité | Rôle | Champs clés indicatifs |
|---|---|---|
| Clients | Identité et classification du client. | id, nom, date de naissance, profession, est_ppe, niveau_risque |
| Comptes | Comptes détenus par un client. | id, client_id, type_compte, solde |
| Transactions | Mouvements financiers analysés. | id, compte_source, compte_destination, montant, date, type |
| Alertes | Signaux générés par le moteur d'analyse. | id, client_id, type_alerte, score, facteurs, statut |
| Investigations | Dossiers ouverts par les analystes. | id, alerte_id, analyste_id, notes, décision, date_clôture |
| Utilisateurs | Comptes et rôles d'accès à la plateforme. | id, nom, rôle, mot_de_passe_hash, statut MFA |
| Listes de sanctions/PPE | Référentiel officiel utilisé par le filtrage. | id, nom, source, date_import, version |
| Journal d'audit | Traçabilité de toutes les actions. | id, utilisateur_id, action, module, date, résultat |

## 14. Système de scoring

Le Risk Score doit rester compréhensible, auditable et révisable. Il est exprimé sur 100 points et toujours accompagné des facteurs qui l'expliquent. Un score élevé ne signifie pas qu'une fraude est avérée ; il signifie que le comportement observé s'écarte fortement du profil attendu et justifie une revue humaine.

| Critère | Pondération indicative | Description |
|---|---|---|
| Volume inhabituel | 25 points | Écart significatif entre le montant moyen récent et le montant moyen historique du client. |
| Fréquence anormale | 20 points | Nombre de transactions récentes largement supérieur à la fréquence habituelle. |
| Fractionnement potentiel | 30 points | Transactions groupées juste sous le seuil de déclaration. |
| Correspondance PPE/sanctions | 15 points | Client classé Personne Politiquement Exposée ou correspondance sur une liste officielle. |
| Relations inhabituelles | 10 points | Liens avec des comptes ou bénéficiaires déjà signalés dans le graphe de relations. |

## 15. Exigences non fonctionnelles

| Catégorie | Exigence |
|---|---|
| Sécurité | Authentification forte, chiffrement des données sensibles au repos et en transit, journalisation de tous les accès. |
| Confidentialité | Les données clients et transactionnelles ne sont accessibles qu'aux rôles habilités, selon la matrice de droits définie en section 12.3. |
| Performance | Le calcul du Risk Score et le filtrage sanctions doivent produire un résultat en quelques secondes pour une transaction standard. |
| Disponibilité | La plateforme doit rester opérationnelle en continu, avec un mode dégradé fonctionnel en cas de connectivité instable. |
| Traçabilité | Chaque alerte, décision et action d'administration conserve son auteur, sa date et son contexte. |
| Explicabilité | Aucune décision automatisée n'est présentée sans les facteurs qui la justifient. |
| Évolutivité | L'architecture doit permettre l'ajout de nouvelles institutions, de nouvelles règles et de nouvelles sources de listes sans refonte. |
| Accessibilité | L'interface doit rester utilisable en connectivité limitée et sur des postes aux ressources modestes. |
| Résilience aux abus | Le système doit détecter les tentatives de connexion anormales et les usages atypiques des comptes analystes. |

## 16. Données et gouvernance

LAKANA traite des données financières et personnelles sensibles. La gouvernance des données doit donc être définie dès la conception, avec une distinction claire entre les données conservées durablement à des fins de traçabilité réglementaire et celles dont la conservation doit être limitée.

| Donnée | Utilisation | Sensibilité | Conservation proposée |
|---|---|---|---|
| Données d'identité client | Filtrage, scoring, Client 360°. | Élevée | Conservation durable, accès restreint |
| Transactions | Scoring, détection comportementale, fractionnement. | Élevée | Conservation durable, conforme aux obligations LBC/FT |
| Alertes et facteurs | Priorisation, investigation. | Élevée | Conservation durable pour piste d'audit |
| Notes d'investigation | Documentation des décisions. | Élevée | Conservation durable, accès restreint |
| Listes de sanctions/PPE | Filtrage. | Faible (source publique) | Conservation durable avec historique des versions |
| Journal d'audit / logs techniques | Sécurité, diagnostic, contrôle. | Moyenne | Conservation conforme à la politique de rétention de l'institution |

## 17. Gestion des risques et points de vigilance

| Risque | Impact possible | Mesure d'atténuation |
|---|---|---|
| Excès de faux positifs | Surcharge des analystes, perte de confiance dans les alertes. | Calibrage du fuzzy matching, ajustement continu des seuils, retours terrain en phase pilote. |
| Faux négatif (alerte manquée) | Comportement à risque non détecté. | Revue régulière des règles, détection comportementale complémentaire au filtrage listes. |
| Dérive du mode hors ligne | Base locale non synchronisée laissant passer une mise à jour critique des listes. | Resynchronisation automatique, indicateur d'ancienneté, file d'attente des alertes hors ligne. |
| Usurpation d'un compte analyste | Accès non autorisé à des données clients sensibles. | MFA obligatoire pour les rôles sensibles, verrouillage après tentatives échouées, journalisation des connexions. |
| Modification non autorisée des règles de scoring | Contournement volontaire ou accidentel du dispositif de détection. | RBAC strict, historique des versions de paramétrage, revue par le responsable conformité. |
| Fuite de données clients | Atteinte à la confidentialité, risque réputationnel et réglementaire. | Chiffrement des données sensibles, cloisonnement multi-institutions, contrôle d'accès par rôle. |

## 18. Indicateurs de réussite

| Indicateur | Description | Cible indicative |
|---|---|---|
| Taux d'alertes explicées | Part des alertes accompagnées de facteurs de risque clairs. | 100 % |
| Temps moyen de traitement d'une alerte | Délai entre la création de l'alerte et sa clôture. | Réduction mesurable par rapport au traitement manuel actuel |
| Taux de faux positifs | Part des alertes classées sans suite après investigation. | À réduire en continu grâce au calibrage du fuzzy matching |
| Taux de disponibilité | Disponibilité de la plateforme sur la période pilote. | Élevé, avec continuité en mode hors ligne |
| Taux de satisfaction des analystes | Retours qualitatifs sur la clarté et l'utilité des alertes. | À mesurer en phase pilote |
| Nombre d'institutions déployées | Adoption progressive au sein du réseau CIF. | Une institution pilote, puis extension |

## 19. MVP recommandé

Compte tenu du format hackathon (72h), le MVP doit démontrer un parcours complet plutôt qu'une couverture exhaustive : Transaction → Détection → Risk Score → Alerte → Analyse → Graphe → Investigation → Décision humaine, incluant le back-office minimal et l'authentification par rôle.

| Lot MVP | Contenu | Résultat attendu |
|---|---|---|
| Lot 1 — Authentification & RBAC | Login, gestion basique des rôles (analyste, responsable, administrateur). | Chaque utilisateur accède uniquement aux fonctions de son rôle. |
| Lot 2 — Import & Risk Score | Import ou simulation de données, calcul du Risk Score explicable. | Les clients et transactions sont scorés automatiquement. |
| Lot 3 — Filtrage & alertes | Fuzzy matching sanctions/PPE, détection comportementale et fractionnement, centre d'alertes. | Les comportements à risque génèrent des alertes priorisées. |
| Lot 4 — Client 360° & graphe | Fiche client consolidée et graphe des relations financières. | L'analyste dispose d'une vue complète pour investiguer. |
| Lot 5 — Investigations & IA | Dossier d'investigation, assistant IA d'aide à l'analyse. | Chaque alerte peut être documentée et expliquée en langage clair. |
| Lot 6 — Back-office minimal | Gestion des utilisateurs, des listes et des seuils de base. | Le responsable conformité peut paramétrer le système sans intervention technique. |

## 20. Roadmap indicative

| Phase | Durée indicative | Objectif | Livrables |
|---|---|---|---|
| Phase 1 — Pilote | J+0 à J+90 | Déployer LAKANA sur une institution volontaire du réseau CIF, intégration au système existant, formation des analystes. | Version pilote, retours terrain, mesure du gain de temps d'analyse. |
| Phase 2 — Itération | M+3 à M+9 | Ajuster les règles de scoring et le filtrage sur la base des retours pilote ; renforcer le mode hors ligne. | Version consolidée, seuils recalibrés. |
| Phase 3 — Extension | M+9 à M+18 | Déployer progressivement à d'autres institutions du réseau CIF au Mali puis dans les pays DigiCoop-WA+. | Architecture multi-institutions opérationnelle. |
| Phase 4 — V2 Anti-structuration | Après validation du pilote | Étudier un module de déduplication biométrique à l'enrôlement, en interfaçage avec les registres nationaux. | Étude de faisabilité et prototype du module V2. |
| Continu | Permanent | Veille réglementaire BCEAO/GAFI/CENTIF et mise à jour des listes et seuils. | Listes et paramétrage toujours à jour. |

## 21. Contraintes techniques et recommandations

Le détail complet de la stack technique, du modèle de données et de la méthodologie de développement est disponible dans le cahier des charges technique de LAKANA, conçu pour une équipe sans expérience préalable en IA. Les grandes lignes sont résumées ci-dessous.

| Domaine | Recommandation |
|---|---|
| Frontend | Application web (React + Vite + TailwindCSS), pensée pour une utilisation par des agents non spécialistes de la data. |
| Backend | API sécurisée (Python/FastAPI), séparation claire des rôles et journalisation systématique des actions. |
| Base de données | Base relationnelle (PostgreSQL) pour clients, comptes, transactions, alertes, investigations et utilisateurs. |
| Scoring | Règles pondérées explicites plutôt qu'un modèle de Machine Learning entraîné, pour rester auditable dès le MVP. |
| Filtrage | Fuzzy matching (ex. RapidFuzz) calibré sur les variantes orthographiques des noms ouest-africains. |
| Graphe de relations | Calcul en backend (ex. NetworkX) et affichage interactif côté frontend (ex. React Flow). |
| Authentification | JWT avec jeton de rafraîchissement, mots de passe hachés (bcrypt), MFA pour les rôles sensibles. |
| Assistant IA | Appel à une API d'intelligence artificielle existante pour l'explication en langage naturel, sans entraînement de modèle propre. |
| Déploiement | Conteneurisation (Docker Compose) en développement ; hébergement simple pour la démonstration. |

## 22. Critères d'acceptation

| Critère | Condition de validation |
|---|---|
| Authentification fonctionnelle | Un utilisateur peut se connecter avec son rôle et n'accède qu'aux fonctions autorisées par la matrice de droits. |
| Filtrage opérationnel | Le système détecte une correspondance sur un nom proche d'une entrée de la liste de sanctions/PPE de test. |
| Scoring explicable | Chaque score affiché est accompagné d'au moins un facteur de risque identifié. |
| Détection du fractionnement | Une séquence de transactions sous le seuil de déclaration génère une alerte consolidée. |
| Centre d'alertes fonctionnel | Les alertes sont classées et filtrables par niveau et par statut. |
| Investigation traçable | Chaque dossier d'investigation conserve l'auteur, la date et la décision prise. |
| Back-office opérationnel | Un responsable conformité peut créer un utilisateur, importer une liste et ajuster un seuil sans intervention technique. |
| Journal d'audit complet | Chaque connexion et chaque action d'administration sont retrouvables dans le journal d'audit. |
| Continuité hors ligne | Une alerte générée hors connexion est remontée sans perte de traçabilité à la reconnexion. |

## 23. Conclusion

LAKANA ne propose pas une nouvelle application de gestion de la microfinance : elle ajoute une intelligence de détection, d'analyse et de contrôle d'accès aux systèmes que les institutions utilisent déjà. La structuration par modules fonctionnels, la séparation claire entre front-office analyste et back-office d'administration, et un modèle d'authentification RBAC rigoureux constituent le socle technique et organisationnel indispensable à un dispositif de conformité crédible.

La réussite du projet dépendra principalement de quatre facteurs : la qualité et l'actualité du référentiel de sanctions/PPE, l'explicabilité continue du scoring, la rigueur du contrôle d'accès par rôle, et l'adhésion des équipes conformité des SFD. En plaçant l'explicabilité et la traçabilité au cœur du système, LAKANA peut devenir un outil de confiance pour renforcer la conformité LBC/FT/FP au Mali et, à terme, dans les pays du programme DigiCoop-WA+.
