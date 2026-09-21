from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.graph import FinancialGraphOut
from app.services.graph_service import graph_service
from app.repositories.client_repo import client_repository

router = APIRouter()


@router.get("/client/{client_id}", response_model=FinancialGraphOut)
def get_client_financial_graph(client_id: str, db: Session = Depends(get_db)):
    client = client_repository.get(db, client_id)
    if not client:
        client = client_repository.get_by_code(db, client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client non trouvé")
    return graph_service.build_client_graph(db, client.id)
