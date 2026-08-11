# Workspace Rules & Instructions for Code Generation Agents

This workspace contains the complete specifications for **AquaServe** (mobile app and backend). Any agent working in this repository must adhere to the following instructions:

## 1. Project Specifications Source of Truth
* All code architecture, styling tokens, page flows, and database schemas must be based strictly on the documents located in the `/docs` folder:
  1. [APP_FLOW.md](docs/APP_FLOW.md) — Core user journeys and business logic rules.
  2. [UI_design.md](docs/UI_design.md) — Screen-by-screen layout specifications and styling tokens.
  3. [Aquaserve backend architecture.md](docs/Aquaserve backend architecture.md) — DB models, API maps, and service-layer behaviors.

## 2. Environment Variables & Credentials Setup
* **Mandatory `.env` Configuration:** Before generating the execution logic, compile a `.env` template file (`.env.example`) and create a local `.env` file at the backend root containing variables for all external service dependencies:
  * **Firebase Auth:** Credentials/config keys for phone-number OTP authentication.
  * **Cloudinary:** Cloud name, API key, and API secret for file and image uploads.
  * **Razorpay:** API Key ID and Key Secret for processing payments and generating dynamic UPI QR codes.
  * **Database Connection:** DB user, password, host, port, and database name.
  * **JWT Security:** A secure JWT secret key and token expiry configurations.
* **Mock Implementations:** If live keys are not supplied during validation/testing, build fallback mock implementations for Firebase OTP verification, Cloudinary upload, and Razorpay QR code payload generation so the application is fully testable out-of-the-box.


Please read the documentation in /docs and the instructions in .agents/AGENTS.md to build the app AquaServe application.