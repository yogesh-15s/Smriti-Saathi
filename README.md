# AI-Based Cognitive Gaming and Memory Assistance Platform for Elderly Dementia Patients in North Eastern Region (NER)

A full-stack, accessible platform engineered to combine cognitive-training games, memory/medication reminders, and role-based interaction for **Patients**, **Doctors**, and **Caretakers**, with built-in accessibility features (high-contrast mode, scalable typography) and future North Eastern regional language readiness (Assamese, Bodo, Khasi, Mizo, Nagamese, Hindi, English).

---

## 🏛 Architecture & Monorepo Structure

Built as an **npm workspaces** monorepo containing:

```
SIH 2026/
├── apps/
│   ├── api/                 # Express REST API with TypeScript & Prisma ORM
│   │   ├── prisma/
│   │   │   └── schema.prisma# PostgreSQL schema (Users, Profiles, Reminders, Games, Alerts)
│   │   ├── src/
│   │   │   ├── controllers/ # Auth & business logic
│   │   │   ├── middleware/  # JWT & RBAC (Role-Based Access Control)
│   │   │   ├── routes/      # Patient, Doctor, Caretaker & Auth routes
│   │   │   ├── utils/       # Standardized offline-friendly API envelopes
│   │   │   └── index.ts     # Express server bootstrap
│   │   └── .env.example     # Backend environment template
│   │
│   └── web/                 # React 18 + TypeScript + Vite + Tailwind CSS
│       ├── src/
│       │   ├── components/  # Navbar, ProtectedRoute, Accessible UI elements
│       │   ├── context/     # AccessibilityContext (Contrast & Font), AuthContext
│       │   ├── pages/       # Home, Login, Signup, Patient, Doctor, Caretaker, 403
│       │   ├── lib/         # Offline-tolerant API client
│       │   └── index.css    # Tailwind CSS & high-contrast accessibility classes
│       └── .env.example     # Frontend environment template
│
├── packages/
│   └── types/               # Shared TypeScript models across web & api
│       └── src/index.ts     # User, Role, DementiaStage, Reminder, Alert, API DTOs
│
└── package.json             # Monorepo workspaces & concurrent dev scripts
```

---

## 💻 Tech Stack

### 1. Frontend (`apps/web`)
* **Core Framework**: React 18 with TypeScript
* **Build Tool & Dev Server**: Vite 6
* **Styling**: Tailwind CSS + Custom CSS Variables & High-Contrast Design System
* **Routing**: React Router DOM (v6) with Role-Based Route Guards (`ProtectedRoute`)
* **Icons**: Lucide React
* **Speech & Audio APIs**:
  * **Web Speech API (`SpeechSynthesis`)**: Text-to-speech for read-aloud reminders, game prompts, and family photo captions.
  * **HTML5 `MediaRecorder` API**: Native browser audio recording for patient voice thoughts and caretaker audio notes.
* **State & Accessibility Contexts**:
  * `AccessibilityContext`: Controls **High-Contrast Mode** (black/yellow for cataract & low-vision support) and **Dynamic Font Scaling** (`Normal 16px`, `Large 19px`, `Extra Large 22px`).
  * `AuthContext`: Manages JWT tokens, session persistence, and role-based state.

### 2. Backend API (`apps/api`)
* **Runtime & Framework**: Node.js with Express & TypeScript
* **Dev Runner**: `tsx` (TypeScript execution with live watch mode)
* **ORM & Database**: 
  * **Prisma ORM** with **PostgreSQL** schema.
  * Resilient in-memory fallback store for offline reliability and demo continuity.
* **Security & Authentication**:
  * JSON Web Tokens (`jsonwebtoken`)
  * Secure password hashing with `bcryptjs`
  * Role-Based Access Control (RBAC) middleware for `patient`, `doctor`, and `caretaker`.

### 3. Shared Workspace (`packages/types`)
* **Shared TypeScript Models**: Unified data contracts and DTOs across web & API for `User`, `Role`, `DementiaStage`, `Reminder`, `GameSession`, `CognitiveScore`, `Alert`, `FamilyPhoto`, `PatientNote`, and `PatientContact`.

