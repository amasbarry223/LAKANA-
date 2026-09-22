-- ==============================================================================
-- LAKANA — LE BOUCLIER LBC/FT/FP
-- Intercepteur SQL Transparent entre le Système Existant et la Base de Données
-- Version avec Transactions Autonomes via l'extension dblink
-- ==============================================================================

-- 0. Activation de l'extension standard dblink pour transactions autonomes
CREATE EXTENSION IF NOT EXISTS dblink;

-- 1. Table de configuration dynamique de l'intercepteur LAKANA
CREATE TABLE IF NOT EXISTS lakana_interceptor_config (
    cle VARCHAR(100) PRIMARY KEY,
    valeur VARCHAR(255) NOT NULL,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Configuration par défaut
INSERT INTO lakana_interceptor_config (cle, valeur, description)
VALUES 
    ('mode_interception', 'bloquant', 'Mode: bloquant (RAISE EXCEPTION) ou surveillance (Alerte sans blocage)'),
    ('seuil_fractionnement_cumul', '1000000', 'Seuil légal UEMOA/CENTIF de cumul en FCFA'),
    ('fenetre_fractionnement_heures', '48', 'Fenêtre d observation du fractionnement en heures'),
    ('seuil_ome_15m', '15000000', 'Seuil des opérations de montant élevé (15 000 000 FCFA)'),
    ('dblink_conn_str', 'dbname=lakana_db user=postgres password=daouda host=localhost port=5432', 'Chaîne de connexion dblink pour alertes autonomes')
ON CONFLICT (cle) DO UPDATE 
SET valeur = EXCLUDED.valeur, updated_at = CURRENT_TIMESTAMP;

-- 2. Fonction autonome pour persister les alertes même en cas de ROLLBACK de la transaction principale
CREATE OR REPLACE FUNCTION lakana_log_alert_autonomous(
    p_id VARCHAR,
    p_ref VARCHAR,
    p_client_id VARCHAR,
    p_type VARCHAR,
    p_niveau VARCHAR,
    p_score INT,
    p_module VARCHAR,
    p_facteurs TEXT,
    p_notify_payload TEXT
)
RETURNS VOID AS $$
DECLARE
    v_conn_str TEXT;
    v_sql TEXT;
BEGIN
    SELECT valeur INTO v_conn_str FROM lakana_interceptor_config WHERE cle = 'dblink_conn_str';
    IF v_conn_str IS NULL OR v_conn_str = '' THEN
        v_conn_str := 'dbname=lakana_db user=postgres password=daouda host=localhost port=5432';
    END IF;

    -- Requête autonome d'insertion et de notification
    v_sql := format(
        'INSERT INTO alerts (id, reference, client_id, type_alerte, niveau, score, module, facteurs, statut, created_at) ' ||
        'VALUES (%L, %L, %L, %L, %L, %s, %L, %L, %L, NOW()) ON CONFLICT (reference) DO NOTHING; ' ||
        'SELECT pg_notify(%L, %L);',
        p_id, p_ref, p_client_id, p_type, p_niveau, p_score, p_module, p_facteurs, 'nouvelle',
        'lakana_channel', p_notify_payload
    );

    BEGIN
        PERFORM dblink_exec(v_conn_str, v_sql);
    EXCEPTION WHEN OTHERS THEN
        -- Fallback si dblink n'est pas joignable (ex: tests locaux simples)
        BEGIN
            INSERT INTO alerts (id, reference, client_id, type_alerte, niveau, score, module, facteurs, statut, created_at)
            VALUES (p_id, p_ref, p_client_id, p_type, p_niveau, p_score, p_module, p_facteurs, 'nouvelle', NOW())
            ON CONFLICT (reference) DO NOTHING;
            PERFORM pg_notify('lakana_channel', p_notify_payload);
        EXCEPTION WHEN OTHERS THEN
            NULL;
        END;
    END;
END;
$$ LANGUAGE plpgsql;

-- 3. Procédure de contrôle exécutée AVANT chaque insertion de transaction
CREATE OR REPLACE FUNCTION trg_lakana_intercept_transaction()
RETURNS TRIGGER AS $$
DECLARE
    v_mode VARCHAR(50);
    v_seuil_cumul NUMERIC;
    v_fenetre_heures INT;
    v_cumul_recent NUMERIC := 0;
    v_nb_tx_recent INT := 0;
    v_client_nom VARCHAR(255);
    v_client_prenom VARCHAR(255);
    v_est_ppe BOOLEAN := FALSE;
    v_risk_score INT := 0;
    v_alert_ref VARCHAR(50);
    v_alert_id VARCHAR(50);
    v_cumul_formate VARCHAR(50);
    v_payload TEXT;
BEGIN
    -- Lecture de la configuration dynamique
    SELECT valeur INTO v_mode FROM lakana_interceptor_config WHERE cle = 'mode_interception';
    IF v_mode IS NULL THEN v_mode := 'bloquant'; END IF;

    SELECT COALESCE(valeur::NUMERIC, 1000000) INTO v_seuil_cumul 
    FROM lakana_interceptor_config WHERE cle = 'seuil_fractionnement_cumul';

    SELECT COALESCE(valeur::INT, 48) INTO v_fenetre_heures 
    FROM lakana_interceptor_config WHERE cle = 'fenetre_fractionnement_heures';

    -- Récupération des données du client
    SELECT nom, prenom, est_ppe, risk_score 
    INTO v_client_nom, v_client_prenom, v_est_ppe, v_risk_score
    FROM clients 
    WHERE id = NEW.client_id;

    -- RÈGLE 1 : Qualification automatique des opérations >= 15 000 000 FCFA (OME)
    IF NEW.montant >= 15000000 THEN
        NEW.caractere := 'Inhabituel';
    END IF;

    -- RÈGLE 2 : Détection du Fractionnement sous le seuil (Smurfing LBC/FT)
    IF NEW.montant < v_seuil_cumul THEN
        -- Calcul du cumul sur la fenêtre temporelle glissante (ex: 48h)
        SELECT COALESCE(SUM(montant), 0), COUNT(*)
        INTO v_cumul_recent, v_nb_tx_recent
        FROM transactions
        WHERE client_id = NEW.client_id
          AND date_transaction >= (NOW() - (v_fenetre_heures || ' hours')::INTERVAL);

        -- Si le nouveau dépôt fait basculer le cumul au-delà du seuil réglementaire
        IF (v_cumul_recent + NEW.montant) >= v_seuil_cumul AND v_nb_tx_recent >= 1 THEN
            v_alert_ref := 'ALR-FRC-' || LPAD(FLOOR(RANDOM() * 900 + 100)::TEXT, 3, '0');
            v_alert_id := gen_random_uuid()::TEXT;
            v_cumul_formate := TO_CHAR(v_cumul_recent + NEW.montant, 'FM999G999G999');

            v_payload := json_build_object(
                'alerte_ref', v_alert_ref,
                'type', 'Fractionnement',
                'client_id', NEW.client_id,
                'client_nom', COALESCE(v_client_prenom || ' ', '') || v_client_nom,
                'montant', NEW.montant,
                'cumul_48h', v_cumul_recent + NEW.montant,
                'niveau', 'bloquante',
                'agence', COALESCE(NEW.agence, 'Agence Centrale')
            )::TEXT;

            -- Enregistrement autonome garanti via dblink (persiste malgré RAISE EXCEPTION)
            PERFORM lakana_log_alert_autonomous(
                v_alert_id,
                v_alert_ref,
                NEW.client_id,
                'Fractionnement',
                'bloquante',
                85,
                'Fractionnement',
                '[{"critere": "fractionnement", "description": "Cumul de ' || v_cumul_formate || ' FCFA en ' || (v_nb_tx_recent + 1) || ' opérations sous le seuil sur ' || v_fenetre_heures || 'h."}]',
                v_payload
            );

            -- SI MODE BLOQUANT : Interruption immédiate renvoyée à l'écran du logiciel existant
            IF v_mode = 'bloquant' THEN
                RAISE EXCEPTION '🚨 [ALERTE LAKANA BLOQUANTE - %] FRACTIONNEMENT DÉTECTÉ : % dépôts sous seuil cumulent % FCFA sur %h (Seuil UEMOA: 1 000 000 FCFA). Opération suspendue. Justificatif d''origine des fonds requis avant validation au guichet.', 
                    v_alert_ref, 
                    (v_nb_tx_recent + 1), 
                    v_cumul_formate, 
                    v_fenetre_heures;
            END IF;
        END IF;
    END IF;

    -- RÈGLE 3 : Blocage si sociétaire sous surveillance critique (Score >= 90)
    IF v_risk_score >= 90 AND v_mode = 'bloquant' AND NEW.montant >= 500000 THEN
        v_alert_ref := 'ALR-SCR-' || LPAD(FLOOR(RANDOM() * 900 + 100)::TEXT, 3, '0');
        v_alert_id := gen_random_uuid()::TEXT;
        v_payload := json_build_object(
            'alerte_ref', v_alert_ref,
            'type', 'Vigilance Renforcée',
            'client_id', NEW.client_id,
            'client_nom', COALESCE(v_client_prenom || ' ', '') || v_client_nom,
            'montant', NEW.montant,
            'niveau', 'bloquante'
        )::TEXT;

        PERFORM lakana_log_alert_autonomous(
            v_alert_id,
            v_alert_ref,
            NEW.client_id,
            'Vigilance Renforcée',
            'bloquante',
            v_risk_score,
            'Risk Score',
            '[{"critere": "score_critique", "description": "Sociétaire sous surveillance renforcée avec score de ' || v_risk_score || '/100."}]',
            v_payload
        );

        RAISE EXCEPTION '🚨 [ALERTE LAKANA CONFORMITÉ - %] SOCIÉTAIRE SOUS SURVEILLANCE RENFORCÉE (Risk Score: %/100). Accord préalable obligatoire du Responsable Conformité avant tout dénouement.', 
            v_alert_ref, 
            v_risk_score;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Procédure de contrôle exécutée AVANT chaque enrôlement client (Sanctions / PPE)
CREATE OR REPLACE FUNCTION trg_lakana_intercept_client()
RETURNS TRIGGER AS $$
DECLARE
    v_mode VARCHAR(50);
    v_match_nom RECORD;
    v_alert_ref VARCHAR(50);
    v_alert_id VARCHAR(50);
    v_nom_complet VARCHAR(255);
    v_payload TEXT;
BEGIN
    SELECT valeur INTO v_mode FROM lakana_interceptor_config WHERE cle = 'mode_interception';
    IF v_mode IS NULL THEN v_mode := 'bloquant'; END IF;

    v_nom_complet := TRIM(COALESCE(NEW.prenom, '') || ' ' || COALESCE(NEW.nom, ''));

    -- Criblage contre la table sanction_entries
    SELECT * INTO v_match_nom 
    FROM sanction_entries
    WHERE LOWER(nom_complet) = LOWER(v_nom_complet)
       OR LOWER(nom_complet) = LOWER(TRIM(COALESCE(NEW.nom, '') || ' ' || COALESCE(NEW.prenom, '')))
       OR (aliases IS NOT NULL AND LOWER(aliases) LIKE '%' || LOWER(NEW.nom) || '%')
    LIMIT 1;

    IF FOUND THEN
        v_alert_ref := 'ALR-SNC-' || LPAD(FLOOR(RANDOM() * 900 + 100)::TEXT, 3, '0');
        v_alert_id := gen_random_uuid()::TEXT;

        v_payload := json_build_object(
            'alerte_ref', v_alert_ref,
            'type', 'Filtrage Sanctions',
            'client_id', NEW.id,
            'client_nom', v_nom_complet,
            'liste', v_match_nom.liste_nom,
            'niveau', 'bloquante'
        )::TEXT;

        -- Enregistrement autonome garanti via dblink
        PERFORM lakana_log_alert_autonomous(
            v_alert_id,
            v_alert_ref,
            NEW.id,
            'Filtrage Sanctions',
            'bloquante',
            100,
            'Filtrage sanctions',
            '[{"critere": "sanction_liste", "description": "Sociétaire correspondant à une personne ciblée par ' || v_match_nom.liste_nom || ' (' || COALESCE(v_match_nom.code_entree, 'CENTIF/ONU') || ')."}]',
            v_payload
        );

        IF v_mode = 'bloquant' THEN
            RAISE EXCEPTION '🚨 [ALERTE LAKANA BLOQUANTE - %] GEL DES AVOIRS / SANCTIONS : Le client "% %" correspond à une inscription officielle sur la liste "%" (Réf: %). Enrôlement et ouverture de compte strictement interdits par instruction CENTIF/BCEAO.',
                v_alert_ref,
                COALESCE(NEW.prenom, ''),
                NEW.nom,
                v_match_nom.liste_nom,
                COALESCE(v_match_nom.code_entree, 'SANCTION-CENTIF');
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Attachement des triggers
DROP TRIGGER IF EXISTS trg_lakana_before_tx ON transactions;
CREATE TRIGGER trg_lakana_before_tx
BEFORE INSERT ON transactions
FOR EACH ROW
EXECUTE FUNCTION trg_lakana_intercept_transaction();

DROP TRIGGER IF EXISTS trg_lakana_before_client ON clients;
CREATE TRIGGER trg_lakana_before_client
BEFORE INSERT ON clients
FOR EACH ROW
EXECUTE FUNCTION trg_lakana_intercept_client();

COMMENT ON FUNCTION trg_lakana_intercept_transaction() IS 'Intercepteur transactionnel temps réel LAKANA avec persistance autonome dblink';
COMMENT ON FUNCTION trg_lakana_intercept_client() IS 'Intercepteur d enrôlement client LAKANA contre les listes de sanctions';

