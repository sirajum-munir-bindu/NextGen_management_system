import io
import csv
from datetime import date, timedelta, datetime
from typing import Optional, List
from uuid import UUID

from fastapi import APIRouter, Depends, Query, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy import func, desc, and_
from sqlalchemy.orm import Session
import openpyxl
from openpyxl.styles import Font

from app.database import get_db
from app.models import Employee, DailyPlan, DailyReport, Productivity
from app.schemas import DashboardStats, TopPerformerDetail, EmployeeProductivityDetail

# PDF imports
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

router = APIRouter(prefix="/analytics", tags=["Analytics & Reports"])

@router.get("/dashboard", response_model=DashboardStats)
def get_dashboard_stats(
    selected_date: Optional[date] = Query(None),
    db: Session = Depends(get_db)
):
    if not selected_date:
        selected_date = date.today()
        
    total_employees = db.query(func.count(Employee.id)).scalar() or 0
    
    # Get stats for the selected date
    stats = db.query(
        func.sum(Productivity.planned_count).label("planned"),
        func.sum(Productivity.completed_count).label("completed"),
        func.sum(Productivity.pending_count).label("pending"),
        func.avg(Productivity.completion_percentage).label("avg_prod")
    ).filter(Productivity.date == selected_date).first()
    
    # Fallback to historical average if no data for selected_date
    if not stats or stats.planned is None:
        historical_stats = db.query(
            func.sum(Productivity.planned_count).label("planned"),
            func.sum(Productivity.completed_count).label("completed"),
            func.sum(Productivity.pending_count).label("pending"),
            func.avg(Productivity.completion_percentage).label("avg_prod")
        ).first()
        
        if historical_stats and historical_stats.planned is not None:
            stats = historical_stats
        else:
            return {
                "total_employees": total_employees,
                "total_tasks": 0,
                "completed_tasks": 0,
                "pending_tasks": 0,
                "average_productivity": 0.0
            }
            
    return {
        "total_employees": total_employees,
        "total_tasks": int(stats.planned or 0),
        "completed_tasks": int(stats.completed or 0),
        "pending_tasks": int(stats.pending or 0),
        "average_productivity": round(float(stats.avg_prod or 0.0), 1)
    }

@router.get("/performers")
def get_top_performers(db: Session = Depends(get_db)):
    """
    Find daily, weekly, and monthly top performers.
    We look for the employee with the highest average completion_percentage in those periods.
    """
    today = date.today()
    
    # Helper to get top performer in a date range
    def query_top_performer(start_dt: date, end_dt: date):
        result = db.query(
            Employee.id,
            Employee.name,
            Employee.department,
            func.avg(Productivity.completion_percentage).label("avg_completion")
        ).join(Productivity, Employee.id == Productivity.employee_id)\
         .filter(and_(Productivity.date >= start_dt, Productivity.date <= end_dt))\
         .group_by(Employee.id)\
         .order_by(desc("avg_completion"), desc(func.sum(Productivity.completed_count)))\
         .first()
         
        if result:
            return {
                "id": str(result.id),
                "name": result.name,
                "department": result.department,
                "rating": round(result.avg_completion, 1)
            }
        return None

    # Daily Top Performer (Checks today, if none checks latest date available)
    daily = query_top_performer(today, today)
    if not daily:
        # Fallback to latest available date
        latest_date_entry = db.query(func.max(Productivity.date)).scalar()
        if latest_date_entry:
            daily = query_top_performer(latest_date_entry, latest_date_entry)
            
    # Weekly Top Performer (Last 7 days)
    weekly = query_top_performer(today - timedelta(days=7), today)
    
    # Monthly Top Performer (Last 30 days)
    monthly = query_top_performer(today - timedelta(days=30), today)
    
    return {
        "daily": daily,
        "weekly": weekly,
        "monthly": monthly
    }

@router.get("/charts/productivity-by-employee")
def chart_employee_productivity(db: Session = Depends(get_db)):
    """
    Returns average productivity score per employee (up to last 30 days).
    """
    end_date = date.today()
    start_date = end_date - timedelta(days=30)
    
    results = db.query(
        Employee.name,
        func.avg(Productivity.completion_percentage).label("avg_completion")
    ).join(Productivity, Employee.id == Productivity.employee_id)\
     .filter(and_(Productivity.date >= start_date, Productivity.date <= end_date))\
     .group_by(Employee.id, Employee.name)\
     .order_by(desc("avg_completion"))\
     .limit(10)\
     .all()
     
    return [{"name": r.name, "productivity": round(r.avg_completion, 1)} for r in results]

@router.get("/charts/daily-performance")
def chart_daily_performance(db: Session = Depends(get_db)):
    """
    Returns daily overall average productivity for the last 15 days.
    """
    end_date = date.today()
    start_date = end_date - timedelta(days=15)
    
    results = db.query(
        Productivity.date,
        func.avg(Productivity.completion_percentage).label("avg_completion")
    ).filter(and_(Productivity.date >= start_date, Productivity.date <= end_date))\
     .group_by(Productivity.date)\
     .order_by(Productivity.date)\
     .all()
     
    return [{"date": r.date.strftime("%Y-%m-%d"), "productivity": round(r.avg_completion, 1)} for r in results]

