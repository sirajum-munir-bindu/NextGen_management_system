from datetime import date
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import DailyReportCreate, DailyReportResponse
from app.crud import get_daily_report, create_or_update_daily_report, get_employee
from app.auth import get_current_admin
from app.models import Admin

router = APIRouter(prefix="/reports", tags=["Daily Reports"])

@router.get("/{employee_id}/{task_date}", response_model=DailyReportResponse)
def read_daily_report(employee_id: UUID, task_date: date, db: Session = Depends(get_db)):
    report = get_daily_report(db, employee_id, task_date)
    if not report:
        raise HTTPException(status_code=404, detail="Daily report not found")
    return report

@router.post("", response_model=DailyReportResponse)
def upload_daily_report(
    report_in: DailyReportCreate, 
    db: Session = Depends(get_db), 
    current_admin: Admin = Depends(get_current_admin)
):
    # Verify employee exists
    employee = get_employee(db, report_in.employee_id)
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
        
    return create_or_update_daily_report(db, report_in)
