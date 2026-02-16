

# Interview Scheduling System — "InterviewBook"

A Calendly-style self-service interview booking platform with a sleek, dark-themed design inspired by Securovix.com (dark backgrounds, bold typography, neon/lime-green accents).

---

## 1. Design & Theme
- **Dark mode** as default with a modern, bold aesthetic
- **Neon green / lime accent color** for CTAs, active states, and highlights
- Clean typography, generous spacing, subtle animations
- Fully responsive (mobile + desktop)

---

## 2. Public Booking Flow (Candidate-Facing)

### Booking Page
- **Calendar date picker** — candidates select an available date
- **Time slot grid** — shows available 30-min or 60-min slots for the selected date
- Unavailable/past slots are greyed out

### Booking Form
- Candidate fills in: **Name, Email, Phone (optional), Role applying for, Notes**
- Form validation with clear error messages

### Confirmation Page
- Shows booking summary: date, time, interviewer, role
- "Add to Calendar" option (downloadable .ics file)
- Confirmation also sent to candidate's email (via Supabase Edge Function)

---

## 3. Admin Dashboard (Recruiter-Facing)

### Authentication
- Admin login with email/password via Supabase Auth
- Role-based access (admin role stored in a `user_roles` table)

### Availability Management
- Admins set their weekly recurring availability (e.g., Mon–Fri, 9am–5pm)
- Option to block specific dates/times (holidays, breaks)

### Interview Management
- View all upcoming and past interviews in a **list and calendar view**
- Filter by date, status, or candidate name
- Each booking shows candidate details, time, and status
- **Status tracking**: Scheduled → Completed / Cancelled / No-show
- Cancel or reschedule bookings

### Dashboard Overview
- Quick stats: interviews today, this week, total upcoming
- Recent bookings list

---

## 4. Backend (Supabase)

- **Database tables**: profiles, user_roles, availability_slots, bookings
- **Row-Level Security** on all tables
- **Edge Function** for sending confirmation emails on booking
- Automatic slot availability calculation based on admin settings and existing bookings

---

## 5. Pages Summary

| Page | Description |
|------|-------------|
| `/` | Landing/hero page with "Book an Interview" CTA |
| `/book` | Calendar + time picker + booking form |
| `/book/confirmation` | Booking confirmation with details |
| `/login` | Admin login |
| `/admin` | Dashboard with stats & upcoming interviews |
| `/admin/availability` | Manage available time slots |
| `/admin/bookings` | Full list of all bookings |

