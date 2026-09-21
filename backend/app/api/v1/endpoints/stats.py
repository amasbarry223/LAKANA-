from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.session import get_db
from app.models.client import Client
from app.models.alert import Alert
from app.models.investigation import Investigation
from app.models.transaction import Transaction

router = APIRouter()


@router.get("/overview")
def get_dashboard_overview(db: Session = Depends(get_db)):
    total_clients = db.query(Client).count()
    alertes_actives = db.query(Alert).filter(Alert.statut.in_(["nouvelle", "en_cours"])).count()
    alertes_bloquantes = db.query(Alert).filter(Alert.niveau == "bloquante").count()
    investigations_en_cours = db.query(Investigation).filter(Investigation.status == "en_cours").count()
    
    score_moyen = db.query(func.avg(Client.risk_score)).scalar() or 0.0

    return {
        "stats": {
            "clients_filtres": f"{total_clients:,}".replace(",", " "),
            "alertes_actives": alertes_actives,
            "alertes_bloquantes": alertes_bloquantes,
            "investigations_en_cours": investigations_en_cours,
            "score_moyen": f"{int(score_moyen)}/100",
        },
        "modules": [
            {"nom": "Filtrage sanctions/PPE", "code": "FLT", "count": db.query(Alert).filter(Alert.module.ilike("%sanction%")).count()},
            {"nom": "Détection comportementale", "code": "CMP", "count": db.query(Alert).filter(Alert.module.ilike("%comportement%")).count()},
            {"nom": "Fractionnement", "code": "FRC", "count": db.query(Alert).filter(Alert.module.ilike("%fractionnement%")).count()},
            {"nom": "Risk Score recalculé", "code": "SCR", "count": db.query(Alert).filter(Alert.module.ilike("%risk%")).count()},
        ],
        "statut_systeme": "Opérationnel",
    }
