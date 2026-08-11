# AquaServe — Backend Architecture Specification
### Shared Backend for Android App (React Native) + Admin Web Panel (React) — FastAPI + PostgreSQL

**Purpose of this document:** a precise, unambiguous backend contract to hand to Emergent AI so the generated backend structure is admin-panel-ready from day one. The mobile app and the future admin web panel will call the **same API**, differentiated purely by **role-based access control (RBAC)** — not by separate backends.

---

## 1. Core Architecture Principle

> **One backend, one database, one set of resource routers. Access is controlled by role, not by duplicating endpoints.**

- Every user (Service Needer, Provider, Admin) lives in the same `users` table with a `role` field.
- Resource routers (e.g. `/bookings`, `/services`) are **shared** — the same endpoint returns different scoped data depending on who's calling it (a Service Needer sees their own bookings, a Provider sees assigned jobs, an Admin sees everything).
- A small set of endpoints are **admin-only** (provider approval, service CRUD, payouts, settings/CMS) — these live under an `/admin` prefix and are protected by an `require_role("admin")` dependency.
- This means when the admin web panel is built later, **no backend rework is needed** — it simply consumes existing endpoints plus the `/admin/*` namespace, using the same auth/session mechanism (JWT).

---

## 2. Tech Stack

| Layer | Choice |
|---|---|
| Mobile App | React Native |
| Admin Panel (later) | React (web) | -- its later plan not now. we can do it later after the complete app developement
| Backend API | FastAPI (Python) |
| Database | PostgreSQL |
| ORM | drizzle-orm |
| Auth | JWT access + refresh tokens; OTP-based login for app users, email/password login for Admin | (for OTP use firebase otp setup) 
| File/Image storage | use claudinary for review images, service images |

---

## 3. Backend Folder Structure (FastAPI)

```
backend/
├── app/
│   ├── main.py                     # FastAPI app entrypoint, router registration
│   ├── core/
│   │   ├── config.py                # env vars, settings
│   │   ├── security.py              # JWT creation/validation, password hashing, OTP hashing
│   │   └── permissions.py           # require_role() dependency, current_user resolver
│   ├── db/
│   │   ├── base.py                  # SQLAlchemy Base
│   │   └── session.py               # DB session/connection
│   ├── models/                      # SQLAlchemy ORM models (1 file per entity group)
│   │   ├── user.py
│   │   ├── provider.py
│   │   ├── service.py
│   │   ├── booking.py
│   │   ├── payment.py
│   │   ├── review.py
│   │   └── settings.py
│   ├── schemas/                     # Pydantic request/response models (mirrors models/)
│   │   ├── user.py
│   │   ├── provider.py
│   │   ├── service.py
│   │   ├── booking.py
│   │   ├── payment.py
│   │   ├── review.py
│   │   └── settings.py
│   ├── api/
│   │   └── v1/
│   │       ├── auth.py              # shared: OTP + admin login
│   │       ├── users.py             # shared: profile, addresses
│   │       ├── categories.py        # shared read / admin write
│   │       ├── services.py          # shared read / admin write
│   │       ├── providers.py         # provider self-service (availability, KYC)
│   │       ├── cart.py               # service needer only
│   │       ├── bookings.py          # shared, role-scoped
│   │       ├── payments.py          # shared, role-scoped
│   │       ├── reviews.py           # shared, role-scoped
│   │       ├── notifications.py     # shared
│   │       └── admin/
│   │           ├── admin_bookings.py
│   │           ├── admin_providers.py
│   │           ├── admin_service_needers.py
│   │           ├── admin_services.py
│   │           ├── admin_earnings.py
│   │           ├── admin_settings.py
│   │           └── admin_dashboard.py
│   ├── services/                    # business logic layer (called by routers, not DB directly)
│   │   ├── auth_service.py
│   │   ├── booking_service.py
│   │   ├── provider_service.py
│   │   ├── payment_service.py
│   │   ├── commission_service.py
│   │   ├── notification_service.py
│   │   └── review_service.py
│   └── utils/
│       ├── otp.py
│       └── file_upload.py
├── alembic/                          # DB migrations
├── requirements.txt
└── .env.example
```

