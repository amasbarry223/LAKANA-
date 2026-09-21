import unittest
from app.services.ai_service import AIService


class TestAIUnit(unittest.TestCase):
    def setUp(self):
        self.service = AIService()

    def test_ai_explanation_contains_mandatory_disclaimer(self):
        """Vérifie que la synthèse IA contient impérativement le rappel de décision humaine (IA-03)."""
        res = self.service.explain_alert(
            client_nom="Traoré Moussa",
            score=87,
            facteurs=["Fractionnement détecté (4.8M FCFA sur 48h)", "Volume inhabituel"],
            client_code="CLI-1042",
        )
        self.assertIn("décision finale", res.rappel_conformite.lower())
        self.assertIn("analyste", res.rappel_conformite.lower())
        self.assertIn("87/100", res.synthese)
        self.assertIn("Traoré Moussa", res.synthese)

    def test_ai_explanation_factual_consistency(self):
        """Vérifie que l'explication reprend fidèlement tous les facteurs transmis (IA-02)."""
        facteurs = ["Volume 3x supérieur", "Client PPE"]
        res = self.service.explain_alert(
            client_nom="Fatoumata Diarra",
            score=72,
            facteurs=facteurs,
        )
        for f in facteurs:
            self.assertIn(f, res.synthese)


if __name__ == "__main__":
    unittest.main()