### 4. Regional & Assistive Technologies
* **North Eastern Regional Language Readiness**: Built-in support for Assamese (অসমীয়া), Bodo (बर’), Khasi, Mizo, Nagamese, Hindi, and English.
* **Geolocation & Geofencing**: HTML5 Geolocation API cross-referenced against safe-zone radius coordinates with silent breach alert logging.

---

## 🚀 Quick Start Guide (Local Setup)

### 1. Prerequisites
- **Node.js**: v18.0.0 or later (v20+ recommended)
- **npm**: v9.0.0 or later
- **PostgreSQL**: Local instance or hosted connection (e.g. Supabase, Neon, or Docker)

---

### 2. Installation
Run from the repository root:
```bash
npm install
```

This will automatically install and link dependencies across root, `apps/api`, `apps/web`, and `packages/types`.

---

### 3. Environment Variables Configuration

#### Backend API (`apps/api/.env`):
Copy `.env.example` to `.env` if not already present:
```bash
cp apps/api/.env.example apps/api/.env
```
Default values:
```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ner_dementia_db?schema=public"
JWT_SECRET="ner-dementia-super-secure-jwt-secret-key-2026"
JWT_EXPIRES_IN="7d"
CORS_ORIGIN="http://localhost:5173"
```

#### Frontend Web (`apps/web/.env`):
Copy `.env.example` to `.env` if not already present:
```bash
cp apps/web/.env.example apps/web/.env
```
Default values:
```env
VITE_API_URL="http://localhost:5000"
```

---

### 4. Database Schema Synchronization

Generate the Prisma Client:
```bash
npm run db:generate
```

Push schema definitions directly to your PostgreSQL database:
```bash
npm run db:push
```

*(Optional) To explore records visually via Prisma Studio:*
```bash
npm run db:studio --workspace=apps/api
```

---

### 5. Running the Application Locally

Run both the API server (Port 5000) and Vite Web Frontend (Port 5173) simultaneously:
```bash
npm run dev
```

Or run them individually:
```bash
# Run API only:
npm run dev:api

# Run Frontend Web only:
npm run dev:web
```

Open your browser at: **`http://localhost:5173`**

---

## 🛡️ Role-Based Access Control (RBAC) & Testing

The system enforces strict RBAC both at the Express middleware layer and React routing layer:

| Role | Portal Route | Description | Access Rules |
| :--- | :--- | :--- | :--- |
| **Patient** | `/patient` | Assisted layout, large touch targets, daily medication reminders, cultural games, SOS button. | Restricted to `role: 'patient'` |
| **Doctor** | `/doctor` | Verified practitioner console, longitudinal MMSE tracking, clinical alert review. | Restricted to `role: 'doctor'` (Requires Medical Reg. No.) |
| **Caretaker**| `/caretaker`| Medication scheduler, family linking invite code (`NER-XXXX`), real-time status. | Restricted to `role: 'caretaker'` |

*Unauthorized attempts trigger a 403 response or route directly to `/unauthorized` with safe redirects.*

---

## ♿ Elderly Accessibility Architecture

1. **High Contrast Mode**:
   - Easily toggled from the top navigation bar.
   - Activates high-visibility black-and-yellow color schemes to assist elderly patients with cataracts or visual impairments.
2. **Dynamic Font Scaling**:
   - Instant cycle through `Normal (16px)`, `Large (19px)`, and `Extra Large (22px)`.
   - Modifies root REM units dynamically across all patient-facing surfaces.
3. **Voice & Audio Feedback (Read Aloud)**:
   - Built-in speech synthesis triggers for daily schedules, medication announcements, and game instructions.
4. **North Eastern Regional Language Readiness**:
   - Language selector dropdown with support for Assamese (অসমীয়া), Bodo (बर’), Khasi, Mizo, Nagamese, Hindi, and English.

---

## 📋 Available Root Scripts

- `npm run dev`: Boots both frontend and backend concurrently.
- `npm run dev:api`: Starts backend API in tsx watch mode.
- `npm run dev:web`: Starts Vite development server.
- `npm run build`: Compiles TypeScript and builds production bundles across workspaces.
- `npm run db:generate`: Runs `prisma generate`.
- `npm run db:push`: Synchronizes Prisma schema with PostgreSQL.
