import os

class Settings:
    PROJECT_NAME: str = "Team Work Tracker & Productivity Management System"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/productivity_db")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "super-secret-key-change-in-production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440")) # 24 hours
    
    # Default Admin credentials
    ADMIN_USERNAME: str = os.getenv("ADMIN_USERNAME", "admin")
    ADMIN_PASSWORD: str = os.getenv("ADMIN_PASSWORD", "AdminPass123!")
    ADMIN_EMAIL: str = os.getenv("ADMIN_EMAIL", "admin@company.com")

settings = Settings()
