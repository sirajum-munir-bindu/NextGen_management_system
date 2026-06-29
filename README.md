# Team Work Tracker & Productivity Management System

A production-ready SaaS application designed for Team Leads and Administrators to coordinate daily work schedules, evaluate task submissions, and analyze employee productivity statistics in real time.

---

## 🌟 Key Features

*   **Smart Morning Plan Uploader**: Paste messages directly from communication channels (e.g., WhatsApp, Telegram, Facebook Messenger). The system automatically parses lists (supports markdown, bullet points, numbered lists, etc.) and populates scheduled items.
*   **Smart Evening Report Checklist**: Automatically matches morning plans to generate an interactive checklist, reducing report logging time to seconds. In case a morning plan is missing, it provides standard manual fields.
*   **Automatic Productivity Calculation**: Generates performance scores, completion ratios, and rating categories dynamically using:
    $$\text{Completion Ratio} = \left( \frac{\text{Completed Tasks}}{\text{Planned Tasks}} \right) \times 100$$
*   **Performance Ratings**:
    *   `90% - 100%`: Excellent
    *   `75% - 89%`: Good
    *   `50% - 74%`: Average
    *   `Below 50%`: Needs Improvement
*   **Interactive Analytics Dashboard**:
    *   Cards summarizing key daily metrics.
    *   AI-style natural language team overview summaries.
    *   Recharts detailing employee efficiency, daily averages, weekly trends, and monthly trends.
*   **Export Center**: Download generated reports as **PDF**, **Excel**, or **CSV** formats using precise filtering options.
*   **Role-Based Security**: Public users can read dashboard details, while only authenticated Admins can perform CRUD actions.

---

## 🛠️ Tech Stack

*   **Frontend**: React (Vite, Tailwind CSS, Recharts, Axios, React Router, Lucide Icons)
*   **Backend**: Python, FastAPI, SQLAlchemy
*   **Database**: PostgreSQL
*   **Deployment**: Nginx, Docker, Docker Compose

---

## 📂 Project Structure

```
NextGen_management_system/
├── backend/
│   ├── app/
│   │   ├── routers/       # Endpoints (auth, employees, plans, reports, analytics)
│   │   ├── main.py        # Application entrypoint & seeding
│   │   ├── config.py      # App configurations
│   │   ├── database.py    # SQL Engine and session dependencies
│   │   ├── models.py      # Database tables
│   │   ├── schemas.py     # Pydantic validation
│   │   └── crud.py        # DB queries & rating logic
│   ├── requirements.txt   # Python package dependencies
│   └── Dockerfile         # Python slim-based container
├── frontend/
│   ├── src/
│   │   ├── components/    # Navigation layout & sidebar
│   │   ├── pages/         # Dashboard, Performance Profile, Exports, Admin CRUD
│   │   ├── services/      # Axios API service calls
│   │   ├── context/       # Auth context state provider
│   │   └── App.jsx        # Routing configuration
│   ├── nginx.conf         # Static React router handler & reverse proxy configuration
│   ├── tailwind.config.js # Visual theme definitions
│   └── Dockerfile         # Node build + Nginx runner
├── docker-compose.yml     # Multi-container orchestrator
└── .env.example           # Environment template
```

---

## 🚀 Getting Started

### Prerequisites

Ensure you have [Docker](https://www.docker.com/) and [Docker Compose](https://docs.docker.com/compose/) installed on your machine.

### Installation & Launch

1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/sirajum-munir-bindu/NextGen_management_system.git
    cd NextGen_management_system
    ```

2.  **Setup Environment Variables**:
    Copy the template file to `.env`:
    ```bash
    cp .env.example .env
    ```

3.  **Boot using Docker Compose**:
    ```bash
    docker compose up --build -d
    ```
    This command will build and deploy the services:
    *   **PostgreSQL**: Exposes port `5432` internally
    *   **FastAPI Backend**: Runs on `http://localhost:8000` (Swagger docs on `http://localhost:8000/docs`)
    *   **React Frontend**: Runs on `http://localhost` (Port `80`)

4.  **Admin Credentials**:
    The system automatically seeds a default admin account on startup:
    *   **Username**: `admin`
    *   **Password**: `AdminPass123!`

---

## 📈 Database Models

*   **Admin**: `id` (UUID), `username`, `email`, `hashed_password`, `created_at`
*   **Employee**: `id` (UUID), `name`, `email`, `department`, `designation`, `created_at`
*   **DailyPlan**: `id` (UUID), `employee_id` (FK), `date`, `planned_tasks` (JSON), `created_at`
*   **DailyReport**: `id` (UUID), `employee_id` (FK), `date`, `completed_tasks` (JSON), `pending_tasks` (JSON), `remarks`, `created_at`
*   **Productivity**: `id` (UUID), `employee_id` (FK), `date`, `planned_count`, `completed_count`, `pending_count`, `completion_percentage`, `performance_rating`, `created_at`

---

## ☁️ Production Deployment Guide

### Ubuntu Server / VPS
To deploy to a cloud server:
1. SSH into the server and install Docker.
2. Copy the code files onto the server.
3. Configure the `.env` variables (e.g. use a secure `SECRET_KEY` and solid passwords).
4. Run `docker compose up -d` in the root folder.

### Railway / Render
1. Create a **PostgreSQL** instance.
2. Connect a new web service to the `backend/` directory:
   * Build command: `pip install -r requirements.txt`
   * Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   * Set env variables: `DATABASE_URL` pointing to the DB, `SECRET_KEY`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`.
3. Connect a new static service to the `frontend/` directory:
   * Build command: `npm install && npm run build`
   * Publish directory: `dist`
   * Set env variables: `VITE_API_URL` pointing to your deployed backend URL.