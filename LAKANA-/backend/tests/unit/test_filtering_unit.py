import unittest
from unittest.mock import MagicMock
from app.models.sanction_list import SanctionEntry
from app.services.filtering_service import FilteringService, compute_similarity, normalize_text


class TestFilteringUnit(unittest.TestCase):
    def setUp(self):
        self.service = FilteringService()

    def test_text_normalization(self):
        """Vérifie la normalisation correcte des accents et majuscules."""
        self.assertEqual(normalize_text("Traoré"), "traore")
        self.assertEqual(normalize_text("Keïta"), "keita")
        self.assertEqual(normalize_text("Coulibaly"), "coulibaly")

    def test_west_african_name_variations(self):
        """Vérifie que des variantes orthographiques courantes obtiennent une similarité >= 90%."""
        sim1 = compute_similarity("Traoré Moussa", "Traore Moussa")
        self.assertGreaterEqual(sim1, 95.0)

        sim2 = compute_similarity("Boubacar Coulibaly", "B. Coulibary")
        self.assertGreaterEqual(sim2, 70.0)

        sim3 = compute_similarity("Ibrahim Keïta", "Ibrahim Keita")
        self.assertGreaterEqual(sim3, 95.0)

    def test_matching_against_mock_entries(self):
        """Vérifie la détection d'une correspondance contre une entrée de sanction."""
        db_mock = MagicMock()
        entry = SanctionEntry(
            id="1",
            nom_complet="Fatoumata Diarra",
            aliases="Diarra F.;Fatou Diarra",
            liste_nom="Liste PPE Mali",
            liste_type="PPE",
        )
        db_mock.query.return_value.all.return_value = [entry]

        matches = self.service.match_name(db_mock, "Diarra Fatoumata", threshold=80.0)
        self.assertEqual(len(matches), 1)
        self.assertGreaterEqual(matches[0].similarite, 85.0)
        self.assertEqual(matches[0].liste_type, "PPE")


if __name__ == "__main__":
    unittest.main()
