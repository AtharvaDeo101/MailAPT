# backend/models.py
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from db import Base
from datetime import datetime

class Folder(Base):
    __tablename__ = "folders"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), unique=True, nullable=False)
    description = Column(Text, nullable=True)

    emails = relationship("Email", back_populates="folder")

class Email(Base):
    __tablename__ = "emails"

    id = Column(Integer, primary_key=True, index=True)
    subject = Column(String(255), nullable=False)
    body = Column(Text, nullable=False)
    to_address = Column(String(255), nullable=False)
    from_address = Column(String(255), nullable=False)
    is_draft = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)
    folder_id = Column(Integer, ForeignKey("folders.id"), nullable=True)

    folder = relationship("Folder", back_populates="emails")
    scheduled = relationship("ScheduledEmail", back_populates="email", uselist=False)

class ScheduledEmail(Base):
    __tablename__ = "scheduled_emails"

    id = Column(Integer, primary_key=True, index=True)
    email_id = Column(Integer, ForeignKey("emails.id"), nullable=False)
    scheduled_for = Column(DateTime, nullable=False)
    status = Column(String(50), default="pending")  # pending, sent, failed

    email = relationship("Email", back_populates="scheduled")