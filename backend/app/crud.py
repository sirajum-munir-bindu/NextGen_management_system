from datetime import date
from typing import List, Optional
from uuid import UUID
from sqlalchemy.orm import Session
from app.models import Employee, DailyPlan, DailyReport, Productivity, Admin
from app.schemas import EmployeeCreate, EmployeeUpdate, DailyPlanCreate, DailyReportCreate
from app.auth import get_password_hash

# Admin operations
def get_admin_by_username(db: Session, username: str) -> Optional[Admin]:
    return db.query(Admin).filter(Admin.username == username).first()

def create_initial_admin(db: Session, username: str, email: str, password: str) -> Admin:
    hashed_password = get_password_hash(password)
    db_admin = Admin(username=username, email=email, hashed_password=hashed_password)
    db.add(db_admin)
    db.commit()
    db.refresh(db_admin)
    return db_admin

# Employee operations
def get_employee(db: Session, employee_id: UUID) -> Optional[Employee]:
    return db.query(Employee).filter(Employee.id == employee_id).first()

def get_employee_by_email(db: Session, email: str) -> Optional[Employee]:
    return db.query(Employee).filter(Employee.email == email).first()

def get_employees(db: Session, skip: int = 0, limit: int = 100) -> List[Employee]:
    return db.query(Employee).offset(skip).limit(limit).all()

def create_employee(db: Session, employee: EmployeeCreate) -> Employee:
    db_employee = Employee(
        name=employee.name,
        email=employee.email,
        department=employee.department,
        designation=employee.designation
    )
    db.add(db_employee)
    db.commit()
    db.refresh(db_employee)
    return db_employee

def update_employee(db: Session, employee_id: UUID, employee_update: EmployeeUpdate) -> Optional[Employee]:
    db_employee = get_employee(db, employee_id)
    if not db_employee:
        return None
    
    update_data = employee_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_employee, key, value)
        
    db.commit()
    db.refresh(db_employee)
    return db_employee

def delete_employee(db: Session, employee_id: UUID) -> bool:
    db_employee = get_employee(db, employee_id)
    if not db_employee:
        return False
    db.delete(db_employee)
    db.commit()
    return True


# Productivity Calculator
def recalculate_productivity(db: Session, employee_id: UUID, task_date: date) -> Optional[Productivity]:
    plan = db.query(DailyPlan).filter(
        DailyPlan.employee_id == employee_id,
        DailyPlan.date == task_date
    ).first()
    
    report = db.query(DailyReport).filter(
        DailyReport.employee_id == employee_id,
        DailyReport.date == task_date
    ).first()
    
    if not plan and not report:
        # Delete existing productivity record if any
        prod = db.query(Productivity).filter(
            Productivity.employee_id == employee_id,
            Productivity.date == task_date
        ).first()
        if prod:
            db.delete(prod)
            db.commit()
        return None
        
    # Calculate parameters
    planned_tasks = plan.planned_tasks if plan else []
    completed_tasks = report.completed_tasks if report else []
    pending_tasks = report.pending_tasks if report else []
    
    if plan and not report:
        # If morning plan exists but no report, completed = 0, pending = planned
        planned_count = len(planned_tasks)
        completed_count = 0
        pending_count = planned_count
    elif report and not plan:
        # If report exists but no plan
        completed_count = len(completed_tasks)
        pending_count = len(pending_tasks)
        planned_count = completed_count + pending_count
    else:
        # Both exist
        planned_count = len(planned_tasks)
        completed_count = len(completed_tasks)
        pending_count = len(pending_tasks)
        # Fallback in case they completed more tasks or report lists more items
        if planned_count == 0:
            planned_count = completed_count + pending_count
            
    # Completion Percentage
    if planned_count > 0:
        completion_percentage = (completed_count / planned_count) * 100.0
    else:
        completion_percentage = 0.0
        
    # Cap percentage at 100% (or allow higher? Standard says Cap at 100%)
    if completion_percentage > 100.0:
        completion_percentage = 100.0
        
    # Performance Rating Logic
    # 90-100% = Excellent
    # 75-89% = Good
    # 50-74% = Average
    # Below 50% = Needs Improvement
    if completion_percentage >= 90.0:
        rating = "Excellent"
    elif completion_percentage >= 75.0:
        rating = "Good"
    elif completion_percentage >= 50.0:
        rating = "Average"
    else:
        rating = "Needs Improvement"
        
    prod = db.query(Productivity).filter(
        Productivity.employee_id == employee_id,
        Productivity.date == task_date
    ).first()
    
    if prod:
        prod.planned_count = planned_count
        prod.completed_count = completed_count
        prod.pending_count = pending_count
        prod.completion_percentage = completion_percentage
        prod.performance_rating = rating
    else:
        prod = Productivity(
            employee_id=employee_id,
            date=task_date,
            planned_count=planned_count,
            completed_count=completed_count,
            pending_count=pending_count,
            completion_percentage=completion_percentage,
            performance_rating=rating
        )
        db.add(prod)
        
    db.commit()
    db.refresh(prod)
    return prod


# Daily Plan operations
def get_daily_plan(db: Session, employee_id: UUID, task_date: date) -> Optional[DailyPlan]:
    return db.query(DailyPlan).filter(
        DailyPlan.employee_id == employee_id,
        DailyPlan.date == task_date
    ).first()

def create_or_update_daily_plan(db: Session, plan_in: DailyPlanCreate) -> DailyPlan:
    plan = get_daily_plan(db, plan_in.employee_id, plan_in.date)
    if plan:
        plan.planned_tasks = plan_in.planned_tasks
    else:
        plan = DailyPlan(
            employee_id=plan_in.employee_id,
            date=plan_in.date,
            planned_tasks=plan_in.planned_tasks
        )
        db.add(plan)
        
    db.commit()
    db.refresh(plan)
    
    # Recalculate productivity
    recalculate_productivity(db, plan_in.employee_id, plan_in.date)
    
    return plan


# Daily Report operations
def get_daily_report(db: Session, employee_id: UUID, task_date: date) -> Optional[DailyReport]:
    return db.query(DailyReport).filter(
        DailyReport.employee_id == employee_id,
        DailyReport.date == task_date
    ).first()

def create_or_update_daily_report(db: Session, report_in: DailyReportCreate) -> DailyReport:
    report = get_daily_report(db, report_in.employee_id, report_in.date)
    if report:
        report.completed_tasks = report_in.completed_tasks
        report.pending_tasks = report_in.pending_tasks
        report.remarks = report_in.remarks
    else:
        report = DailyReport(
            employee_id=report_in.employee_id,
            date=report_in.date,
            completed_tasks=report_in.completed_tasks,
            pending_tasks=report_in.pending_tasks,
            remarks=report_in.remarks
        )
        db.add(report)
        
    db.commit()
    db.refresh(report)
    
    # Recalculate productivity
    recalculate_productivity(db, report_in.employee_id, report_in.date)
    
    return report
