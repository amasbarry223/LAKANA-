import unittest
from unittest.mock import MagicMock
from app.models.client import Client
from app.services.scoring_service import ScoringService


class TestScoringUnit(unittest.TestCase):
    def setUp(self):
        self.service = ScoringService()

    def test_risk_score_capping_at_100(self):
        """Vérifie que le Risk Score ne dépasse jamais 100 points."""
        db_mock = MagicMock()
        client = Client(
            id="test-1",
            code_client="CLI-TEST",
            nom="Test",
            est_ppe=True,
            transactions=[],
        )
        # Mock des services dépendants pour tester le calcul
        with unittest.mock.patch("app.services.scoring_service.structuring_service.detect_structuring") as mock_struct, \
             unittest.mock.patch("app.services.scoring_service.detection_service.analyze_behavior") as mock_det, \
             unittest.mock.patch("app.services.scoring_service.filtering_service.match_name") as mock_filt:
            
            mock_struct.return_value = MagicMock(count=5, total_amount=5000000, window_hours=48)
            mock_det.return_value = {
                "points_volume": 25,
                "points_frequence": 20,
                "facteurs": ["Volume élevé", "Fréquence anormale"],
            }
            mock_filt.return_value = []

            result = self.service.calculate_score(db_mock, client)
            # 30 (FRC) + 25 (VOL) + 20 (FREQ) + 15 (PPE) = 90
            self.assertLessEqual(result["score"], 100)
            self.assertEqual(result["score"], 90)
            self.assertEqual(result["niveau_risque"], "Élevé")
            self.assertIn("decomposition", result)

    def test_low_risk_classification(self):
        """Vérifie qu'un client sans signal anormal est classé en risque Faible."""
        db_mock = MagicMock()
        client = Client(
            id="test-2",
            code_client="CLI-LOW",
            nom="Normal",
            est_ppe=False,
            transactions=[],
        )
        with unittest.mock.patch("app.services.scoring_service.structuring_service.detect_structuring") as mock_struct, \
             unittest.mock.patch("app.services.scoring_service.detection_service.analyze_behavior") as mock_det, \
             unittest.mock.patch("app.services.scoring_service.filtering_service.match_name") as mock_filt:
            
            mock_struct.return_value = None
            mock_det.return_value = {
                "points_volume": 0,
                "points_frequence": 0,
                "facteurs": [],
            }
            mock_filt.return_value = []

            result = self.service.calculate_score(db_mock, client)
            self.assertEqual(result["score"], 0)
            self.assertEqual(result["niveau_risque"], "Faible")


if __name__ == "__main__":
    unittest.main()