**Why this matters for Emergent AI:** routers only orchestrate request/response; all business rules (status transitions, commission math, OTP checks) live in `services/`. This keeps the admin panel's future endpoints thin — they'll reuse the same service-layer functions, not duplicate logic.

---

## 4. Roles & Auth Model

**Roles (single enum, stored on `users.role`):** `service_needer` | `provider` | `admin`

| Concern | Service Needer / Provider (App) | Admin (Web Panel) |
|---|---|---|
| Login method | Phone number + OTP | Email + password |
| Token | JWT access (short-lived) + refresh token | JWT access + refresh token |
| Session storage | Secure storage on device | HTTP-only cookie or local storage on web |

- A single `current_user` dependency resolves the logged-in user + role from the JWT on every request.
- A `require_role("admin")` / `require_role("provider")` dependency guards restricted endpoints.
- Provider accounts have an additional gate: `provider_profiles.status` must be `approved` before login succeeds (see Section 8).

---

## 5. Database Schema

### 5.1 `users`
Core identity table for all three roles.

| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| role | enum: service_needer, provider, admin | |
| phone | string, unique, nullable | required for service_needer/provider |
| email | string, unique, nullable | required for admin |
| password_hash | string, nullable | admin only |
| name | string | |
| profile_photo_url | string, nullable | |
| is_active | boolean, default true | soft-disable account |
| created_at / updated_at | timestamp | |

### 5.2 `otp_verifications`
| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| phone | string | |
| otp_code_hash | string | never store plain OTP |
| expires_at | timestamp | |
| is_verified | boolean | |
| created_at | timestamp | |

### 5.3 `addresses`
| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| user_id | UUID (FK → users) | |
| label | string | e.g. Home, Office |
| address_line | text | |
| city / state / pincode | string | |
| latitude / longitude | float | |
| is_default | boolean | |

### 5.4 `service_categories`
| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| name | string | Installation, Filter Change, Repair, AMC, General Service |
| icon_url | string | |
| is_active | boolean | admin can soft-disable a category |

### 5.5 `services`
Admin-managed catalog — the "add/edit/delete services" requirement lives here.

| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| category_id | UUID (FK → service_categories) | |
| name | string | |
| description | text | |
| price | decimal | |
| estimated_duration_minutes | int | |
| image_url | string | |
| is_active | boolean | soft delete |
| created_by / updated_by | UUID (FK → users, admin) | audit trail |
| created_at / updated_at | timestamp | |

### 5.6 `provider_profiles`
| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| user_id | UUID (FK → users) | |
| status | enum: pending, approved, rejected, suspended | gates login |
| service_area_locality | string | |
| service_radius_km | float | |
| id_proof_url | string, nullable | |
| commission_percentage | decimal | can be per-provider or fall back to global setting |
| is_online | boolean | availability toggle |
| current_latitude / current_longitude | float, nullable | Phase 2 live tracking |
| average_rating | decimal, default 0 | denormalized, recalculated on new review |
| total_jobs_completed | int, default 0 | |
| approved_by | UUID (FK → users, admin), nullable | |
| approved_at | timestamp, nullable | |
| created_at / updated_at | timestamp | |

### 5.7 `provider_service_categories` (join table)
| Column | Type | Notes |
|---|---|---|
| provider_id | UUID (FK → provider_profiles) | |
| category_id | UUID (FK → service_categories) | which services a provider is qualified for |

### 5.8 `carts` / `cart_items`
| Table | Column | Type | Notes |
|---|---|---|---|
| carts | id, service_needer_id (FK users), created_at | | one active cart per service needer |
| cart_items | id, cart_id (FK), service_id (FK), quantity, price_snapshot | | price captured at add-time |

### 5.9 `bookings`
The central transactional entity — this is what Admin's "see all bookings and all details" queries against.

| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| booking_code | string, unique | human-readable ref, e.g. AQS-10234 |
| service_needer_id | UUID (FK → users) | |
| provider_id | UUID (FK → provider_profiles), nullable | null until assigned |
| address_id | UUID (FK → addresses) | |
| scheduled_date | date | |
| scheduled_time_slot | string | e.g. "10:00 AM - 12:00 PM" |
| notes | text, nullable | client's issue description |
| status | enum: pending, provider_assigned, on_the_way, arrived, in_progress, completed, cancelled | |
| otp_code_hash | string, nullable | generated on assignment, checked at arrival |
| otp_attempts | int, default 0 | tracks failed verification attempts (max 3) |
| otp_verified_at | timestamp, nullable | |
| subtotal / visit_charge / tax / total_amount | decimal | |
| payment_method | enum: cod, upi | |
| payment_status | enum: pending, paid, failed | |
| cancelled_reason | text, nullable | |
| cancelled_by | UUID (FK → users), nullable | |
| created_at / updated_at | timestamp | |

### 5.10 `booking_items`
| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| booking_id | UUID (FK → bookings) | |
| service_id | UUID (FK → services) | |
| quantity | int | |
| price | decimal | price snapshot at booking time |

### 5.11 `booking_status_history`
Full audit trail — critical for Admin visibility into "what happened and when."

| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| booking_id | UUID (FK → bookings) | |
| status | string | |
| changed_by | UUID (FK → users) | |
| notes | text, nullable | |
| created_at | timestamp | |

### 5.12 `job_assignment_requests`
Supports the accept/reject-with-timer dispatch flow.

| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| booking_id | UUID (FK → bookings) | |
| provider_id | UUID (FK → provider_profiles) | |
| status | enum: pending, accepted, rejected, expired | |
| sent_at / responded_at / expires_at | timestamp | |

### 5.13 `payments`
| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| booking_id | UUID (FK → bookings) | |
| amount | decimal | |
| method | enum: cod, upi | |
| transaction_id | string, nullable | UPI gateway reference |
| status | enum: pending, paid, failed | |
| collected_by | UUID (FK → users, provider), nullable | for COD |
| paid_at | timestamp, nullable | |

### 5.14 `commission_ledger`
Backs Admin's "total earnings vs total commission payouts" requirement directly.

| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| booking_id | UUID (FK → bookings) | |
| provider_id | UUID (FK → provider_profiles) | |
| service_amount | decimal | booking total |
| commission_percentage | decimal | snapshot at time of completion |
| platform_commission_amount | decimal | what the business keeps |
| provider_payout_amount | decimal | what's owed to the provider |
| payout_status | enum: pending, paid | |
| payout_date | timestamp, nullable | |
| created_at | timestamp | |

### 5.15 `reviews` / `review_images`
| Table | Column | Type | Notes |
|---|---|---|---|
| reviews | id, booking_id (FK), service_needer_id (FK), provider_id (FK), rating (1-5), comment (text), tags (string array), created_at | | one review per booking |
| review_images | id, review_id (FK), image_url | | 0-many images per review |

### 5.16 `notifications`
| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| user_id | UUID (FK → users) | |
| title / body | string / text | |
| type | string | booking_update, job_request, payment, etc. |
| is_read | boolean | |
| created_at | timestamp | |

### 5.17 `app_settings`
Backs "admin can change cosmetics like phone number or company contact."

| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| key | string, unique | e.g. `support_phone`, `support_whatsapp`, `support_email`, `company_address`, `default_commission_percentage`, `visit_charge`, `tax_percentage` |
| value | text | |
| updated_by | UUID (FK → users, admin) | |
| updated_at | timestamp | |

Simple key-value CMS table — avoids a schema migration every time the business wants to tweak a contact number or default charge.

---

## 6. API Endpoint Map

All routes prefixed `/api/v1`. **"Roles"** column shows who can call it — the same endpoint enforces different data scoping per role inside the service layer.

### 6.1 Auth (shared)
| Method | Path | Roles | Description |
|---|---|---|---|
| POST | `/auth/otp/request` | public | send OTP to phone |
| POST | `/auth/otp/verify` | public | verify OTP, returns JWT (creates account if new) |
| POST | `/auth/admin/login` | public | admin email/password login |
| POST | `/auth/refresh` | authenticated | refresh access token |
| GET | `/auth/me` | authenticated | current user profile |
| POST | `/auth/logout` | authenticated | invalidate refresh token |

### 6.2 Users & Addresses (shared)
| Method | Path | Roles | Description |
|---|---|---|---|
| PATCH | `/users/me` | authenticated | update own profile |
| GET | `/addresses` | service_needer | list own addresses |
| POST | `/addresses` | service_needer | add address |
| PATCH / DELETE | `/addresses/{id}` | service_needer | edit/remove |

