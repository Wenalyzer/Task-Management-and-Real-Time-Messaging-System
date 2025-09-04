from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional
from datetime import datetime
import re


class UserBase(BaseModel):
    email: EmailStr


class UserCreate(UserBase):
    password: str = Field(..., min_length=6, description="至少6字元，需包含數字和字母")
    
    @field_validator('email')
    @classmethod
    def validate_email_account(cls, v):
        if '@' not in v:
            raise ValueError('請輸入正確的電子郵件，例如：user@gmail.com')
        domain = v.split('@', 1)[1]
        if '.' not in domain:
            raise ValueError('請輸入正確的電子郵件，例如：user@gmail.com')
        return v
    
    @field_validator('password')
    @classmethod
    def validate_password(cls, v):
        if len(v) < 6:
            raise ValueError('密碼至少6字元')
        
        if not re.search(r'\d', v):
            raise ValueError('密碼需包含數字')
            
        if not re.search(r'[a-zA-Z]', v):
            raise ValueError('密碼需包含字母')
            
        return v
    

class UserLogin(BaseModel):
    email: EmailStr
    password: str


class User(UserBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str
    expires_in: Optional[int] = None


class TokenData(BaseModel):
    email: Optional[str] = None