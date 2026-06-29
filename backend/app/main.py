from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.config import settings
from app.database import engine, Base, SessionLocal
from app.routers import auth, employees, plans, reports, analytics
from app.crud import get_admin_by_username, create_initial_admin
from app.models import Admin

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="API for tracking team work plans, reports, and generating productivity analytics.",
    version="1.0.0"
)

# CORS Configuration
# In production, specify the exact domain. For this setup we will allow all origins or common development origins.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routers
app.include_router(auth.router, prefix="/api")
app.include_router(employees.router, prefix="/api")
app.include_router(plans.router, prefix="/api")
app.include_router(reports.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")

@app.on_event("startup")
def startup_populate():
    # Automatically create database tables if they do not exist
    Base.metadata.create_all(bind=engine)
    
    # Seed default admin user
    db: Session = SessionLocal()
    try:
        admin_exists = get_admin_by_username(db, settings.ADMIN_USERNAME)
        if not admin_exists:
            print(f"Seeding default admin user: {settings.ADMIN_USERNAME}")
            create_initial_admin(
                db=db,
                username=settings.ADMIN_USERNAME,
                email=settings.ADMIN_EMAIL,
                password=settings.ADMIN_PASSWORD
            )
        else:
            print("Admin user already seeded.")
    except Exception as e:
        print(f"Error during startup seeding: {e}")
    finally:
        db.close()

@app.get("/")
def read_root():
    return {"message": "Welcome to the Team Work Tracker & Productivity API!", "docs": "/docs"}