### 6.3 Categories & Services (read shared, write admin-only)
| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/categories` | all | list active categories |
| GET | `/services` | all | list active services (filter by category) |
| GET | `/services/{id}` | all | service detail |
| POST | `/admin/services` | admin | create service |
| PATCH | `/admin/services/{id}` | admin | edit service |
| DELETE | `/admin/services/{id}` | admin | soft-delete service |
| POST / PATCH / DELETE | `/admin/categories...` | admin | manage categories |

### 6.4 Provider Self-Service
| Method | Path | Roles | Description |
|---|---|---|---|
| POST | `/providers/apply` | provider (new) | submit KYC/profile (status → pending) |
| PATCH | `/providers/me/availability` | provider | toggle online/offline |
| GET | `/providers/nearby` | service_needer | list nearby approved providers |
| GET | `/providers/me/earnings` | provider | own earnings summary |
| GET | `/providers/me/reviews` | provider | own reviews |

### 6.5 Cart (service_needer only)
| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/cart` | service_needer | view cart |
| POST | `/cart/items` | service_needer | add item |
| PATCH / DELETE | `/cart/items/{id}` | service_needer | update/remove |

### 6.6 Bookings (shared, role-scoped)
| Method | Path | Roles | Description |
|---|---|---|---|
| POST | `/bookings` | service_needer | create booking (checkout) |
| GET | `/bookings` | service_needer, provider | own bookings (scoped by role) |
| GET | `/bookings/{id}` | service_needer, provider, admin | full detail (admin sees everything regardless of ownership) |
| PATCH | `/bookings/{id}/cancel` | service_needer, admin | cancel |
| POST | `/bookings/{id}/reschedule` | service_needer | reschedule |
| GET | `/jobs/requests` | provider | pending assignment requests |
| POST | `/jobs/{booking_id}/accept` | provider | accept job |
| POST | `/jobs/{booking_id}/reject` | provider | reject job |
| PATCH | `/bookings/{id}/status` | provider | advance status (start_journey → arrived → in_progress → completed) |
| POST | `/bookings/{id}/verify-otp` | provider | verify OTP to start service |
| POST | `/bookings/{id}/resend-otp` | service_needer | regenerate OTP |

### 6.7 Payments (shared)
| Method | Path | Roles | Description |
|---|---|---|---|
| POST | `/bookings/{id}/payments/collect` | provider | mark COD collected |
| POST | `/bookings/{id}/payments/confirm-upi` | service_needer | confirm UPI payment |
| GET | `/bookings/{id}/payments/qr` | provider | generate dynamic Razorpay UPI QR code link/data |
| GET | `/bookings/{id}/payment` | service_needer, provider, admin | payment status/detail |

### 6.8 Reviews (shared)
| Method | Path | Roles | Description |
|---|---|---|---|
| POST | `/bookings/{id}/review` | service_needer | submit rating + review + images |
| GET | `/providers/{id}/reviews` | all | public provider reviews |

