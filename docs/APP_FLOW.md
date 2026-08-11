# this flow covers both client (service needer) and service provider's flow in one app

# AquaServe — Water Purifier Servicing App
### MVP Concept & End-to-End User Flow Document
*(Working name "AquaServe" — swap in your business owner's actual brand name before handing off)*

---

## 1. App Concept Overview

A single Android app, two roles, two completely different interfaces after login:

- **Service Needer** — a water purifier owner who wants to book installation, filter change, repair, or AMC service.
- **Service Provider (Technician/Partner)** — the mechanic who fulfills those bookings.

Role is chosen once at first launch and determines the entire navigation stack and UI from then on. Reference point: Urban Company's UX patterns, but simplified for a single-category (water purifier) business and re-skinned with a different visual identity.

**Where the business owner fits in:** the business owner (dealer) acts as the **Admin** for the whole system — assigning/reassigning jobs when needed, resolving edge cases, and overseeing providers and bookings. For the MVP phase, admin tasks can be handled manually (spreadsheet/WhatsApp) or through a lightweight internal tool. A dedicated **Admin Web App** is planned as a separate, later build — not part of this Android app — to give the owner a proper dashboard for managing providers, bookings, and payments.

---

## 2. Design Language

**Positioning:** simple, premium, fresh — approachable and clean, not clinical, not flashy. Avoid an exact Urban Company look (black/purple) — go with a palette that reads "clean water, trust, freshness."

| Token | Color | Use |
|---|---|---|
| Primary | `#0B6E68` Deep Teal | Header, nav active state, primary brand |
| Accent / CTA | `#F5A623` Warm Amber | Buttons, highlights, price tags |
| Background | `#F7FAF9` Soft Mist White | Screen backgrounds |
| Surface | `#FFFFFF` | Cards, sheets |
| Text Primary | `#1F2937` Charcoal | Headings, body |
| Text Secondary | `#6B7280` Slate Gray | Sub-text, meta info |
| Success | `#2E9E6D` | Confirmed, completed states |
| Error | `#E5484D` | Cancelled, errors |
| Warning | `#F5A623` | Pending, timers |

- **Typography:** Poppins or Inter — Semibold headings, Regular body.
- **Corner radius:** 16–20px cards, 12px buttons — soft and approachable.
- **Icons:** 2px line icons, filled only when active.
- **Shadows:** soft, subtle elevation instead of hard borders — airy, generous white space.

---

## 3. Shared Onboarding Flow (both roles)

1. **Splash Screen** — logo + tagline, auto-advances after ~1.5s.
2. **Role Selection** — two large tappable cards: *"I need a service"* (Service Needer) vs *"I provide service"* (Technician).
3. **Login / Register** — phone number → OTP verification (no passwords, keeps MVP simple).
   - New Service Needer → just name.
   - New Provider → name + service categories they handle + service area/locality + (optional in MVP) ID proof upload for later admin verification.
4. **Location Permission** — "Allow location to find services/technicians near you," with a plain-language reason, Allow / Enter Manually.
5. **(Provider only, optional for MVP)** — "Verification pending" screen if you want manual admin approval before a provider can go live. Can be skipped in v1 and verified over WhatsApp/admin panel instead.

---

## 4. Service Needer App Flow

**Bottom Nav:** `Home` · `Bookings` · `Cart` · `Account`

### 4.1 Home
- Top bar: current location (tappable to change) + notification bell + brand logo.
- Search bar: "Search for RO service, filter change, repair…"
- Hero banner carousel: offers, "Filter change starting ₹XXX," "Same-day repair."
- Category quick-action row (icon cards): Installation · Filter Change · Repair · AMC/Maintenance · General Service.
- "Service providers near you" — horizontal scroll cards: photo, name, rating, distance, tags, starting price.
- "My upcoming booking" — compact status card if one exists, tap-through to detail.

### 4.2 Service Selection → Service Detail
- Tapping a category/provider opens a Service Detail screen: description, price, duration estimate, what's included.
- Actions: **Add to Cart**, **Book Now**, wishlist heart icon.

### 4.3 Cart
- List of added services with quantity/price.
- Empty-state illustration when empty.
- "Proceed to Checkout" with running subtotal.

### 4.4 Checkout
- Date picker (calendar).
- Time slot picker (Morning / Afternoon / Evening or specific slots).
- Address confirmation (auto from location, editable).
- Additional notes field ("Describe the issue / purifier model").
- Billing breakdown card (service charge, visit charge, taxes, total).
- Payment method: COD or UPI (Razorpay setup).
- "Confirm Booking" CTA.

### 4.5 Booking Confirmation
- Success check animation, Booking ID, summary.
- "View Booking" / "Back to Home."

### 4.6 Bookings Tab
- Segmented: **Upcoming** | **Past**.
- Upcoming card: status stepper (Confirmed → Provider Assigned → On the way → In Progress → Completed), ETA, provider name/photo/phone, reschedule/cancel option.
- Past card: summary, amount paid, invoice download, "Rate & Review" (if pending), "Book Again."

### 4.7 Live Booking / Tracking Screen
- MVP version (no live GPS map): status stepper + "Technician is arriving, ETA: X mins" + Call icon + provider mini-profile card.
- *(Phase 2: real map with live provider location.)*

### 4.8 OTP-to-Start-Service Screen
- Once the provider taps "Arrived" on their end, the service needer sees a large 4-digit OTP with the instruction "Share this code with your technician to begin the service." This is the authenticity check that the right person, at the right time, is starting the job.

### 4.9 Service Completion → Payment → Rating
- "Service Completed" confirmation screen. (service provider will mark with his device then it will show here)
- If COD: payment confirmation step (cash or pay-now via UPI).
- Rating & feedback: star rating + optional comment + quick tags (punctual, professional, quality of work).
- Booking then moves into the Past tab.

### 4.10 Account Tab
- Profile info, saved addresses, payment/transaction history, wishlist, help & support (leads to WhatsApp contact and email ID), notification settings, logout.

---

## 5. Service Provider (Technician) App Flow

**Bottom Nav:** `Jobs` · `Schedule` · `Earnings` · `Account`
*(same 4-tab rhythm as the service needer app for visual consistency, different content)*

### 5.1 Jobs / Home
- Top bar: **Online/Offline availability toggle** — a provider must be "Online" to receive job requests.
- Today's snapshot card: jobs today, next job time.
- New job request card (auto-assigned to nearest available provider): service type, service needer's locality (not full address until accepted), scheduled time, payout estimate, **Accept / Reject with a 2 minutes countdown timer** — mirrors Urban Company's partner-app pattern, keeps dispatch simple and fast.

### 5.2 Schedule Tab
- Tabs: **Today** | **Upcoming** | **Completed**.
- Job card → Job Detail screen:
  - Service Needer name, call icon, full address with a "Navigate" button (deep-links to Google Maps).
  - Service details and the service needer's notes.
  - Status actions in sequence: **Start Journey → Mark Arrived → Enter OTP → Start Service → Mark Complete.**
  - Optional MVP+: attach a photo of completed work.
  - Payment collection step: "Mark Cash Collected" or "Confirm UPI Received." For COD, if the client wants to pay by UPI, the service provider can show a dynamic QR code for the specific amount using Razorpay.

### 5.3 Earnings Tab
- Today / This Week / This Month summary cards.
- Transaction list: job, date, amount, payment mode.
- *(Phase 2: payouts to bank account, incentive tracking.)*

### 5.4 Account Tab
- Profile (photo, name, phone, service categories, service radius), KYC/document status, ratings received + review list, help & support (leads to WhatsApp contact and email ID), logout.

---

## 6. End-to-End Journey Maps

**Service Needer:**
Splash → Role Select → OTP Login → Location Permission → Home → Browse/Search → Service Detail → Cart → Checkout (date/slot/notes/payment) → Confirmation → Bookings (status updates) → Provider Assigned notification → Tracking/ETA → Provider Arrives → Share OTP → Service In Progress → Completed → Payment (if COD) → Rate & Review → Moves to Past.

**Provider:**
Splash → Role Select → OTP Login + basic profile → Location Permission → Toggle Online → Receive Job Request → Accept (within timer) → Job in Schedule → Start Journey → Navigate → Mark Arrived → Ask Service Needer for OTP → Enter OTP → Service In Progress → Mark Complete → Collect Payment → Job moves to Completed, Earnings updated.

---

## 7. Notifications Matrix

| Event | Service Needer sees | Provider sees |
|---|---|---|
| Booking confirmed | "Booking confirmed for [date]" | — |
| Provider assigned | "Rajesh has been assigned, arriving by X" | "New job assigned" |
| Provider en route | "Your technician is on the way" | — |
| New job broadcast | — | "New service request nearby" |
| Service completed | "Rate your experience" | "Job marked complete" |
| Payment received | "Payment of ₹X received" | "Payment collected" |
| Cancellation | Notified | Notified |

---

## 8. Edge Cases & Business Rules to Define with the Business Owner

- **No provider available nearby:** show "No technicians available right now, we'll notify you" and still allow booking for manual admin assignment.
- **Cancellation policy:** define whether a visit charge applies once a provider is assigned, and any free-cancellation cutoff window. (No cancellation fee within 30 mins of booking)
- **Provider doesn't respond to a job request:** auto-reassign to the next nearest available provider once the timer expires.
- **OTP mismatch:** block "Start Service" until the correct code is entered; allow the service needer to resend/regenerate it. (maximum 3 retries)
- **COD payment dispute:** provider can mark "Payment Pending," which flags the booking to admin.
- **Reschedule:** allow service needer rescheduling up to a defined cutoff (e.g., 3 hours before slot), subject to provider availability.

---

## 9. MVP Scope vs Phase 2

**Build now (MVP):**
- OTP-based role auth, basic profiles.
- Service Needer: fixed service catalog, cart, checkout, COD + UPI, booking status tracking, OTP-gated service start, rating.
- Provider: availability toggle, accept/reject with timer, job detail, OTP entry, mark complete, basic earnings log.
- Simple admin process (even a lightweight panel or manual spreadsheet) to handle edge cases like no-provider-available.

**Phase 2 (later):** not now
- Live GPS map tracking.
- AMC subscription plans.
- Wallet & payouts, provider incentives/leaderboard.
- Service Needer-side marketplace browsing (choose from multiple providers, like Urban Company proper).
- Push notifications via FCM + SMS.
- **Next-service-due reminders** — genuinely valuable here since filters need periodic replacement; a good retention hook once MVP is stable.

---

## 10. Full Screen List (developer reference)

**Shared:** Splash · Role Select · Login/OTP · Location Permission

**Service Needer:** Home · Search Results · Service Detail · Cart · Checkout · Booking Confirmation · Bookings List · Booking Detail/Tracking · OTP Display · Payment · Rating & Feedback · Account · Edit Profile · Saved Addresses · Help/Support

**Provider:** Jobs/Home · Job Request (accept/reject) · Schedule (Today/Upcoming/Completed) · Job Detail · OTP Entry · Mark Complete · Payment Collection · Earnings · Account · Edit Profile/KYC · Ratings & Reviews · Help/Support