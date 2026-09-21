from fastapi import APIRouter
from app.schemas.ai import AIExplainRequest, AIExplainResponse
from app.services.ai_service import ai_service

router = APIRouter()


@router.post("/expliquer", response_model=AIExplainResponse)
def explain_alert_score(req: AIExplainRequest):
    return ai_service.explain_alert(
        client_nom=req.client_nom,
        score=req.risk_score,
        facteurs=req.facteurs,
        client_code=req.client_code,
    )
