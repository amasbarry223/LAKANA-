import hashlib
import os
from datetime import datetime, timedelta, timezone
from typing import Any, Optional, Union
from jose import jwt
from app.core.config import settings

try:
    from passlib.context import CryptContext
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    # Test if bcrypt backend is actually available
    pwd_context.hash("test")
    HAS_BCRYPT = True
except Exception:
    HAS_BCRYPT = False


def verify_password(plain_password: str, hashed_password: str) -> bool:
    if HAS_BCRYPT:
        try:
            return pwd_context.verify(plain_password, hashed_password)
        except Exception:
            pass
    
    # Fallback SHA256 avec sel ou comparaison directe
    if hashed_password.startswith("sha256$"):
        parts = hashed_password.split("$")
        if len(parts) == 3:
            salt, stored_hash = parts[1], parts[2]
            computed = hashlib.sha256((salt + plain_password).encode("utf-8")).hexdigest()
            return computed == stored_hash
    return plain_password == hashed_password


def get_password_hash(password: str) -> str:
    if HAS_BCRYPT:
        try:
            return pwd_context.hash(password)
        except Exception:
            pass

    # Fallback SHA256 avec sel sécurisé
    salt = os.urandom(8).hex()
    computed = hashlib.sha256((salt + password).encode("utf-8")).hexdigest()
    return f"sha256${salt}${computed}"


def create_access_token(subject: Union[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

