# backend/schemas.py
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr

class FolderBase(BaseModel):
    name: str
    description: Optional[str] = None

class FolderCreate(FolderBase):
    pass

class Folder(FolderBase):
    id: int

    class Config:
        orm_mode = True

class EmailBase(BaseModel):
    subject: str
    body: str
    to_address: EmailStr
    from_address: EmailStr
    folder_id: Optional[int] = None

class EmailCreate(EmailBase):
    is_draft: bool = True

class Email(EmailBase):
    id: int
    is_draft: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

class ScheduledEmailBase(BaseModel):
    email_id: int
    scheduled_for: datetime

class ScheduledEmailCreate(ScheduledEmailBase):
    pass

class ScheduledEmail(ScheduledEmailBase):
    id: int
    status: str

    class Config:
        orm_mode = True