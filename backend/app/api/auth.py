from fastapi import Header, HTTPException, Depends
import jwt
from typing import Optional
from app.models.domain import User
from app.db.database import get_db
from sqlalchemy.orm import Session

JWT_SECRET = "cybercash-sentinel-demo-secret-key"

def get_current_user(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        user = db.query(User).filter(User.id == payload.get("user_id")).first()
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

def require_role(required_roles: list):
    def role_checker(user: User = Depends(get_current_user)):
        if user.role not in required_roles and user.role != "ADMIN":
            raise HTTPException(status_code=403, detail="Not enough permissions")
        return user
    return role_checker
