from datetime import date, datetime
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, EmailStr, Field

# Auth schemas
class LoginRequest(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None


# Employee schemas
class EmployeeBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    department: str = Field(..., min_length=1, max_length=100)
    designation: str = Field(..., min_length=1, max_length=100)

class EmployeeCreate(EmployeeBase):
    pass

class EmployeeUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    email: Optional[EmailStr] = None
    department: Optional[str] = Field(None, min_length=1, max_length=100)
    designation: Optional[str] = Field(None, min_length=1, max_length=100)

class EmployeeResponse(EmployeeBase):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True


# Daily Plan schemas
class DailyPlanBase(BaseModel):
    employee_id: UUID
    date: date
    planned_tasks: List[str]

class DailyPlanCreate(DailyPlanBase):
    pass

class DailyPlanUpdate(BaseModel):
    planned_tasks: List[str]

class DailyPlanResponse(DailyPlanBase):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True


# Daily Report schemas
class DailyReportBase(BaseModel):
    employee_id: UUID
    date: date
    completed_tasks: List[str]
    pending_tasks: List[str]
    remarks: Optional[str] = None

class DailyReportCreate(DailyReportBase):
    pass

class DailyReportUpdate(BaseModel):
    completed_tasks: List[str]
    pending_tasks: List[str]
    remarks: Optional[str] = None

class DailyReportResponse(DailyReportBase):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True


# Productivity schemas
class ProductivityResponse(BaseModel):
    id: UUID
    employee_id: UUID
    date: date
    planned_count: int
    completed_count: int
    pending_count: int
    completion_percentage: float
    performance_rating: str
    created_at: datetime

    class Config:
        from_attributes = True


# Aggregated & Analytics schemas
class EmployeeProductivityDetail(BaseModel):
    employee_id: UUID
    employee_name: str
    department: str
    designation: str
    date: date
    planned_tasks: List[str]
    completed_tasks: List[str]
    pending_tasks: List[str]
    completion_percentage: float
    performance_rating: str
    remarks: Optional[str] = None

class DashboardStats(BaseModel):
    total_employees: int
    total_tasks: int
    completed_tasks: int
    pending_tasks: int
    average_productivity: float

class TopPerformerDetail(BaseModel):
    employee_id: UUID
    name: str
    department: str
    average_completion: float
