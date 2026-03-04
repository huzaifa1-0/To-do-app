# Daily Expense Tracker – Efficient Functionality Overview

## 1. Overview
A modern full-stack web application to log, categorize, and visualize daily expenses.
- **Backend:** Django with strict business logic.
- **Frontend:** React for responsive UI.
- **Goal:** Real-time insights and intelligent expense tracking.

---

## 2. Step-by-Step Usage Guide

### Getting Started
To run the application locally, follow these steps:

#### Backend Setup
1. Navigate to the `backend/` directory.
2. Install dependencies: `pip install -r requirements.txt`.
3. Set up environment variables in a `.env` file (see `.env.example`).
4. Run migrations: `python manage.py migrate`.
5. Start the server: `python manage.py runserver`.

#### Frontend Setup
1. Navigate to the `Frontend/` directory.
2. Install dependencies: `npm install`.
3. Create a `.env` file and set `VITE_API_BASE_URL=http://localhost:8000/api`.
4. Start the development server: `npm run dev`.

---

### Authentication & User Management
The application uses **Email-Based JWT Authentication** for secure sessions.

1. **Signup:** Click "Sign Up" to create an account.
   - Enter your first name, last name, email, and password.
   - Features: Password hints, show/hide toggle, and a secure password generator.
   - **Endpoint:** `POST /api/register/`
2. **Login:** Log in with your email and password.
   - Tokens are stored in `localStorage` for stateless session management.
   - **Endpoint:** `POST /api/login/`
3. **Password Recovery:**
   - **Request OTP:** If you forget your password, request a 6-digit OTP via email.
   - **Verify OTP:** Enter the code to unlock the reset stage.
   - **Reset Password:** Set a new secure password.

---

### Managing Expenses
Gain real-time insights into your spending habits.

#### Manual Entry
- Use the dashboard to view your "Today's Expenses" (resets daily at 12:00 AM PKT).
- View recent expenses or filter by category (Food, Transport, Shopping, Bills, Other).

#### AI-Powered Expense Entry
Instead of filling out multiple fields, simply describe your expense:
1. Type a sentence like: *"Bought Biryani for Rs. 500"* or *"Paid electricity bill of 2500"*.
2. Press Enter.
3. The system uses an **NLP engine (Groq/LLaMA-8B)** to extract the amount and category automatically.
4. The UI updates instantly without a page reload.
- **Endpoint:** `POST /api/expenses/ai-process/`

---

### Admin Reporting System
Administrators can access the reporting system at `/admin`.

1. **User Reporting:**
   - View all registered users with their **Total Expenses aggregated**.
   - Search by username or email.
   - Order users by their total spending.
2. **Detailed Tracking:**
   - Click on any user to see their specific expenses as an **Inline Table**.
   - Manage all expenses centrally: filter by category, date, or search for specific items.

---

## 3. System Properties
- **Database:** `db.sqlite3` with normalized models.
- **NLP Engine:** Powered by Groq/LLaMA-8B for intelligent parsing.
- **Deployment:**
  - **Backend:** Railway (Gunicorn compatible).
  - **Frontend:** Vercel (Vite JS).
