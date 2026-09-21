import unittest
from datetime import datetime, timedelta
from unittest.mock import MagicMock
from app.models.transaction import Transaction
from app.services.structuring_service import StructuringService


class TestStructuringUnit(unittest.TestCase):
    def setUp(self):
        self.service = StructuringService()

    def test_detect_structuring_success(self):
        """Vérifie la détection d'une séquence de 4 transactions sous le seuil cumulant > 1M FCFA."""
        db_mock = MagicMock()
        now = datetime.utcnow()

        # 4 transactions de 850k à 950k FCFA (cumul 3.65M FCFA sous le seuil de 1M)
        mock_txs = [
            Transaction(id="t1", reference="TX-1", client_id="c1", montant=950000.0, date_transaction=now - timedelta(hours=10), type_operation="Dépôt"),
            Transaction(id="t2", reference="TX-2", client_id="c1", montant=880000.0, date_transaction=now - timedelta(hours=8), type_operation="Dépôt"),
            Transaction(id="t3", reference="TX-3", client_id="c1", montant=920000.0, date_transaction=now - timedelta(hours=6), type_operation="Dépôt"),
            Transaction(id="t4", reference="TX-4", client_id="c1", montant=900000.0, date_transaction=now - timedelta(hours=2), type_operation="Dépôt"),
        ]

        query_mock = db_mock.query.return_value
        filter_mock = query_mock.filter.return_value
        order_mock = filter_mock.order_by.return_value
        order_mock.all.return_value = mock_txs

        seq = self.service.detect_structuring(db_mock, client_id="c1", threshold=1000000.0, window_hours=48)
        
        self.assertIsNotNone(seq)
        self.assertEqual(seq.count, 4)
        self.assertEqual(seq.total_amount, 3650000.0)
        self.assertEqual(seq.window_hours, 48)
        self.assertEqual(seq.to_dict()["statut"], "bloquante")

    def test_no_structuring_when_transactions_normal(self):
        """Vérifie qu'aucune alerte n'est levée pour une seule petite transaction isolée."""
        db_mock = MagicMock()
        mock_txs = [
            Transaction(id="t1", reference="TX-1", client_id="c2", montant=250000.0, date_transaction=datetime.utcnow(), type_operation="Dépôt"),
        ]

        query_mock = db_mock.query.return_value
        filter_mock = query_mock.filter.return_value
        order_mock = filter_mock.order_by.return_value
        order_mock.all.return_value = mock_txs

        seq = self.service.detect_structuring(db_mock, client_id="c2", threshold=1000000.0, window_hours=48)
        self.assertIsNone(seq)


if __name__ == "__main__":
    unittest.main()
