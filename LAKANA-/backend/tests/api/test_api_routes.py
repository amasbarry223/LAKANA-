import unittest
from fastapi.testclient import TestClient
from app.main import app


class TestApiRoutes(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_health_check(self):
        res = self.client.get("/health")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["status"], "healthy")

    def test_stats_overview(self):
        res = self.client.get("/api/v1/stats/overview")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("stats", data)
        self.assertIn("modules", data)
        self.assertEqual(data["statut_systeme"], "Opérationnel")

    def test_list_clients(self):
        res = self.client.get("/api/v1/clients")
        self.assertEqual(res.status_code, 200)
        clients = res.json()
        self.assertIsInstance(clients, list)
        self.assertGreater(len(clients), 0)

    def test_list_alerts_with_counts(self):
        res = self.client.get("/api/v1/alerts")
        self.assertEqual(res.status_code, 200)
        alerts = res.json()
        self.assertIsInstance(alerts, list)

        res_counts = self.client.get("/api/v1/alerts/counts")
        self.assertEqual(res_counts.status_code, 200)
        counts = res_counts.json()
        self.assertIn("total", counts)
        self.assertIn("bloquante", counts)

    def test_investigations_and_decision_validation(self):
        res = self.client.get("/api/v1/investigations")
        self.assertEqual(res.status_code, 200)
        invs = res.json()
        self.assertIsInstance(invs, list)
        self.assertGreater(len(invs), 0)

        # Test validation : tentative de clôture sans décision motivée -> 400 Bad Request
        inv_id = invs[0]["id"]
        res_fail = self.client.post(f"/api/v1/investigations/{inv_id}/close", json={"status": "cloturee", "decision": "   "})
        self.assertEqual(res_fail.status_code, 400)

    def test_filtering_fuzzy_matching(self):
        res = self.client.get("/api/v1/filtrage/verifier?nom=Traore Moussa")
        self.assertEqual(res.status_code, 200)
        matches = res.json()
        self.assertIsInstance(matches, list)
        self.assertGreater(len(matches), 0)

    def test_ai_explanation_endpoint(self):
        payload = {
            "client_nom": "Diarra Fatoumata",
            "risk_score": 72,
            "facteurs": ["Similarité 96% Liste PPE Mali", "Volume inhabituel"],
        }
        res = self.client.post("/api/v1/assistant-ia/expliquer", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("synthese", data)
        self.assertIn("rappel_conformite", data)

    def test_ai_chat_endpoint(self):
        # 1. Requête générale
        res_gen = self.client.post("/api/v1/assistant-ia/chat", json={"message": "Bonjour"})
        self.assertEqual(res_gen.status_code, 200)
        data_gen = res_gen.json()
        self.assertEqual(data_gen["intent"], "GENERAL")
        self.assertIn("response", data_gen)
        self.assertIn("suggestions", data_gen)

        # 2. Requête explication d'un client réel en base (Diarra)
        res_cli = self.client.post("/api/v1/assistant-ia/chat", json={"message": "Expliquer le score de Diarra"})
        self.assertEqual(res_cli.status_code, 200)
        data_cli = res_cli.json()
        self.assertEqual(data_cli["intent"], "EXPLAIN_CLIENT")
        self.assertIsNotNone(data_cli["context_client"])
        self.assertIn("Diarra", data_cli["response"])

        # 3. Requête top risque
        res_top = self.client.post("/api/v1/assistant-ia/chat", json={"message": "Quels sont les clients les plus risqués ?"})
        self.assertEqual(res_top.status_code, 200)
        self.assertEqual(res_top.json()["intent"], "TOP_RISQUE")

        # 4. Requête fractionnement
        res_frac = self.client.post("/api/v1/assistant-ia/chat", json={"message": "Y a-t-il du fractionnement détecté ?"})
        self.assertEqual(res_frac.status_code, 200)
        self.assertEqual(res_frac.json()["intent"], "FRACTIONNEMENT")

    def test_ai_context_endpoint(self):
        res = self.client.get("/api/v1/assistant-ia/context")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("stats_alertes", data)
        self.assertIn("stats_clients", data)
        self.assertIn("models_ready", data)
        self.assertIn("suggested_queries", data)


if __name__ == "__main__":
    unittest.main()
