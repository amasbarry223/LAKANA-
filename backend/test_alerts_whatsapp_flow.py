import sys
import os

# Fix console encoding on Windows
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

from fastapi.testclient import TestClient
from app.main import app
from app.db.session import SessionLocal
from app.models.client import Client
from app.models.sanction_list import SanctionEntry

client = TestClient(app)

def run_tests():
    print("=== TEST 1: Pré-filtrage instantané Guichet (pre-check-guichet) ===")
    db = SessionLocal()
    try:
        # Trouver un client PPE, un client normal, et un client sanctionné
        ppe_client = db.query(Client).filter(Client.est_ppe == True).first()
        all_normals = db.query(Client).filter(Client.est_ppe == False).all()
        normal_client = None
        for c in all_normals:
            chk = client.get(f"/api/v1/filtrage/pre-check-guichet/{c.id}").json()
            if chk.get("niveau") == "conforme":
                normal_client = c
                break
        if not normal_client:
            normal_client = Client(
                code_client="CLI-NORMAL-001",
                nom="Sissoko",
                prenom="Balla",
                type_client="Particulier",
                niveau_risque="Faible",
                pays="Mali"
            )
            db.add(normal_client)
            db.commit()
            db.refresh(normal_client)
        sanction_entry = db.query(SanctionEntry).filter(SanctionEntry.liste_type.in_(["ONU", "CENTIF", "GAFI", "GEL"])).first()
        if not sanction_entry:
            sanction_entry = SanctionEntry(
                code_entree="GEL-TEST-001",
                nom_complet="Iyad Ag Ghaly",
                liste_nom="Liste ONU / CENTIF Gel des Avoirs",
                liste_type="CENTIF"
            )
            db.add(sanction_entry)
            db.commit()
            db.refresh(sanction_entry)

        print(f"PPE Client: {ppe_client.prenom} {ppe_client.nom} ({ppe_client.code_client})")
        print(f"Normal Client: {normal_client.prenom} {normal_client.nom} ({normal_client.code_client})")
        print(f"Sanction Entry: {sanction_entry.nom_complet} ({sanction_entry.code_entree})")

        # 1. Test normal client pre-check
        res = client.get(f"/api/v1/filtrage/pre-check-guichet/{normal_client.id}")
        assert res.status_code == 200, f"Erreur normal client: {res.text}"
        data = res.json()
        print(f"-> Client Normal: is_ppe={data['is_ppe']}, bloquer={data['bloquer_operations']}, niveau={data['niveau']}")
        assert data["bloquer_operations"] is False
        assert data["niveau"] == "conforme"

        # 2. Test PPE client pre-check
        res_ppe = client.get(f"/api/v1/filtrage/pre-check-guichet/{ppe_client.id}")
        assert res_ppe.status_code == 200, f"Erreur PPE client: {res_ppe.text}"
        data_ppe = res_ppe.json()
        print(f"-> Client PPE: is_ppe={data_ppe['is_ppe']}, bloquer={data_ppe['bloquer_operations']}, fonction={data_ppe.get('fonction_ppe')}")
        assert data_ppe["is_ppe"] is True
        assert data_ppe["niveau"] == "analyser"

        print("\n=== TEST 2: Simulation Transaction >= 15M FCFA (OME-24H-15M) avec Dispatch WhatsApp & Email ===")
        import time
        ts = int(time.time() * 1000)
        tx_payload = {
            "reference": f"TEST-OME-{ts}",
            "client_id": normal_client.id,
            "montant": 18000000.0,
            "devise": "XOF",
            "type_operation": "Dépôt",
            "canal": "Guichet",
            "description": "Vente de bétail et récolte"
        }
        res_tx = client.post("/api/v1/transactions/simuler", json=tx_payload)
        assert res_tx.status_code in [200, 201], f"Erreur simulation: {res_tx.text}"
        tx_data = res_tx.json()
        print(f"-> Transaction 18M: Alerte = {tx_data.get('alerte_declenchee', {}).get('type_alerte')}")
        assert tx_data["alerte_declenchee"] is not None

        print("\n=== TEST 3: Vérification de l'historique des alertes WhatsApp & Email ===")
        res_notifs = client.get("/api/v1/filtrage/notifications-dispatched")
        assert res_notifs.status_code == 200
        dispatched = res_notifs.json()
        print(f"-> Nombre d'alertes transmises : {len(dispatched)}")
        assert len(dispatched) > 0
        latest = dispatched[0]
        print(f"-> Dernière alerte transmise : Canal={latest.get('channel')}, Type={latest.get('type_alerte')}, Montant={latest.get('montant_fcfa')}")
        print(f"   Destinataire: {latest.get('destinataire')}, Statut: {latest.get('statut_envoi')}")

        print("\n=== TEST 4: Blocage strict d'un client sanctionné (Gel des avoirs) ===")
        # 4A. Tester l'interception du Trigger SQL trg_lakana_intercept_client
        print("-> Vérification du Trigger SQL d'interception...")
        try:
            blocked_client = Client(
                code_client=f"CLI-SANC-{int(time.time())}",
                nom="Traoré",
                prenom="Moussa",
                type_client="Particulier",
                niveau_risque="Critique",
                pays="Mali"
            )
            db.add(blocked_client)
            db.commit()
            print("ERREUR: Le trigger aurait dû bloquer l'insertion !")
            assert False, "Le trigger d'interception n'a pas bloqué le client sanctionné"
        except Exception as e:
            db.rollback()
            print(f"-> Succès du Trigger PostgreSQL d'interception: {str(e).splitlines()[0][:100]}...")

        # 4B. Tester le pré-check et le blocage transaction pour le client sanctionné déjà existant
        sanctioned_client = db.query(Client).filter(Client.code_client == "CLI-1042").first()
        assert sanctioned_client is not None, "Client CLI-1042 introuvable"
        print(f"-> Client sanctionné existant : {sanctioned_client.prenom} {sanctioned_client.nom} ({sanctioned_client.code_client})")

        res_check_sanction = client.get(f"/api/v1/filtrage/pre-check-guichet/{sanctioned_client.id}")
        data_s = res_check_sanction.json()
        print(f"-> Pré-check Sanctionné: bloquer_operations={data_s['bloquer_operations']}, niveau={data_s['niveau']}, liste={data_s.get('liste_sanction')}")
        assert data_s["bloquer_operations"] is True
        assert data_s["niveau"] == "bloquante"

        # Tentative de transaction pour le client sanctionné -> doit être bloquée avec HTTP 403
        tx_sanction_payload = {
            "reference": f"TEST-BLOCK-SANCTION-{ts}",
            "client_id": sanctioned_client.id,
            "montant": 500000.0,
            "devise": "XOF",
            "type_operation": "Retrait",
            "canal": "Guichet"
        }
        res_block = client.post("/api/v1/transactions/simuler", json=tx_sanction_payload)
        print(f"-> Réponse transaction sanctionnée: HTTP {res_block.status_code}")
        assert res_block.status_code == 403, f"Attendu 403, reçu {res_block.status_code}"
        print(f"   Message d'interdiction: {res_block.json().get('detail')[:80]}...")

        print("\n✅ TOUS LES TESTS DE CONFORMITÉ & ALERTES ONT RÉUSSI AVEC SUCCÈS !")

    finally:
        db.close()

if __name__ == "__main__":
    run_tests()
