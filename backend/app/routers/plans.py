from datetime import date
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import DailyPlanCreate, DailyPlanResponse
from app.crud import get_daily_plan, create_or_update_daily_plan, get_employee
from app.auth import get_current_admin
from app.models import Admin

router = APIRouter(prefix="/plans", tags=["Daily Plans"])

@router.get("/{employee_id}/{task_date}", response_model=DailyPlanResponse)
def read_daily_plan(employee_id: UUID, task_date: date, db: Session = Depends(get_db)):
    plan = get_daily_plan(db, employee_id, task_date)
    if not plan:
        raise HTTPException(status_code=404, detail="Daily plan not found")
    return plan

@router.post("", response_model=DailyPlanResponse)
def upload_daily_plan(
    plan_in: DailyPlanCreate, 
    db: Session = Depends(get_db), 
    current_admin: Admin = Depends(get_current_admin)
):
    # Verify employee exists
    employee = get_employee(db, plan_in.employee_id)
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
        
    return create_or_update_daily_plan(db, plan_in)
