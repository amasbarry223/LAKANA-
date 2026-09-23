from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User
from app.schemas.user import UserOut, UserCreate, UserUpdate
from app.core.security import get_password_hash

router = APIRouter()


@router.get("", response_model=List[UserOut])
@router.get("/", response_model=List[UserOut])
def list_users(
    q: Optional[str] = None,
    role: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """Liste tous les utilisateurs enregistrés dans LAKANA."""
    query = db.query(User)
    if q:
        query = query.filter(
            (User.nom_complet.ilike(f"%{q}%"))
            | (User.email.ilike(f"%{q}%"))
            | (User.telephone.ilike(f"%{q}%"))
            | (User.institution.ilike(f"%{q}%"))
        )
    if role:
        query = query.filter(User.role.ilike(f"%{role}%"))
    return query.order_by(User.created_at.desc()).all()


@router.get("/compliance-officers", response_model=List[UserOut])
def list_compliance_officers(db: Session = Depends(get_db)):
    """Retourne la liste des agents et analystes de conformité actifs avec leurs coordonnées."""
    return (
        db.query(User)
        .filter(
            User.role.ilike("%conformité%"),
            User.is_active == True,
        )
        .all()
    )


@router.post("", response_model=UserOut, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def create_user(user_in: UserCreate, db: Session = Depends(get_db)):
    """Création d'un nouvel utilisateur (Analyste de conformité ou Agent guichet)."""
    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail="Un utilisateur avec cette adresse email existe déjà.",
        )

    new_user = User(
        nom_complet=user_in.nom_complet.strip(),
        email=user_in.email.strip().lower(),
        telephone=user_in.telephone.strip() if user_in.telephone else None,
        role=user_in.role,
        institution=user_in.institution,
        mfa_enabled=user_in.mfa_enabled,
        is_active=user_in.is_active,
        hashed_password=get_password_hash(user_in.password or "password123"),
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@router.put("/{user_id}", response_model=UserOut)
def update_user(user_id: str, user_in: UserUpdate, db: Session = Depends(get_db)):
    """Mise à jour des informations d'un utilisateur (nom, email, téléphone, rôle, statut)."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable.")

    if user_in.email and user_in.email != user.email:
        duplicate = db.query(User).filter(User.email == user_in.email).first()
        if duplicate:
            raise HTTPException(status_code=400, detail="Cette adresse email est déjà utilisée.")
        user.email = user_in.email.strip().lower()

    if user_in.nom_complet is not None:
        user.nom_complet = user_in.nom_complet.strip()
    if user_in.telephone is not None:
        user.telephone = user_in.telephone.strip() if user_in.telephone else None
    if user_in.role is not None:
        user.role = user_in.role
    if user_in.institution is not None:
        user.institution = user_in.institution.strip()
    if user_in.mfa_enabled is not None:
        user.mfa_enabled = user_in.mfa_enabled
    if user_in.is_active is not None:
        user.is_active = user_in.is_active
    if user_in.password:
        user.hashed_password = get_password_hash(user_in.password)

    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.delete("/{user_id}")
def toggle_user_active(user_id: str, db: Session = Depends(get_db)):
    """Active ou désactive l'accès d'un utilisateur."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable.")

    user.is_active = not user.is_active
    db.add(user)
    db.commit()
    db.refresh(user)
    statut = "activé" if user.is_active else "suspendu"
    return {"success": True, "is_active": user.is_active, "message": f"Compte de {user.nom_complet} {statut}."}
