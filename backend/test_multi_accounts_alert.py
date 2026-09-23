import sys
import os

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

from fastapi.testclient import TestClient
from app.main import app
from app.db.session import SessionLocal
from app.models.client import Client
from app.services.detection_service import detection_service

client = TestClient(app)

def run():
    print("=== TEST MULTI-COMPTES / CREATION DE NOUVEAU COMPTE (CNI / NIF) ===")
    db = SessionLocal()
    try:
        # 1. Rechercher un client particulier avec plusieurs comptes
        all_clients = db.query(Client).all()
        multi_particulier = next((c for c in all_clients if c.type_client == "Particulier" and len(c.comptes) > 1 and c.piece_identite), None)
        multi_entreprise = next((c for c in all_clients if c.type_client == "Entreprise" and len(c.comptes) > 1 and c.nif), None)
        
        # Trouver un client avec compte unique qui est conforme au filtrage
        single_client = None
        for c in all_clients:
            if len(c.comptes) == 1 and not c.est_ppe:
                chk = client.get(f"/api/v1/filtrage/pre-check-guichet/{c.id}").json()
                if chk.get("niveau") == "conforme":
                    single_client = c
                    break

        print(f"-> Particulier Multi-comptes : {multi_particulier.nom} ({multi_particulier.code_client}) - {multi_particulier.piece_identite} - {len(multi_particulier.comptes)} comptes")
        print(f"-> Entreprise Multi-comptes  : {multi_entreprise.nom} ({multi_entreprise.code_client}) - NIF: {multi_entreprise.nif} - {len(multi_entreprise.comptes)} comptes")
        print(f"-> Client Compte Unique      : {single_client.nom} ({single_client.code_client}) - {len(single_client.comptes)} compte")

        # 2. Test détection service python
        res_part = detection_service.check_multi_accounts_identity(db, multi_particulier)
        assert res_part["has_multi_accounts"] is True
        assert res_part["comptes_count"] >= 2
        print(f"-> Test Service Particulier OK : has_multi={res_part['has_multi_accounts']}, identifiant={res_part['identifiant_cle']}")

        res_ent = detection_service.check_multi_accounts_identity(db, multi_entreprise)
        assert res_ent["has_multi_accounts"] is True
        assert res_ent["comptes_count"] >= 2
        print(f"-> Test Service Entreprise OK : has_multi={res_ent['has_multi_accounts']}, identifiant={res_ent['identifiant_cle']}")

        res_single = detection_service.check_multi_accounts_identity(db, single_client)
        assert res_single["has_multi_accounts"] is False
        assert res_single["comptes_count"] == 1
        print(f"-> Test Service Compte Unique OK : has_multi={res_single['has_multi_accounts']}")

        # 3. Test API endpoint pre-check-guichet
        api_res_part = client.get(f"/api/v1/filtrage/pre-check-guichet/{multi_particulier.id}").json()
        assert api_res_part["found"] is True
        assert api_res_part["has_multi_accounts"] is True
        assert api_res_part["comptes_count"] >= 2
        assert len(api_res_part["comptes"]) >= 2
        print(f"-> Test API Guichet Multi-comptes OK : {api_res_part['message']}")

        # 4. Test API endpoint avec compte unique
        api_res_single = client.get(f"/api/v1/filtrage/pre-check-guichet/{single_client.id}").json()
        assert api_res_single["found"] is True
        assert api_res_single["has_multi_accounts"] is False
        assert api_res_single["niveau"] == "conforme"
        print(f"-> Test API Guichet Compte Unique OK : {api_res_single['message']}")

        print("\nSUCCES : Tous les tests d'alerte Multi-Comptes (CNI & NIF) ont reussi avec succes !")

    finally:
        db.close()

if __name__ == "__main__":
    run()
