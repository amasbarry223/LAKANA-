import unittest
from datetime import datetime
from app.db.session import SessionLocal, engine
from app.db.base import Base
from app.models import Client, Alert, Investigation, AuditLog
from app.repositories.investigation_repo import investigation_repository
from app.services.audit_service import audit_service


class TestInvestigationWorkflow(unittest.TestCase):
    def setUp(self):
        Base.metadata.create_all(bind=engine)
        self.db = SessionLocal()

    def tearDown(self):
        self.db.close()

    def test_complete_investigation_lifecycle(self):
        """Vérifie le workflow complet : Alerte -> Investigation -> Décision motivée -> Piste d'audit."""
        timestamp = int(datetime.utcnow().timestamp())
        cli_code = f"CLI-INV-{timestamp}"
        client = Client(code_client=cli_code, nom="Sidibé", prenom="Mamadou", risk_score=78)
        self.db.add(client)
        self.db.commit()

        # 1. Création Alerte
        alr_ref = f"ALR-{timestamp}"
        alert = Alert(
            reference=alr_ref,
            client_id=client.id,
            type_alerte="Fractionnement suspect",
            niveau="bloquante",
            score=78,
            statut="nouvelle",
        )
        self.db.add(alert)
        self.db.commit()

        # 2. Ouverture de l'investigation
        inv_ref = f"INV-{timestamp}"
        inv = Investigation(
            reference=inv_ref,
            alerte_id=alert.id,
            client_id=client.id,
            analyste="A. Touré",
            status="en_cours",
            type_motif="Fractionnement",
        )
        self.db.add(inv)
        self.db.commit()
        self.assertEqual(inv.status, "en_cours")

        # 3. Clôture avec décision motivée (INV-02)
        decision_text = "Déclaration de soupçon transmise au CENTIF suite au cumul de 5 retraits d'espèces rapprochés."
        updated_inv = investigation_repository.close_investigation(
            self.db, inv, status="transmise", decision=decision_text
        )
        self.assertEqual(updated_inv.status, "transmise")
        self.assertEqual(updated_inv.decision, decision_text)
        self.assertIsNotNone(updated_inv.date_cloture)

        # 4. Traçabilité dans l'audit log (INV-04)
        audit_entry = audit_service.log_action(
            self.db,
            utilisateur="Aminata Touré",
            role="Analyste conformité",
            action="Déclaration de soupçon transmise",
            module="Investigations",
            cible=inv_ref,
            details=decision_text,
        )
        self.assertIsNotNone(audit_entry.id)
        self.assertEqual(audit_entry.cible, inv_ref)

        # Nettoyage
        self.db.delete(updated_inv)
        self.db.delete(alert)
        self.db.delete(client)
        self.db.commit()


if __name__ == "__main__":
    unittest.main()
