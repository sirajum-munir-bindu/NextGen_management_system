import uuid
from datetime import datetime
from sqlalchemy import Column, String, Date, Integer, Float, ForeignKey, DateTime, Text, JSON, Uuid
from sqlalchemy.orm import relationship

from app.database import Base

class Admin(Base):
    __tablename__ = "admins"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(100), unique=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class Employee(Base):
    __tablename__ = "employees"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False, index=True)
    department = Column(String(100), nullable=False)
    designation = Column(String(100), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    plans = relationship("DailyPlan", back_populates="employee", cascade="all, delete-orphan")
    reports = relationship("DailyReport", back_populates="employee", cascade="all, delete-orphan")
    productivity = relationship("Productivity", back_populates="employee", cascade="all, delete-orphan")


class DailyPlan(Base):
    __tablename__ = "daily_plans"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    employee_id = Column(Uuid, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False)
    date = Column(Date, nullable=False, index=True)
    planned_tasks = Column(JSON, nullable=False) # list of strings
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    employee = relationship("Employee", back_populates="plans")


class DailyReport(Base):
    __tablename__ = "daily_reports"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    employee_id = Column(Uuid, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False)
    date = Column(Date, nullable=False, index=True)
    completed_tasks = Column(JSON, nullable=False) # list of strings
    pending_tasks = Column(JSON, nullable=False) # list of strings
    remarks = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    employee = relationship("Employee", back_populates="reports")


class Productivity(Base):
    __tablename__ = "productivity"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    employee_id = Column(Uuid, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False)
    date = Column(Date, nullable=False, index=True)
    planned_count = Column(Integer, nullable=False)
    completed_count = Column(Integer, nullable=False)
    pending_count = Column(Integer, nullable=False)
    completion_percentage = Column(Float, nullable=False)
    performance_rating = Column(String(50), nullable=False) # e.g. Excellent, Good, Average, Needs Improvement
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    employee = relationship("Employee", back_populates="productivity")
