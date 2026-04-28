# Full-Stack Healthcare Management System

A production-grade healthcare management system built with **FastAPI** + **React**, featuring real-time WebSocket notifications, file uploads, JWT auth, pagination, search, rate limiting, background tasks, logging, and unit tests.

---

## 📁 Project Structure

```
healthapp/
├── backend/
│   ├── main.py                  # FastAPI app, middleware, routers
│   ├── database.py              # SQLAlchemy engine & session
│   ├── config.py                # Pydantic settings (.env)
│   ├── seed.py                  # Demo data seeder
│   ├── requirements.txt
│   ├── .env
│   ├── models/
│   │   └── __init__.py          # User, Doctor, Patient, Appointment, PatientFile
│   ├── schemas/
│   │   └── __init__.py          # Pydantic request/response schemas
│   ├── routers/
│   │   ├── auth.py              # Login, register
│   │   ├── doctors.py           # CRUD + search + pagination + background tasks
│   │   ├── patients.py          # CRUD + search + pagination
│   │   ├── appointments.py      # CRUD + WebSocket notifications
│   │   └── files.py             # Upload, download, delete patient files
│   ├── services/
│   │   ├── auth_service.py      # JWT, password hashing, role guards
│   │   └── websocket_manager.py # WebSocket connection manager
│   ├── tests/
│   │   └── test_api.py          # pytest unit tests
│   ├── logs/                    # Auto-created log files
│   └── uploads/                 # Uploaded patient files
│
└── frontend/
    ├── index.html
    ├── vite.config.js
    ├── package.json
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── index.css            # Global design system (CSS variables, utilities)
        ├── context/
        │   ├── AuthContext.jsx  # JWT auth state
        │   └── ToastContext.jsx # Toast notifications
        ├── services/
        │   └── api.js           # Axios client, all API calls
        ├── hooks/
        │   └── useWebSocket.js  # WebSocket hook with auto-reconnect
        ├── components/
        │   ├── Layout.jsx       # Sidebar + main content shell
        │   ├── Sidebar.jsx      # Navigation with notification badge
        │   ├── Pagination.jsx   # Reusable paginator
        │   └── ProtectedRoute.jsx
        └── pages/
            ├── Login.jsx        # Login + register (tabbed)
            ├── Dashboard.jsx    # Stats, recent appointments, live indicator
            ├── DoctorsPage.jsx  # Doctor cards + search/filter + book modal
            ├── PatientsPage.jsx # Patient table + file upload/download
            └── AppointmentsPage.jsx # Appointment cards + status workflow + booking wizard
```

---

## 🚀 Quick Start

### Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate       # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Seed demo data (creates SQLite DB + sample doctors/patients)
python seed.py

# Start server
uvicorn main:app --reload --port 8000
```

API docs → http://localhost:8000/docs

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App → http://localhost:5173

---

## 🔑 Demo Credentials

| Role    | Email                    | Password     |
|---------|--------------------------|--------------|
| Doctor  | priya@health.com         | Doctor@123   |
| Doctor  | arjun@health.com         | Doctor@123   |
| Patient | rahul@patient.com        | Patient@123  |
| Patient | sneha@patient.com        | Patient@123  |

---

## ✅ Features Implemented

### 🔹 1. Frontend (React + Vite)
- **Login page** — tabbed sign in / sign up with demo quick-login buttons
- **Doctor listing** — card grid with specialization filter chips, search, pagination, fee display, book-now
- **Patient listing** — table view with blood group filter, file manager modal per patient
- **Appointment booking UI** — 2-step wizard (pick doctor → pick date/time), time-slot grid
- Axios API service layer with automatic JWT header injection and 401 redirect

### 🔹 2. Real-Time WebSockets (FastAPI)
- `GET /api/appointments/ws/{user_id}` — persistent WebSocket per user
- **Doctor is notified** instantly when a patient books an appointment
- **Patient is notified** when doctor changes appointment status
- Auto-reconnect logic in the React hook (3s backoff)
- Live indicator badge on Appointments nav item

### 🔹 3. File Upload Module
- `POST /api/files/upload/{patient_id}` — multipart upload with description
- Allowed types: PDF, JPEG, PNG, GIF, Word, TXT
- Max file size: 10 MB (configurable via `.env`)
- `GET /api/files/patient/{id}` — list files
- `GET /api/files/download/{id}` — stream file download
- `DELETE /api/files/{id}` — delete file + disk cleanup
- Files stored in `uploads/` with UUID filenames

### 🔹 4. Advanced Backend Features
- **Pagination** — all list endpoints support `page` + `page_size` query params, return `total`, `total_pages`
- **Search & Filtering** — doctors: name/spec/qualification, min/max fee, specialization; patients: name/email/phone, blood group; appointments: status, doctor_id, patient_id
- **Rate Limiting** — SlowAPI middleware, default 200 req/min per IP
- **Background Tasks** — welcome email simulation on doctor creation via `BackgroundTasks`
- **Logging** — structured logging to `logs/app.log` + stdout; request method/path/status/duration logged per request

### 🔹 5. Testing (pytest)
```bash
cd backend
pytest tests/test_api.py -v
```
Covers: auth (register, login, duplicate email, wrong password), doctor CRUD (create, list, get, search, pagination, 404), patient (create, auth guard), appointments (create, status update), health endpoints.

### 🔹 6. Logging
- Request middleware logs every HTTP call with method, path, status code, response time
- Router-level logging for important events (user login, doctor/patient created, file uploaded)
- Error logging on failed auth attempts
- Log file: `backend/logs/app.log`

---

## 🔌 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login → JWT token |
| POST | `/api/auth/register` | Register new user |
| GET | `/api/doctors/` | List doctors (paginated, searchable) |
| POST | `/api/doctors/` | Create doctor + user |
| GET/PUT/DELETE | `/api/doctors/{id}` | Doctor CRUD |
| GET | `/api/patients/` | List patients (auth required) |
| POST | `/api/patients/` | Create patient + user |
| GET/PUT/DELETE | `/api/patients/{id}` | Patient CRUD |
| GET | `/api/appointments/` | List appointments (role-filtered) |
| POST | `/api/appointments/` | Book appointment (triggers WS) |
| PUT | `/api/appointments/{id}` | Update status (triggers WS) |
| DELETE | `/api/appointments/{id}` | Cancel appointment |
| WS | `/api/appointments/ws/{user_id}` | WebSocket connection |
| POST | `/api/files/upload/{patient_id}` | Upload file |
| GET | `/api/files/patient/{patient_id}` | List patient files |
| GET | `/api/files/download/{file_id}` | Download file |
| DELETE | `/api/files/{file_id}` | Delete file |

---

## 🎨 Design System
- **Fonts**: Syne (display/headings) + DM Sans (body)
- **Theme**: Deep navy dark mode with cyan accent (`#38bdf8`)
- **CSS Variables**: Full token system in `src/index.css`
- **Animations**: Fade-in, slide-in, pulse, spin, glow keyframes
- **Components**: Cards, badges, buttons, modals, toasts, paginator — all utility-class based
