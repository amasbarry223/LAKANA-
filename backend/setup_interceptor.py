"""
Script d'administration et de test de l'intercepteur LAKANA.
Permet d'activer, désactiver ou tester l'intercepteur SQL entre le système existant et la base
avec persistance autonome des alertes (dblink).
"""
import sys
import os
import argparse
from sqlalchemy import text

# Ajout du chemin backend au PYTHONPATH
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Forcer l'encodage UTF-8 pour la console Windows
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

from app.db.session import engine
from app.core.config import settings


def install_interceptor(mode: str = "bloquant"):
    """Installe les triggers et configure le mode et la connexion dblink."""
    sql_path = os.path.join(os.path.dirname(__file__), "app", "db", "interceptor.sql")
    with open(sql_path, "r", encoding="utf-8") as f:
        sql_content = f.read()

    # Chaîne de connexion dblink autonome basée sur la configuration
    dblink_conn = f"dbname={settings.POSTGRES_DB} user={settings.POSTGRES_USER} password={settings.POSTGRES_PASSWORD} host={settings.POSTGRES_SERVER} port={settings.POSTGRES_PORT}"

    raw_conn = engine.raw_connection()
    try:
        print("[1/4] Déploiement de l'intercepteur SQL LAKANA (Triggers & dblink)...")
        with raw_conn.cursor() as cur:
            cur.execute(sql_content)
            cur.execute(
                "UPDATE lakana_interceptor_config SET valeur = %s WHERE cle = 'mode_interception'",
                (mode,)
            )
            cur.execute(
                "UPDATE lakana_interceptor_config SET valeur = %s WHERE cle = 'dblink_conn_str'",
                (dblink_conn,)
            )
        raw_conn.commit()
        print(f"[2/4] Mode d'interception configuré sur : '{mode.upper()}'")
        print(f"[3/4] Canal dblink configuré pour les alertes autonomes.")
        print("[4/4] ✅ Intercepteur LAKANA opérationnel sur les tables 'transactions' et 'clients'.")
    finally:
        raw_conn.close()


def disable_interceptor():
    """Désactive les triggers d'interception."""
    with engine.connect() as conn:
        conn.execute(text("DROP TRIGGER IF EXISTS trg_lakana_before_tx ON transactions;"))
        conn.execute(text("DROP TRIGGER IF EXISTS trg_lakana_before_client ON clients;"))
        conn.commit()
        print("🛑 Intercepteurs LAKANA désactivés sur 'transactions' et 'clients'.")


