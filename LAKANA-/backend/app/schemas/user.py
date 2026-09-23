from typing import Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr, ConfigDict


class UserBase(BaseModel):
    nom_complet: str
    email: EmailStr
    telephone: Optional[str] = None
    role: str = "Analyste de conformité"
    institution: str = "SFD Bamako"
    mfa_enabled: bool = False
    is_active: bool = True


class UserCreate(UserBase):
    password: Optional[str] = "password123"


class UserUpdate(BaseModel):
    nom_complet: Optional[str] = None
    email: Optional[EmailStr] = None
    telephone: Optional[str] = None
    role: Optional[str] = None
    institution: Optional[str] = None
    mfa_enabled: Optional[bool] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None


class UserLogin(BaseModel):
    email: str
    password: str
    role: Optional[str] = None


class UserOut(UserBase):
    id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
