from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from sqlalchemy import exc
from datetime import timedelta
from pydantic import BaseModel

from ..core.database import get_db
from ..core.security import verify_password, get_password_hash, create_access_token, create_refresh_token, verify_token
from ..core.config import settings
from ..models import User
from ..schemas import UserCreate, UserLogin, User as UserSchema, Token

router = APIRouter()
security = HTTPBearer()


def get_user_by_email(db: Session, email: str):
    """根據 email 取得使用者"""
    return db.query(User).filter(User.email == email).first()


def create_user(db: Session, user: UserCreate):
    """建立新使用者"""
    hashed_password = get_password_hash(user.password)
    db_user = User(
        email=user.email,
        password_hash=hashed_password
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def authenticate_user(db: Session, email: str, password: str):
    """驗證使用者"""
    user = get_user_by_email(db, email)
    if not user:
        return False
    if not verify_password(password, user.password_hash):
        return False
    return user


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """取得當前使用者"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="無法驗證身份資訊",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = verify_token(credentials.credentials)
        if payload is None:
            raise credentials_exception
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except Exception:
        raise credentials_exception
    
    user = get_user_by_email(db, email=email)
    if user is None:
        raise credentials_exception
    return user


def get_current_user_from_websocket(token: str, db: Session):
    """從WebSocket token取得當前使用者"""
    try:
        payload = verify_token(token)
        if payload is None:
            return None
        email: str = payload.get("sub")
        if email is None:
            return None
        
        user = get_user_by_email(db, email=email)
        return user
    except Exception:
        return None


@router.post("/register", response_model=UserSchema)
async def register(user: UserCreate, db: Session = Depends(get_db)):
    """使用者註冊"""
    # 檢查 email 是否已存在
    db_user = get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(
            status_code=400,
            detail="Email 已被註冊"
        )
    
    # 建立新使用者
    try:
        return create_user(db=db, user=user)
    except exc.IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="Email 已被註冊"
        )


@router.post("/login", response_model=Token)
async def login(user: UserLogin, db: Session = Depends(get_db)):
    """使用者登入"""
    user_obj = authenticate_user(db, user.email, user.password)
    if not user_obj:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email 或密碼錯誤",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(
        data={"sub": user_obj.email}, expires_delta=access_token_expires
    )
    refresh_token = create_refresh_token(data={"sub": user_obj.email})
    
    return {
        "access_token": access_token, 
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_in": settings.access_token_expire_minutes * 60  # 以秒為單位
    }


class RefreshTokenRequest(BaseModel):
    refresh_token: str

@router.post("/refresh", response_model=Token)
async def refresh_token(
    request: RefreshTokenRequest,
    db: Session = Depends(get_db)
):
    """使用refresh token取得新的access token"""
    try:
        payload = verify_token(request.refresh_token)
        if payload is None or payload.get("token_type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="無效的重新整理令牌",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="無效的重新整理令牌",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # 確認使用者仍然存在
        user = get_user_by_email(db, email=email)
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="找不到使用者",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # 建立新的access token (使用配置設定的時間)
        access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
        access_token = create_access_token(
            data={"sub": user.email}, expires_delta=access_token_expires
        )
        new_refresh_token = create_refresh_token(data={"sub": user.email})
        
        return {
            "access_token": access_token,
            "refresh_token": new_refresh_token,
            "token_type": "bearer",
            "expires_in": settings.access_token_expire_minutes * 60
        }
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="無效的重新整理令牌",
            headers={"WWW-Authenticate": "Bearer"},
        )


@router.get("/me", response_model=UserSchema)
async def read_users_me(current_user: User = Depends(get_current_user)):
    """取得當前使用者資訊"""
    return current_user


@router.get("/websocket-token")
async def get_websocket_token(current_user: User = Depends(get_current_user)):
    """為 WebSocket 連接獲取 token"""
    # 創建一個短期的 WebSocket token (15分鐘)
    access_token_expires = timedelta(minutes=15)
    token = create_access_token(
        data={"sub": current_user.email, "token_type": "access"}, 
        expires_delta=access_token_expires
    )
    
    return {
        "token": token,
        "expires_in": 15 * 60  # 15分鐘，以秒為單位
    }