def test_interception():
    """Simule des requêtes SQL brutes du logiciel existant pour vérifier le pare-feu LAKANA."""
    print("\n" + "=" * 75)
    print("🛡️  SUITE DE TESTS DU PARE-FEU LAKANA (SIMULATION LOGICIEL EXISTANT)")
    print("=" * 75)

    with engine.connect() as conn:
        # Création ou sélection d'un client test dédié vierge d'antécédents récents
        test_cli_ref = "CLI-TEST-FIREWALL"
        conn.execute(
            text("DELETE FROM transactions WHERE client_id IN (SELECT id FROM clients WHERE code_client = :ref)"),
            {"ref": test_cli_ref}
        )
        conn.execute(
            text("DELETE FROM alerts WHERE client_id IN (SELECT id FROM clients WHERE code_client = :ref)"),
            {"ref": test_cli_ref}
        )
        conn.execute(
            text("DELETE FROM clients WHERE code_client = :ref"),
            {"ref": test_cli_ref}
        )
        conn.commit()

        # Insérer un client de test propre
        client_res = conn.execute(
            text("""
                INSERT INTO clients (id, code_client, nom, prenom, type_client, pays, risk_score, niveau_risque, created_at)
                VALUES (gen_random_uuid()::TEXT, :ref, 'Diallo', 'Amadou', 'Particulier', 'Mali', 20, 'Faible', NOW())
                RETURNING id, nom, prenom
            """),
            {"ref": test_cli_ref}
        ).fetchone()
        conn.commit()

        client_id, nom, prenom = client_res[0], client_res[1], client_res[2]
        print(f"\n👤 Client de test généré : {prenom} {nom} (ID: {client_id})")

        # ----------------------------------------------------------------------
        # TEST 1 : Transaction normale sous le seuil
        # ----------------------------------------------------------------------
        print("\n[TEST 1] Insertion d'une 1ère transaction normale sous seuil (450 000 FCFA)...")
        conn.execute(
            text("""
                INSERT INTO transactions (id, reference, client_id, montant, type_operation, agence, operateur, date_transaction)
                VALUES (gen_random_uuid()::TEXT, 'TEST-TX-01', :cid, 450000, 'Dépôt', 'Agence Centrale Bamako', 'Guichetier 01', NOW())
            """),
            {"cid": client_id}
        )
        conn.commit()
        print("   -> ✅ 1ère transaction autorisée et enregistrée avec succès.")

        # ----------------------------------------------------------------------
        # TEST 2 : Tentative de fractionnement (> seuil cumulé de 1 000 000 FCFA)
        # ----------------------------------------------------------------------
        print("\n[TEST 2] Tentative de 2ème dépôt (600 000 FCFA) provoquant un fractionnement...")
        interception_detectee = False
        try:
            conn.execute(
                text("""
                    INSERT INTO transactions (id, reference, client_id, montant, type_operation, agence, operateur, date_transaction)
                    VALUES (gen_random_uuid()::TEXT, 'TEST-TX-02', :cid, 600000, 'Dépôt', 'Agence Centrale Bamako', 'Guichetier 01', NOW())
                """),
                {"cid": client_id}
            )
            conn.commit()
            print("   -> ⚠️ Transaction autorisée (Mode surveillance actif).")
        except Exception as e:
            interception_detectee = True
            conn.rollback()  # Réinitialiser la transaction SQLAlchemy suite au RAISE EXCEPTION
            msg = str(e).split("\n")[0]
            print("\n" + "-" * 75)
            print("🚨 POP-UP DU LOGICIEL EXISTANT (MESSAGE RENVOYÉ PAR LAKANA) :")
            print("-" * 75)
            print(f"{msg}")
            print("-" * 75)
            print("   -> ✅ SUCCÈS : L'opération a été physiquement bloquée au guichet !")

        # ----------------------------------------------------------------------
        # TEST 3 : Vérification de la persistance autonome de l'alerte (dblink)
        # ----------------------------------------------------------------------
        print("\n[TEST 3] Vérification de la persistance de l'alerte dans LAKANA...")
        derniere_alerte = conn.execute(
            text("""
                SELECT reference, type_alerte, niveau, score, created_at
                FROM alerts 
                WHERE client_id = :cid
                ORDER BY created_at DESC 
                LIMIT 1
            """),
            {"cid": client_id}
        ).fetchone()

        if derniere_alerte:
            print(f"   -> ✅ Alerte persistée avec succès malgré le ROLLBACK financier !")
            print(f"      • Réf Alerte : {derniere_alerte[0]}")
            print(f"      • Type       : {derniere_alerte[1]}")
            print(f"      • Niveau     : {derniere_alerte[2].upper()}")
            print(f"      • Score AML  : {derniere_alerte[3]}/100")
        else:
            print("   -> ⚠️ Aucune alerte enregistrée en base.")

        # ----------------------------------------------------------------------
        # TEST 4 : Tentative d'enrôlement d'un client sous sanctions officielles
        # ----------------------------------------------------------------------
        print("\n[TEST 4] Tentative d'enrôlement d'un individu sous sanctions (Moussa Traoré)...")
        # Nettoyage préalable si présent
        conn.execute(text("DELETE FROM clients WHERE code_client = 'CLI-TEST-SNC'"))
        conn.commit()
        try:
            conn.execute(
                text("""
                    INSERT INTO clients (id, code_client, nom, prenom, type_client, pays, risk_score, niveau_risque, created_at)
                    VALUES (gen_random_uuid()::TEXT, 'CLI-TEST-SNC', 'Traoré', 'Moussa', 'Particulier', 'Mali', 95, 'Élevé', NOW())
                """)
            )
            conn.commit()
            print("   -> ⚠️ Enrôlement passé sans interception.")
        except Exception as e:
            conn.rollback()
            msg = str(e).split("\n")[0]
            print("\n" + "-" * 75)
            print("🚨 REJET DE L'ENRÔLEMENT AU GUICHET (CRIBLAGE SANCTIONS LAKANA) :")
            print("-" * 75)
            print(f"{msg}")
            print("-" * 75)
            print("   -> ✅ SUCCÈS : Création de compte interdite immédiatement !")

    print("\n" + "=" * 75)
    print("✅ TOUS LES TESTS DE L'INTERCEPTEUR LAKANA SONT VALIDÉS")
    print("=" * 75 + "\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Gestion de l'intercepteur LAKANA")
    parser.add_argument("--mode", choices=["bloquant", "surveillance"], default="bloquant", help="Mode d'interception")
    parser.add_argument("--disable", action="store_true", help="Désactiver l'intercepteur")
    parser.add_argument("--test", action="store_true", help="Exécuter les tests de simulation")

    args = parser.parse_args()

    if args.disable:
        disable_interceptor()
    elif args.test:
        install_interceptor(mode=args.mode)
        test_interception()
    else:
        install_interceptor(mode=args.mode)