### 6.9 Notifications (shared)
| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/notifications` | authenticated | list own notifications |
| PATCH | `/notifications/{id}/read` | authenticated | mark as read |

### 6.10 Admin-Only Endpoints
| Method | Path | Description |
|---|---|---|
| GET | `/admin/bookings` | all bookings, filterable by status/date/provider/service needer |
| GET | `/admin/bookings/{id}` | full detail: service needer info, provider info, charges, payment, review + images |
| GET | `/admin/service-needers` | list all service needers with aggregate spend/bookings |
| GET | `/admin/service-needers/{id}` | full profile: bookings, payments, reviews given |
| GET | `/admin/providers` | list providers, filter by status (pending/approved/suspended) |
| GET | `/admin/providers/{id}` | full provider profile + performance |
| PATCH | `/admin/providers/{id}/approve` | approve pending provider (enables their login) |
| PATCH | `/admin/providers/{id}/reject` | reject application |
| PATCH | `/admin/providers/{id}/suspend` | disable an approved provider |
| POST | `/admin/providers` | manually create + auto-approve a provider account |
| GET | `/admin/earnings/summary` | total revenue, total commission earned, total payouts pending/paid |
| GET | `/admin/earnings/providers/{id}` | payout ledger for one provider |
| POST | `/admin/payouts/{ledger_id}/mark-paid` | mark a payout as settled |
| GET | `/admin/dashboard/stats` | headline counts: bookings today, active providers, pending approvals, revenue today/month |
| GET | `/admin/settings` | fetch all CMS settings |
| PATCH | `/admin/settings` | update settings (support phone, contact email, visit charge, commission %, etc.) |

---

## 7. Business Logic Services (what lives in `services/`, not routers)

- **auth_service** — OTP generation/hashing/expiry, JWT issuing, admin password auth.
- **booking_service** — checkout → booking creation, status transition validation (no skipping steps), OTP generation at assignment, cancellation rules (enforces the 30-minute free cancellation threshold), OTP verification validation (checks matching OTP and tracks failed attempts, limiting to 3 retries).
- **provider_service** — availability toggle, nearest-provider matching for job dispatch, approval/rejection side-effects (e.g. notify provider).
- **commission_service** — on booking completion, computes `platform_commission_amount` and `provider_payout_amount` from the provider's (or global) commission percentage, writes to `commission_ledger`.
- **payment_service** — payment status updates, COD vs UPI confirmation logic, integration with Razorpay to generate dynamic UPI QR codes.
- **review_service** — creates review + review_images, recalculates `provider_profiles.average_rating`.
- **notification_service** — creates notification records; later wires into FCM/SMS.

Keeping these separate from routers is what lets the admin panel later call `booking_service.get_booking_detail()` or `commission_service.get_earnings_summary()` directly from new `/admin/*` routers — **without touching or duplicating the core logic.**

---

## 8. Provider Approval Workflow

1. Provider registers via app → `provider_profiles.status = pending`. Login is blocked at `pending`.
2. Admin reviews via `/admin/providers` (or manually adds one directly, auto-approved).
3. Admin calls `/admin/providers/{id}/approve` → status → `approved`, `approved_by` + `approved_at` set → provider can now log in and go online.
4. Admin can `/admin/providers/{id}/suspend` at any time to revoke access without deleting history.
5. All status changes are timestamped for audit — nothing is a silent flag flip.

---

## 9. Commission & Earnings Logic

- `app_settings.default_commission_percentage` acts as the fallback rate; `provider_profiles.commission_percentage` can override it per provider (useful later for tiered/negotiated rates).
- On booking `completed` + payment `paid`, `commission_service` writes one row to `commission_ledger`, snapshotting the rate used (so later rate changes never retroactively alter historical records).
- `/admin/earnings/summary` aggregates: total service revenue, total platform commission, total provider payouts (pending vs paid) — directly answering "total earnings vs total commission payouts" from the requirements.

---

## 10. Notes for Emergent AI (build instructions)

- Build the FastAPI backend using the folder structure in Section 3 exactly — routers thin, business logic in `services/`.
- Implement `role` as a single enum on `users`, not separate tables per role — this is what allows one shared API surface.
- Every admin-only route must use a `require_role("admin")` dependency; every provider route `require_role("provider")`; every service-needer route `require_role("service_needer")`. Shared routes (like `/bookings/{id}`) should check role internally and scope/permit access accordingly rather than blocking by role.
- Use UUIDs as primary keys (not auto-increment ints) — safer once a public-facing admin panel exposes IDs in URLs.
- All monetary fields are `decimal`, never float.
- Snapshot prices/commission rates at transaction time (already reflected in schema) — never compute historical totals from current catalog/commission values.
- Version the API under `/api/v1` from day one so the admin panel and any future app updates don't break each other.
- Store OTPs and passwords hashed — never plaintext, even in a dev/MVP build.

---

## 11. What This Enables for the Admin Panel (later)

When you build the React admin panel, it will:
- Reuse `/auth/admin/login`, `/auth/refresh`, `/auth/me` as-is.
- Reuse `/admin/*` namespace endpoints directly — no backend changes required.
- Optionally reuse shared endpoints like `/bookings/{id}` and `/providers/{id}/reviews` for read-heavy dashboard views, since admin already has elevated access built into the service layer.

This is the entire point of designing it this way now: **the admin panel becomes a pure frontend build against an already-complete API**, not a second backend effort.