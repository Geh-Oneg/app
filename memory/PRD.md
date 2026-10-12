# PRD — Gestão de OS de Manutenção · Frota Escolar

## Problem Statement
Full-stack web/mobile app (pt-BR) to manage maintenance Service Orders (OS) for a school bus fleet. Two roles: Motorista (driver) and Supervisor (admin). Drivers create/view their own OSs; supervisors see all, update statuses, and generate PDF-ready OS sheets.

## Users
- Motorista — registers, submits new OSs, tracks status of own requests
- Supervisor — approves users, manages vehicles, triages OSs, prints official PDF

## Core Requirements (static)
- JWT auth with matrícula + senha (bcrypt)
- Self-registration pending supervisor approval
- Vehicle registry (CRUD by supervisor) + manual entry fallback
- OS lifecycle: Pendente → Em Análise → Em Manutenção → Concluída / Rejeitada
- Supervisor filters/search (status, placa, motorista, data, texto)
- Supervisor notes + status history
- Printable OS layout (A4) with signature blocks and `@media print` cleanup
- Mobile-first responsive UI, yellow (amber) + slate navy palette

## Implemented (2026-02-12)
- Backend FastAPI with endpoints under /api: auth (register/login/me), users (list/approve/delete), vehicles (CRUD), service-orders (CRUD + filters + patch status), stats
- MongoDB collections with unique indexes on matricula, plate, os_number
- Auto-generated OS number format OS-YYYY-NNNN
- Admin seeded on startup (ADMIN001 / admin123)
- Frontend React Router: /login, /register, /driver, /driver/new, /admin, /admin/vehicles, /admin/users, /os/:id/print
- Login/Register pages with hero image + branded form
- Driver dashboard: hero CTA, metric cards, OS list with status badges
- New OS form: auto-filled driver info, vehicle select or manual, KM, urgência, description
- Admin dashboard: metrics, filter bar (search/status/plate/driver/date range), responsive table + mobile cards, inline edit dialog (shadcn Dialog) for status + notes
- Vehicles management page
- Users approval page (pending/all tabs)
- Printable OS page with sections (solicitante, veículo, descrição, parecer, histórico, assinaturas) and @media print rules
- Toaster (sonner), lucide icons, shadcn/ui components

## Verified
- Testing agent iteration 1: 100% backend + frontend pass, no failures

## Backlog (P1/P2)
- P1: Photo attachments on OS (object storage)
- P1: Email notifications on status changes (Resend)
- P2: Export CSV / consolidated monthly report
- P2: Signature capture on tablet
- P2: Dashboard charts (OS trends, by vehicle)
