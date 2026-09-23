import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_api_endpoints():
    print("Testing FastAPI endpoints...")

    # 1. Health check
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"
    print("[PASS] /health -> 200 OK")

    # 2. Stats overview
    res = client.get("/api/v1/stats/overview")
    assert res.status_code == 200
    data = res.json()
    assert "stats" in data
    print(f"[PASS] /api/v1/stats/overview -> 200 OK (Clients: {data['stats']['clients_filtres']}, Alertes actives: {data['stats']['alertes_actives']})")

    # 3. Clients list
    res = client.get("/api/v1/clients")
    assert res.status_code == 200
    clients = res.json()
    assert len(clients) > 0
    print(f"[PASS] /api/v1/clients -> 200 OK ({len(clients)} clients trouvés)")

    # 4. Alerts list
    res = client.get("/api/v1/alerts")
    assert res.status_code == 200
    alerts = res.json()
    assert len(alerts) > 0
    print(f"[PASS] /api/v1/alerts -> 200 OK ({len(alerts)} alertes trouvées)")

    # 5. Investigations list
    res = client.get("/api/v1/investigations")
    assert res.status_code == 200
    invs = res.json()
    assert len(invs) > 0
    print(f"[PASS] /api/v1/investigations -> 200 OK ({len(invs)} dossiers trouvés)")

    # 6. Fuzzy matching test
    res = client.get("/api/v1/filtrage/verifier?nom=Traore Moussa")
    assert res.status_code == 200
    matches = res.json()
    assert len(matches) > 0
    print(f"[PASS] /api/v1/filtrage/verifier -> 200 OK (Match: {matches[0]['nom_liste']}, {matches[0]['similarite']}%)")

    # 7. AI explanation
    ai_payload = {
        "client_nom": "Traoré Moussa",
        "client_code": "CLI-1042",
        "risk_score": 87,
        "facteurs": [
            "Fractionnement détecté (4 800 000 FCFA sur 48h)",
            "Volume inhabituel 3.4x",
        ],
    }
    res = client.post("/api/v1/assistant-ia/expliquer", json=ai_payload)
    assert res.status_code == 200
    ai_data = res.json()
    assert "synthese" in ai_data
    print("[PASS] /api/v1/assistant-ia/expliquer -> 200 OK")

    print("\n>>> TOUS LES ENDPOINTS REST FASTAPI FONCTIONNENT PARFAITEMENT ! <<<")


if __name__ == "__main__":
    test_api_endpoints()
