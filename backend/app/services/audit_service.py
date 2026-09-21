from typing import Optional
from sqlalchemy.orm import Session
from app.models.audit_log import AuditLog


class AuditService:
    """Service d'audit réglementaire pour assurer la traçabilité complète des actions."""

    def log_action(
        self,
        db: Session,
        utilisateur: str,
        role: str,
        action: str,
        module: str,
        cible: Optional[str] = None,
        details: Optional[str] = None,
        ip_address: Optional[str] = "127.0.0.1",
    ) -> AuditLog:
        log_entry = AuditLog(
            utilisateur=utilisateur,
            role=role,
            action=action,
            module=module,
            cible=cible,
            details=details,
            ip_address=ip_address or "127.0.0.1",
        )
        db.add(log_entry)
        db.commit()
        db.refresh(log_entry)
        return log_entry


audit_service = AuditService()
