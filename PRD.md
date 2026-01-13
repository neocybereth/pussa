⏺ I've created a comprehensive implementation plan for your music teacher website. Here's a summary:

What you'll get:

- Modern, beautiful UI with Tailwind CSS + shadcn/ui components
- Teacher login to manage everything
- Student registration and personal dashboards
- Editable, by teacher only, Exercise library with audio upload and playback
- Calendar system showing classes with payment status (paid/unpaid)
- Editable About page with bio and pricing
- Mobile-responsive design
- Free hosting on Vercel

Tech choices:

- Next.js 15 + React (fast, modern)
- Vercel Postgres (database)
- Vercel Blob (audio file storage)
- All within free tiers for development and small-scale production

The plan includes 9 implementation phases, starting with project setup and authentication, then building out exercises, student management, calendar, and finally polishing the dashboards.

─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
Ready to code?

Here is Claude's plan:
╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
Music Teacher Website - Implementation Plan

Overview

A modern, mobile-responsive website for a music teacher to manage students, exercises, and class scheduling.

Tech Stack

- Framework: Next.js 15 with App Router + React 19
- Styling: Tailwind CSS + shadcn/ui components
- Database: Vercel Postgres with Prisma ORM
- Auth: NextAuth.js v5 (credentials provider)
- File Storage: Vercel Blob (for audio files)
- Hosting: Vercel

Core Features

1.  Authentication

- Teacher (admin) login
- Student registration and login
- Role-based access control via middleware

2.  Exercise Management (Teacher)

- Upload audio snippets (mp3, wav, m4a, ogg - max 50MB)
- Add title and description
- Assign exercises to specific students

3.  Info/About Page (Teacher editable)

- Teacher bio and photo
- Class pricing
- Contact information

4.  Student Dashboard

- View assigned exercises with audio player
- Personal calendar with scheduled classes
- See payment status (paid/unpaid)

5.  Teacher Dashboard

- Manage all students
- Master calendar (all students)
- Schedule classes
- Mark payments as paid/unpaid
- Assign/unassign exercises

Database Schema

enum Role { TEACHER, STUDENT }
enum PaymentStatus { PAID, UNPAID }

model User {
id, email, password, name, role
assignedExercises -> StudentExercise[]
scheduledClasses -> ScheduledClass[]
}

model Exercise {
id, title, description, audioUrl, audioKey
assignedTo -> StudentExercise[]
}

model StudentExercise {
id, studentId, exerciseId, assignedAt, notes
}

model ScheduledClass {
id, studentId, title, startTime, endTime, paymentStatus, notes
}

model SiteSettings {
id, teacherBio, teacherName, teacherPhoto, pricing (JSON), contactInfo (JSON)
}

Project Structure

src/
├── app/
│ ├── (auth)/login, register
│ ├── (public)/about
│ ├── dashboard/
│ │ ├── student/exercises, calendar
│ │ └── teacher/students, exercises, calendar, schedule, settings
│ └── api/auth, upload, exercises, students, classes, settings
├── components/
│ ├── ui/ (shadcn components)
│ ├── layout/ (header, sidebar, footer)
│ ├── auth/ (forms)
│ ├── exercises/ (audio-player, uploader, forms)
│ ├── calendar/ (calendar-view, schedule-form)
│ └── students/ (list, cards)
├── lib/ (db, auth, blob, utils)
└── middleware.ts (route protection)

Implementation Phases

Phase 1: Project Setup

- Initialize Next.js 15 with TypeScript + Tailwind
- Install dependencies (Prisma, NextAuth, Vercel Blob, shadcn/ui)
- Set up Vercel Postgres and Prisma schema
- Create environment variables
- Seed teacher account

Phase 2: Authentication

- Configure NextAuth.js with credentials provider
- Create login/register pages and forms
- Implement middleware for route protection
- Test auth flow

Phase 3: Layout & Navigation

- Root layout with providers
- Header with navigation
- Dashboard shell with sidebar
- Mobile-responsive nav
- Footer

Phase 4: Exercise Management

- Exercise CRUD API routes
- Audio uploader with Vercel Blob
- Custom audio player component
- Exercise form (create/edit)
- Exercise list view
- Assign-to-students functionality

Phase 5: Student Management

- Students API routes
- Student list view with search
- Student detail page
- Per-student exercise assignments

Phase 6: Calendar & Scheduling

- Install FullCalendar or react-big-calendar
- Class scheduling API routes
- Calendar view component
- Schedule class form
- Payment status toggle
- Teacher master calendar + student personal calendar

Phase 7: Site Settings

- Settings API routes
- Bio/pricing/contact editors
- Public about page with dynamic content

Phase 8: Dashboard Polish

- Student dashboard with widgets
- Teacher dashboard with overview
- Loading states and skeletons
- Toast notifications
- Mobile testing

Phase 9: Deploy

- Deploy to Vercel
- Configure production env vars
- Final testing

Key Dependencies

{
"@prisma/client": "latest",
"@auth/prisma-adapter": "latest",
"next-auth": "beta",
"bcryptjs": "latest",
"@vercel/blob": "latest",
"@vercel/postgres": "latest",
"zod": "latest",
"react-hook-form": "latest",
"@hookform/resolvers": "latest",
"@fullcalendar/react": "latest"
}

Verification Plan

1.  Auth Testing:

- Register new student account
- Login as student and teacher
- Verify role-based redirects

2.  Exercise Testing:

- Upload audio file as teacher
- Create exercise with description
- Assign to student
- Verify student can see and play audio

3.  Calendar Testing:

- Schedule class for student
- Toggle payment status
- Verify both teacher and student see the class

4.  Settings Testing:

- Edit teacher bio and pricing
- Verify public about page updates

5.  Mobile Testing:

- Test all features on mobile viewport
- Verify touch interactions work
