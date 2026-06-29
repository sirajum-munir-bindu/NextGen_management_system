from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import EmployeeCreate, EmployeeUpdate, EmployeeResponse
from app.crud import get_employees, get_employee, get_employee_by_email, create_employee, update_employee, delete_employee
from app.auth import get_current_admin
from app.models import Admin

router = APIRouter(prefix="/employees", tags=["Employees"])

@router.get("", response_model=List[EmployeeResponse])
def read_employees(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return get_employees(db, skip=skip, limit=limit)

@router.get("/{employee_id}", response_model=EmployeeResponse)
def read_employee(employee_id: UUID, db: Session = Depends(get_db)):
    db_employee = get_employee(db, employee_id)
    if not db_employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    return db_employee

@router.post("", response_model=EmployeeResponse, status_code=status.HTTP_201_CREATED)
def add_employee(
    employee: EmployeeCreate, 
    db: Session = Depends(get_db), 
    current_admin: Admin = Depends(get_current_admin)
):
    db_employee = get_employee_by_email(db, employee.email)
    if db_employee:
        raise HTTPException(status_code=400, detail="Email already registered")
    return create_employee(db, employee)

@router.put("/{employee_id}", response_model=EmployeeResponse)
def edit_employee(
    employee_id: UUID, 
    employee_update: EmployeeUpdate, 
    db: Session = Depends(get_db), 
    current_admin: Admin = Depends(get_current_admin)
):
    db_employee = update_employee(db, employee_id, employee_update)
    if not db_employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    return db_employee

@router.delete("/{employee_id}")
def remove_employee(
    employee_id: UUID, 
    db: Session = Depends(get_db), 
    current_admin: Admin = Depends(get_current_admin)
):
    success = delete_employee(db, employee_id)
    if not success:
        raise HTTPException(status_code=404, detail="Employee not found")
    return {"message": "Employee deleted successfully"}