@router.get("/charts/weekly-trend")
def chart_weekly_trend(db: Session = Depends(get_db)):
    """
    Returns average completion percentage grouped by week for the last 8 weeks.
    Grouped using pure Python.
    """
    end_date = date.today()
    start_date = end_date - timedelta(weeks=8)
    
    records = db.query(Productivity.date, Productivity.completion_percentage)\
                .filter(and_(Productivity.date >= start_date, Productivity.date <= end_date))\
                .all()
                
    if not records:
        return []
        
    weeks = {}
    for r in records:
        # Find start of the week (Monday)
        w_start = r.date - timedelta(days=r.date.weekday())
        if w_start not in weeks:
            weeks[w_start] = []
        weeks[w_start].append(r.completion_percentage)
        
    weekly_data = []
    for w_start in sorted(weeks.keys()):
        avg = sum(weeks[w_start]) / len(weeks[w_start])
        weekly_data.append({
            "week": f"Week of {w_start.strftime('%b %d')}",
            "productivity": round(avg, 1)
        })
        
    return weekly_data

@router.get("/charts/monthly-trend")
def chart_monthly_trend(db: Session = Depends(get_db)):
    """
    Returns average productivity grouped by month for the last 6 months.
    Grouped using pure Python.
    """
    end_date = date.today()
    start_date = end_date - timedelta(days=180)
    
    records = db.query(Productivity.date, Productivity.completion_percentage)\
                .filter(and_(Productivity.date >= start_date, Productivity.date <= end_date))\
                .all()
                
    if not records:
        return []
        
    months = {}
    for r in records:
        month_key = (r.date.year, r.date.month)
        if month_key not in months:
            months[month_key] = []
        months[month_key].append(r.completion_percentage)
        
    monthly_data = []
    for m_key in sorted(months.keys()):
        avg = sum(months[m_key]) / len(months[m_key])
        m_date = date(m_key[0], m_key[1], 1)
        monthly_data.append({
            "month": m_date.strftime("%B %Y"),
            "productivity": round(avg, 1)
        })
        
    return monthly_data

