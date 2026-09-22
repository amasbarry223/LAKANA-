"""
LAKANA — Script de seed de transactions réalistes UEMOA/FCFA
Peuple la BDD avec des transactions cohérentes par client pour activer les features ML.
Usage : python seed_realistic_transactions.py
"""
import sys
import os
import uuid
import random
from datetime import datetime, timedelta

# Ajouter le répertoire backend au path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.db.session import SessionLocal
from app.models.client import Client
from app.models.transaction import Transaction

# ── Listes de noms ouest-africains pour bénéficiaires ───────────────────────
PRENOMS = [
    "Amadou", "Fatoumata", "Moussa", "Aminata", "Ibrahim", "Mariam",
    "Seydou", "Kadiatou", "Oumar", "Aissatou", "Boubacar", "Mariama",
    "Abdoulaye", "Adjaratou", "Cheick", "Fanta", "Modibo", "Hawa",
    "Youssouf", "Rokia", "Salif", "Oumou", "Drissa", "Nana",
]
NOMS = [
    "Traoré", "Diallo", "Coulibaly", "Keïta", "Diarra", "Camara",
    "Koné", "Bah", "Cissé", "Touré", "Sanogo", "Kouyaté",
    "Dembélé", "Sidibé", "Samaké", "Doumbia", "Sissoko", "Maïga",
    "Diabaté", "Barry", "Fofana", "Koné", "Ballo", "Guindo",
]
TYPES_OP = ["Dépôt", "Retrait", "Virement", "Mobile Money", "Dépôt", "Retrait"]
CANAUX = ["Guichet", "Agent", "Mobile", "Guichet", "Mobile"]


def rand_benef() -> str:
    return f"{random.choice(NOMS)}, {random.choice(PRENOMS)}"


def rand_date(days_back_max: int = 90) -> datetime:
    delta = random.randint(0, days_back_max * 24 * 60)  # en minutes
    return datetime.utcnow() - timedelta(minutes=delta)


def make_transaction(client_id: str, montant: float, date: datetime, benef: str = None) -> Transaction:
    return Transaction(
        id=str(uuid.uuid4()),
        reference=f"TRX-{uuid.uuid4().hex[:10].upper()}",
        client_id=client_id,
        montant=round(montant, 0),
        devise="XOF",
        type_operation=random.choice(TYPES_OP),
        canal=random.choice(CANAUX),
        beneficiaire_nom=benef or rand_benef(),
        description="Transaction courante",
        date_transaction=date,
    )


def seed_normal_client(db, client: Client) -> int:
    """Client régulier : 20-45 transactions, montants modestes 50k-450k FCFA"""
    txs = []
    base = random.uniform(80_000, 350_000)
    nb = random.randint(20, 45)
    # 1 ou 2 bénéficiaires récurrents
    benefs_habituels = [rand_benef() for _ in range(random.randint(1, 3))]

    for _ in range(nb):
        montant = base * random.uniform(0.6, 1.4)
        date = rand_date(90)
        benef = random.choice(benefs_habituels) if random.random() < 0.7 else rand_benef()
        txs.append(make_transaction(client.id, montant, date, benef))

    db.bulk_save_objects(txs)
    return len(txs)


def seed_moderate_client(db, client: Client) -> int:
    """Client avec pic d'activité : 35-60 transactions, montants 200k-800k FCFA"""
    txs = []
    base = random.uniform(200_000, 500_000)
    nb = random.randint(35, 60)
    benefs_habituels = [rand_benef() for _ in range(random.randint(2, 5))]

    for i in range(nb):
        # Pic sur les 7 derniers jours
        if i < 12:
            montant = base * random.uniform(1.5, 2.5)
            date = rand_date(7)
        else:
            montant = base * random.uniform(0.8, 1.3)
            date = rand_date(90)
        benef = random.choice(benefs_habituels) if random.random() < 0.5 else rand_benef()
        txs.append(make_transaction(client.id, montant, date, benef))

    db.bulk_save_objects(txs)
    return len(txs)


def seed_suspect_client(db, client: Client) -> int:
    """Client suspect : fractionnement, multi-bénéficiaires, pics massifs"""
    txs = []
    base = random.uniform(150_000, 300_000)
    SEUIL = 1_000_000

    # 1. Transactions normales historiques (60-90j)
    for _ in range(random.randint(10, 20)):
        montant = base * random.uniform(0.7, 1.2)
        date = rand_date(90) 
        # forcer date > 7j
        if date > datetime.utcnow() - timedelta(days=7):
            date = datetime.utcnow() - timedelta(days=random.randint(8, 85))
        txs.append(make_transaction(client.id, montant, date))

    # 2. FRACTIONNEMENT : 4-8 transactions entre 500k et 999k en 48h
    nb_struct = random.randint(4, 8)
    base_frac_date = datetime.utcnow() - timedelta(hours=random.randint(6, 40))
    for i in range(nb_struct):
        montant = random.uniform(500_000, 999_000)
        date = base_frac_date - timedelta(hours=i * random.uniform(1, 5))
        benef = rand_benef()  # bénéficiaires différents
        txs.append(make_transaction(client.id, montant, date, benef))

    # 3. Virement large proche du seuil
    txs.append(make_transaction(
        client.id,
        random.uniform(920_000, 995_000),
        datetime.utcnow() - timedelta(hours=random.randint(2, 20)),
        rand_benef()
    ))

    # 4. Transactions récentes 7j avec volume élevé (pic x4)
    for _ in range(random.randint(6, 12)):
        montant = base * random.uniform(3.5, 6.0)
        date = rand_date(7)
        txs.append(make_transaction(client.id, montant, date, rand_benef()))

    db.bulk_save_objects(txs)
    return len(txs)


def main():
    db = SessionLocal()
    try:
        clients = db.query(Client).all()
        if not clients:
            print("[INFO] Aucun client trouve en base. Lancez d'abord le serveur pour initialiser le seed initial.")
            return

        print(f"[INFO] {len(clients)} clients trouves. Debut du seed de transactions...\n")

        total_created = 0
        skipped = 0

        for client in clients:
            # Vérifier si le client a déjà beaucoup de transactions (éviter doublon)
            existing_count = db.query(Transaction).filter(
                Transaction.client_id == client.id
            ).count()

            if existing_count >= 20:
                skipped += 1
                continue

            niveau = client.niveau_risque or "Faible"
            risk_score = client.risk_score or 0

            # Sélection du profil selon le niveau de risque
            if niveau == "Élevé" or risk_score >= 70:
                nb = seed_suspect_client(db, client)
                profil = "[SUSPECT]"
            elif niveau == "Moyen" or risk_score >= 40:
                nb = seed_moderate_client(db, client)
                profil = "[MODERE]"
            else:
                nb = seed_normal_client(db, client)
                profil = "[NORMAL]"

            db.commit()
            total_created += nb
            print(f"  {profil} | {client.nom} ({client.code_client}) -> +{nb} transactions")

        print(f"\n[OK] Seed termine : {total_created} transactions creees, {skipped} clients deja peuples.")
        print("\n[STATS] Recapitulatif par niveau de risque :")
        for niveau in ["Élevé", "Moyen", "Faible"]:
            nb_clients = db.query(Client).filter(Client.niveau_risque == niveau).count()
            print(f"  * {niveau} : {nb_clients} clients")

    except Exception as e:
        db.rollback()
        print(f"[ERREUR] : {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
