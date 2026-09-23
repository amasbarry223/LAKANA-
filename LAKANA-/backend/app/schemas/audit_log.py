from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class AuditLogBase(BaseModel):
    utilisateur: str
    role: str
    action: str
    module: str
    cible: Optional[str] = None
    details: Optional[str] = None
    ip_address: Optional[str] = "127.0.0.1"


class AuditLogCreate(AuditLogBase):
    pass


class AuditLogOut(AuditLogBase):
    id: str
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)
