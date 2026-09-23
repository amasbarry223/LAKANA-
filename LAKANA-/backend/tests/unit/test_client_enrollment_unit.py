import unittest
from app.db.session import SessionLocal
from app.models.client import Client
from app.schemas.client import ClientCreate
from app.repositories.client_repo import client_repository


class TestClientEnrollmentUnit(unittest.TestCase):
    """Vérifie la logique métier d'enrôlement des clients Particuliers (PPE) et Entreprises."""

    def setUp(self):
        self.db = SessionLocal()

    def tearDown(self):
        # Nettoyage des clients de test
        self.db.query(Client).filter(Client.code_client.in_(["TEST-PPE-01", "TEST-ENT-01"])).delete()
        self.db.commit()
        self.db.close()

    def test_particulier_ppe_enrollment_and_risk(self):
        """Vérifie l'enrôlement d'un particulier PPE avec statut de risque renforcé."""
        client_in = ClientCreate(
            code_client="TEST-PPE-01",
            nom="Keïta",
            prenom="Ibrahim",
            type_client="Particulier",
            profession="Haut Fonctionnaire",
            ville="Bamako",
            est_ppe=True,
            fonction_ppe="Directeur Général Agence Publique",
            type_ppe="PPE Nationale",
            pays_mandat="Mali",
            niveau_risque="Élevé",
        )
        client = client_repository.create(self.db, client_in)
        self.assertEqual(client.type_client, "Particulier")
        self.assertTrue(client.est_ppe)
        self.assertEqual(client.fonction_ppe, "Directeur Général Agence Publique")
        self.assertEqual(client.type_ppe, "PPE Nationale")
        self.assertEqual(client.niveau_risque, "Élevé")

    def test_entreprise_enrollment(self):
        """Vérifie l'enrôlement d'une entreprise (Personne morale) avec ses identifiants légaux."""
        client_in = ClientCreate(
            code_client="TEST-ENT-01",
            nom="Sahel Transit",
            type_client="Entreprise",
            raison_sociale="Sahel Transit SARL",
            forme_juridique="SARL",
            rccm="MA.BKO.2024.B.9981",
            nif="084512984X",
            secteur_activite="Transit & Logistique",
            beneficiaire_effectif="Amadou Diallo (60%), Ousmane Barry (40%)",
            ville="Ségou",
            est_ppe=False,
            niveau_risque="Moyen",
        )
        client = client_repository.create(self.db, client_in)
        self.assertEqual(client.type_client, "Entreprise")
        self.assertEqual(client.raison_sociale, "Sahel Transit SARL")
        self.assertEqual(client.forme_juridique, "SARL")
        self.assertEqual(client.rccm, "MA.BKO.2024.B.9981")
        self.assertFalse(client.est_ppe)
