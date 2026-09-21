import unittest
from datetime import datetime
from app.db.session import SessionLocal, engine
from app.db.base import Base
from app.models import Client, Account, Transaction, Alert


class TestDbPersistence(unittest.TestCase):
    def setUp(self):
        Base.metadata.create_all(bind=engine)
        self.db = SessionLocal()

    def tearDown(self):
        self.db.close()

    def test_client_account_transaction_persistence(self):
        """Vérifie la persistance et les relations en base entre Client, Compte et Transaction."""
        code = f"CLI-TEST-{int(datetime.utcnow().timestamp())}"
        client = Client(
            code_client=code,
            nom="Konaté",
            prenom="Bakary",
            profession="Commerçant",
            ville="Ségou",
            risk_score=35,
        )
        self.db.add(client)
        self.db.commit()
        self.db.refresh(client)

        account = Account(
            numero_compte=f"CPTE-{code}",
            client_id=client.id,
            type_compte="Courant",
            solde=1500000.0,
        )
        self.db.add(account)
        self.db.commit()

        tx = Transaction(
            reference=f"TX-{code}",
            client_id=client.id,
            compte_source_id=account.id,
            montant=500000.0,
            type_operation="Dépôt",
        )
        self.db.add(tx)
        self.db.commit()

        # Lecture avec relations
        saved_client = self.db.query(Client).filter(Client.code_client == code).first()
        self.assertIsNotNone(saved_client)
        self.assertEqual(len(saved_client.comptes), 1)
        self.assertEqual(saved_client.comptes[0].solde, 1500000.0)
        self.assertEqual(len(saved_client.transactions), 1)
        self.assertEqual(saved_client.transactions[0].montant, 500000.0)

        # Nettoyage
        self.db.delete(saved_client)
        self.db.commit()


if __name__ == "__main__":
    unittest.main()
