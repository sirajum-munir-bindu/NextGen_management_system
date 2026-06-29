from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import LoginRequest, Token
from app.crud import get_admin_by_username
from app.auth import verify_password, create_access_token

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=Token)
def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    admin = get_admin_by_username(db, login_data.username)
    if not admin or not verify_password(login_data.password, admin.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(data={"sub": admin.username})
    return {"access_token": access_token, "token_type": "bearer"}
