from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth,
    clients,
    transactions,
    alerts,
    investigations,
    filtering,
    graph,
    ai,
    audit,
    stats,
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentification & RBAC"])
api_router.include_router(clients.router, prefix="/clients", tags=["Clients & Client 360°"])
api_router.include_router(transactions.router, prefix="/transactions", tags=["Transactions & Ingestion"])
api_router.include_router(alerts.router, prefix="/alerts", tags=["Centre d'alertes"])
api_router.include_router(investigations.router, prefix="/investigations", tags=["Investigations"])
api_router.include_router(filtering.router, prefix="/filtrage", tags=["Filtrage Sanctions & PPE"])
api_router.include_router(graph.router, prefix="/graph", tags=["Graphe de relations"])
api_router.include_router(ai.router, prefix="/assistant-ia", tags=["Assistant IA"])
api_router.include_router(audit.router, prefix="/audit", tags=["Journal d'audit"])
api_router.include_router(stats.router, prefix="/stats", tags=["Statistiques & Tableau de bord"])
