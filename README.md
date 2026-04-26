# 🚀 Smart Campus Hub

A unified digital platform for modern campus life — discover spaces, book resources, manage incidents, and streamline operations with secure, role-based workflows.

| 🔧 Module / Function                     | 👤 Responsible Member |
| ---------------------------------------- | --------------------- |
| 📦 Resource Management                   | Janith Chamitha       |
| 📅 Booking System                        | Pulditha Shrihara     |
| 🎫 Ticket / Incident Management          | Dinusha Shashini      |
| 🔐 Google Authentication & Notifications | Akeeth Ahamed         |

## 🌟 Why This Project Stands Out

Smart Campus Hub goes beyond simple CRUD apps — it’s designed to simulate real-world campus operations with scalability and usability in mind.

## ✨ Key Highlights

- 🔐 Multi-role system — Student, Admin, Technician, Superadmin
- 🔄 Complete workflows — Booking lifecycle, incident tracking, and resource management
- 🛡️ Advanced authentication — JWT security, OTP verification, password recovery, Google login
- 📊 Operational insights — Dashboards, notifications, and system analytics
- 🧩 Clean architecture — Modular, scalable, and developer-friendly design

## 👥 Role-Based Experience

### 🎓 Student
- Register and verify account via OTP
- Login using password or Google
- Browse resources and create bookings
- Manage personal incidents (with state-based control)
- Receive notifications and reset passwords securely

### 🧑‍💼 Admin
- Manage users, resources, and technicians
- Review bookings and pending requests
- Track and coordinate incidents
- Send notifications to users
- Monitor dashboards and AI-powered insights

### 🛠️ Technician
- Receive assigned incidents
- Accept, update, or decline tasks
- Manage workload via a focused interface

### 🏢 Superadmin
- Create and manage admin & technician accounts
- Full platform-level control and visibility

## ⚙️ Tech Stack

### 🎨 Frontend
- React 19 + Vite
- React Router DOM
- Google OAuth Integration
- ESLint

### 🔧 Backend
- Java 25 + Spring Boot 4
- Spring Security (JWT + Stateless Auth)
- MongoDB (Spring Data)
- Spring Mail (OTP & emails)
- ZXing (QR Code support)
- Swagger (OpenAPI Docs)

## 🏗️ Architecture Overview

```text
smart_campus_new/
├── frontend/        # React app (role-based UI)
│   ├── api/         # API handling
│   ├── components/  # Reusable UI
│   ├── pages/       # Role-based pages
│   ├── context/     # Auth state
│   ├── layouts/     # Layout system
│   └── App.jsx      # Routing & protection
│
├── backend/         # Spring Boot API
│   ├── auth/        # Authentication logic
│   ├── booking/     # Booking system
│   ├── incident/    # Incident management
│   ├── resource/    # Resource handling
│   ├── notifications/
│   ├── user/
│   └── security/    # JWT + configs
```

## 🚀 Quick Start

### 1️⃣ Run Backend

```bash
cd backend
./mvnw spring-boot:run
```

👉 Runs on: `http://localhost:8081`

### 2️⃣ Run Frontend

```bash
cd frontend
npm install
npm run dev
```

👉 Runs on: `http://localhost:5173`

## 🔐 Security Model

- Public endpoints -> `/api/auth/**`
- Protected endpoints -> require JWT
- Role-based access:
  - `SUPERADMIN` -> `/api/superadmin/**`
  - `ADMIN` -> `/api/admin/**`

Frontend mirrors this using protected routes.

## 📡 API Documentation

Once backend is running:

- Swagger UI -> `http://localhost:8081/swagger-ui.html`
- OpenAPI Docs -> `http://localhost:8081/v3/api-docs`

## 🛠️ Build for Production

### Backend

```bash
cd backend
./mvnw clean package
```

### Frontend

```bash
cd frontend
npm run build
```

## ⚠️ Troubleshooting

- ❌ `502 Error` -> Backend not running
- 🔒 `401 Unauthorized` -> Invalid or missing JWT
- 📧 OTP issues -> Check SMTP config
- 🌐 Google login issues -> Verify OAuth keys
- 🗄️ MongoDB errors -> Check connection URI

## 🔒 Security Best Practices

- Keep all secrets out of git
- Use environment variables and gitignored local files
- Rotate exposed credentials immediately

## 🚧 Future Enhancements

- Dockerized deployment
- Advanced analytics & AI insights

## 💡 Final Note

Built to simplify campus operations, improve transparency, and deliver a seamless experience across all user roles.
