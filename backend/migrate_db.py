"""Script de migration automatique pour assurer la conformité du schéma de la base."""
import logging
from sqlalchemy import text
from app.db.session import engine

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("migration")

def migrate():
    with engine.connect() as conn:
        # Transactions : colonnes de comptes et champs réglementaires
        statements = [
            "ALTER TABLE transactions ADD COLUMN IF NOT EXISTS numero_compte_expediteur VARCHAR(255);",
            "ALTER TABLE transactions ADD COLUMN IF NOT EXISTS numero_compte_beneficiaire VARCHAR(255);",
            "ALTER TABLE transactions ADD COLUMN IF NOT EXISTS compte_source_id VARCHAR(255);",
            "ALTER TABLE transactions ADD COLUMN IF NOT EXISTS compte_destination_id VARCHAR(255);",
            "ALTER TABLE transactions ADD COLUMN IF NOT EXISTS numero_depot VARCHAR(255);",
            "ALTER TABLE transactions ADD COLUMN IF NOT EXISTS agence VARCHAR(255) DEFAULT 'Agence Centrale Bamako';",
            "ALTER TABLE transactions ADD COLUMN IF NOT EXISTS cause_operation VARCHAR(500);",
            "ALTER TABLE transactions ADD COLUMN IF NOT EXISTS caractere VARCHAR(50) DEFAULT 'Habituel';",
            "ALTER TABLE transactions ADD COLUMN IF NOT EXISTS operateur VARCHAR(255) DEFAULT 'Guichetier 01';",
            "CREATE INDEX IF NOT EXISTS ix_transactions_compte_exp ON transactions (numero_compte_expediteur);",
            "CREATE INDEX IF NOT EXISTS ix_transactions_compte_ben ON transactions (numero_compte_beneficiaire);",
            
            # Clients : champs réglementaires
            "ALTER TABLE clients ADD COLUMN IF NOT EXISTS agence VARCHAR(255) DEFAULT 'Agence Centrale Bamako';",
            "ALTER TABLE clients ADD COLUMN IF NOT EXISTS adresse_complete VARCHAR(500);",
            "ALTER TABLE clients ADD COLUMN IF NOT EXISTS lieu_naissance VARCHAR(255);",
            "ALTER TABLE clients ADD COLUMN IF NOT EXISTS lieu_residence VARCHAR(255);",
            
            # Sanctions / PPE : champs réglementaires
            "ALTER TABLE sanction_entries ADD COLUMN IF NOT EXISTS agence VARCHAR(255) DEFAULT 'Agence Centrale Bamako';",
            "ALTER TABLE sanction_entries ADD COLUMN IF NOT EXISTS numero_compte VARCHAR(255);",
            "ALTER TABLE sanction_entries ADD COLUMN IF NOT EXISTS lieu_naissance VARCHAR(255);",
            "ALTER TABLE sanction_entries ADD COLUMN IF NOT EXISTS lieu_residence VARCHAR(255);",
        ]
        for stmt in statements:
            try:
                conn.execute(text(stmt))
                conn.commit()
                logger.info(f"Appliqué : {stmt}")
            except Exception as e:
                logger.warning(f"Erreur sur '{stmt}': {e}")

if __name__ == "__main__":
    migrate()
    print("Migration terminée avec succès.")
