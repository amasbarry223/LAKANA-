from typing import List, Optional, Dict, Any
from pydantic import BaseModel


class GraphNode(BaseModel):
    id: str
    label: str
    type: str  # client, compte, beneficiaire, alerte
    x: Optional[float] = None
    y: Optional[float] = None
    alert: Optional[bool] = False
    details: Optional[Dict[str, Any]] = None


class GraphEdge(BaseModel):
    from_node: str
    to_node: str
    label: Optional[str] = None
    strong: Optional[bool] = False


class FinancialGraphOut(BaseModel):
    client_id: str
    client_nom: str
    noeuds: List[GraphNode]
    liens: List[GraphEdge]
    total_flux_detectes: float