@router.get("/reports/list", response_model=List[EmployeeProductivityDetail])
def get_productivity_reports(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    employee_id: Optional[UUID] = Query(None),
    department: Optional[str] = Query(None),
    rating: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(
        Employee.id.label("employee_id"),
        Employee.name.label("employee_name"),
        Employee.department.label("department"),
        Employee.designation.label("designation"),
        Productivity.date.label("date"),
        Productivity.completion_percentage.label("completion_percentage"),
        Productivity.performance_rating.label("performance_rating")
    ).join(Productivity, Employee.id == Productivity.employee_id)
    
    if start_date:
        query = query.filter(Productivity.date >= start_date)
    if end_date:
        query = query.filter(Productivity.date <= end_date)
    if employee_id:
        query = query.filter(Employee.id == employee_id)
    if department:
        query = query.filter(Employee.department.ilike(f"%{department}%"))
    if rating:
        query = query.filter(Productivity.performance_rating == rating)
        
    results = query.order_by(desc(Productivity.date), Employee.name).all()
    
    detailed_reports = []
    for r in results:
        plan = db.query(DailyPlan).filter(DailyPlan.employee_id == r.employee_id, DailyPlan.date == r.date).first()
        report = db.query(DailyReport).filter(DailyReport.employee_id == r.employee_id, DailyReport.date == r.date).first()
        
        detailed_reports.append({
            "employee_id": r.employee_id,
            "employee_name": r.employee_name,
            "department": r.department,
            "designation": r.designation,
            "date": r.date,
            "planned_tasks": plan.planned_tasks if plan else [],
            "completed_tasks": report.completed_tasks if report else [],
            "pending_tasks": report.pending_tasks if report else [],
            "completion_percentage": round(r.completion_percentage, 1),
            "performance_rating": r.performance_rating,
            "remarks": report.remarks if report else None
        })
        
    return detailed_reports

@router.get("/reports/export")
def export_productivity_reports(
    format: str = Query("csv", regex="^(csv|excel|pdf)$"),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    employee_id: Optional[UUID] = Query(None),
    department: Optional[str] = Query(None),
    rating: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    # Fetch report list
    reports = get_productivity_reports(
        start_date=start_date, end_date=end_date, 
        employee_id=employee_id, department=department, 
        rating=rating, db=db
    )
    
    # Flatten structure for dataframes/tables
    flat_data = []
    for r in reports:
        flat_data.append({
            "Date": r["date"].strftime("%Y-%m-%d"),
            "Employee Name": r["employee_name"],
            "Department": r["department"],
            "Designation": r["designation"],
            "Planned Count": len(r["planned_tasks"]),
            "Completed Count": len(r["completed_tasks"]),
            "Pending Count": len(r["pending_tasks"]),
            "Completion %": f"{r['completion_percentage']}%",
            "Rating": r["performance_rating"],
            "Planned Tasks": "; ".join(r["planned_tasks"]),
            "Completed Tasks": "; ".join(r["completed_tasks"]),
            "Pending Tasks": "; ".join(r["pending_tasks"]),
            "Remarks": r["remarks"] or ""
        })
        
    filename_prefix = f"productivity_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

    if format == "csv":
        output = io.StringIO()
        headers = [
            "Date", "Employee Name", "Department", "Designation",
            "Planned Count", "Completed Count", "Pending Count",
            "Completion %", "Rating", "Planned Tasks", "Completed Tasks",
            "Pending Tasks", "Remarks"
        ]
        writer = csv.DictWriter(output, fieldnames=headers)
        writer.writeheader()
        for r in flat_data:
            writer.writerow(r)
            
        response = StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename_prefix}.csv"}
        )
        return response
        
    elif format == "excel":
        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = "Productivity Report"
        
        headers = [
            "Date", "Employee Name", "Department", "Designation",
            "Planned Count", "Completed Count", "Pending Count",
            "Completion %", "Rating", "Planned Tasks", "Completed Tasks",
            "Pending Tasks", "Remarks"
        ]
        ws.append(headers)
        
        # Style headers
        for col_idx in range(1, len(headers) + 1):
            cell = ws.cell(row=1, column=col_idx)
            cell.font = Font(bold=True)
            
        for r in flat_data:
            ws.append([
                r["Date"], r["Employee Name"], r["Department"], r["Designation"],
                r["Planned Count"], r["Completed Count"], r["Pending Count"],
                r["Completion %"], r["Rating"], r["Planned Tasks"], r["Completed Tasks"],
                r["Pending Tasks"], r["Remarks"]
            ])
            
        output = io.BytesIO()
        wb.save(output)
        output.seek(0)
        
        response = StreamingResponse(
            output,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename={filename_prefix}.xlsx"}
        )
        return response
        
    elif format == "pdf":
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer, 
            pagesize=letter, 
            rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36
        )
        styles = getSampleStyleSheet()
        
        # Custom styles
        title_style = ParagraphStyle(
            'PDFTitle',
            parent=styles['Heading1'],
            fontSize=18,
            textColor=colors.HexColor('#1E293B'), # Dark Blue
            spaceAfter=15
        )
        subtitle_style = ParagraphStyle(
            'PDFSubTitle',
            parent=styles['Normal'],
            fontSize=10,
            textColor=colors.HexColor('#64748B'), # Slate Gray
            spaceAfter=15
        )
        table_cell_style = ParagraphStyle(
            'TableCell',
            parent=styles['Normal'],
            fontSize=7,
            textColor=colors.HexColor('#334155')
        )
        table_header_style = ParagraphStyle(
            'TableHeader',
            parent=styles['Normal'],
            fontSize=8,
            textColor=colors.white,
            fontName='Helvetica-Bold'
        )

        elements = []
        elements.append(Paragraph("Team Work Tracker & Productivity Report", title_style))
        elements.append(Paragraph(f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", subtitle_style))
        elements.append(Spacer(1, 10))
        
        # Build table columns
        # To fit letter portrait, we only select key columns
        pdf_headers = ["Date", "Name", "Department", "Planned", "Completed", "Pending", "Comp %", "Rating"]
        data = [[Paragraph(h, table_header_style) for h in pdf_headers]]
        
        for r in flat_data:
            row = [
                Paragraph(r["Date"], table_cell_style),
                Paragraph(r["Employee Name"], table_cell_style),
                Paragraph(r["Department"], table_cell_style),
                Paragraph(str(r["Planned Count"]), table_cell_style),
                Paragraph(str(r["Completed Count"]), table_cell_style),
                Paragraph(str(r["Pending Count"]), table_cell_style),
                Paragraph(r["Completion %"], table_cell_style),
                Paragraph(r["Rating"], table_cell_style),
            ]
            data.append(row)
            
        # Column widths summing up to 540
        col_widths = [60, 90, 90, 50, 50, 50, 50, 100]
        table = Table(data, colWidths=col_widths, repeatRows=1)
        
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1E3A8A')), # Dark blue
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 6),
            ('TOPPADDING', (0, 0), (-1, 0), 6),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F8FAFC')]), # Zebra striping
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
            ('BOTTOMPADDING', (0, 1), (-1, -1), 5),
            ('TOPPADDING', (0, 1), (-1, -1), 5),
        ]))
        
        elements.append(table)
        doc.build(elements)
        
        buffer.seek(0)
        response = StreamingResponse(
            buffer,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={filename_prefix}.pdf"}
        )
        return response
