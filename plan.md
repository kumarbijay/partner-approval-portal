# Project Plan: External Partner Management Portal

This document outlines the step-by-step implementation plan for the **External Partner Management Portal** for **Dr. Reddy's**. It is structured for execution in an IDE.

---

## 1. Project Directory Structure
We will organize the project into `backend` and `frontend` folders:
```
partner-approval-portal/
├── plan.md                                # This plan
├── backend/                               # ASP.NET Core 8 Web API
│   ├── PartnerApprovalPortal.API.csproj
│   ├── Program.cs
│   ├── appsettings.json
│   ├── Data/                              # EF Core DbContext
│   ├── Models/                            # Entities (Partner, ApprovalHistory, AuditLog)
│   ├── DTOs/                              # Data Transfer Objects
│   ├── Services/                          # Business logic & AI Services
│   └── Controllers/                       # Web API Controllers
└── frontend/                              # React + Vite + TypeScript + CSS
    ├── package.json
    ├── index.html
    ├── src/
    │   ├── main.tsx
    │   ├── App.tsx
    │   ├── index.css                      # Premium Design Tokens & Base Styles
    │   ├── components/                    # Reusable UI Components
    │   └── pages/                         # Core Screens (List, Form, Review)
```

---

## 2. Technical Decisions
- **Backend**: ASP.NET Core 8 Web API (C#).
- **Database**: SQLite (file-based, stored locally as `partners.db` in the backend folder).
- **ORM**: Entity Framework Core.
- **Frontend**: React 18, Vite, TypeScript, and Premium Vanilla CSS (custom variables, modern glassmorphic look, responsive).
- **AI Service**: Integration with Gemini/OpenAI REST API.
  - *Fallback Strategy*: If no API key is configured or the request fails, the service will fall back to rule-based static suggestions and regex validation.
- **Hosting Strategy**:
  - **Frontend**: Deployed to **Vercel** (free tier).
  - **Backend**: Run **locally** for the demo. To connect the Vercel frontend to the local backend, we can use `ngrok` or compile a mock-API toggle in the frontend for showcase purposes without a running backend.

---

## 3. Implementation Phases & Checklist

### Phase 1: Backend Setup & Core API
- [ ] **Step 1.1: Initialize ASP.NET Core Web API Project**
  - Run: `dotnet new webapi -n PartnerApprovalPortal.API -o backend`
  - Add EF Core and SQLite NuGet packages:
    - `Microsoft.EntityFrameworkCore.Sqlite`
    - `Microsoft.EntityFrameworkCore.Design`
- [ ] **Step 1.2: Define Database Models**
  - `Partner`: Id, Name, Email, Phone, Organization, Category, Address, Status (Draft, Submitted, Approved, Rejected), CreatedDate, UpdatedDate.
  - `ApprovalHistory`: Id, PartnerId, OldStatus, NewStatus, Comment, ChangedBy, ChangedOn.
  - `AuditLog`: Id, PartnerId, Action, User, Timestamp, Details.
- [ ] **Step 1.3: Configure DbContext and Database Connection**
  - Implement `ApplicationDbContext`.
  - Configure SQLite in `Program.cs` and connection string in `appsettings.Development.json`.
  - Create and run initial migration:
    - `dotnet ef migrations add InitialCreate`
    - `dotnet ef database update`
- [ ] **Step 1.4: Implement Services and Controllers**
  - Create `PartnerController` with endpoints:
    - `GET /api/partners` (with optional status/search filters)
    - `GET /api/partners/{id}`
    - `POST /api/partners` (creates in `Draft` status)
    - `PUT /api/partners/{id}` (only allowed for `Draft` or `Rejected` partners)
    - `POST /api/partners/{id}/submit` (moves status to `Submitted`)
    - `POST /api/partners/{id}/approve` (requires comment, Reviewer role, moves to `Approved`)
    - `POST /api/partners/{id}/reject` (requires comment, Reviewer role, moves to `Rejected`)
    - `GET /api/partners/{id}/history` (retrieves approval logs)

### Phase 2: AI Integration Service
- [ ] **Step 2.1: Implement AI Controller and Service**
  - Create endpoints:
    - `GET /api/ai/suggest-category?description=...`
    - `POST /api/ai/normalize-address` (accepts free-form text, returns structured address DTO)
- [ ] **Step 2.2: Build AIService**
  - Create a client calling Gemini API or OpenAI API using HTTP Client.
  - Implement fallback heuristics:
    - If API key is missing or calls fail, use keyword mapping to suggest categories (e.g., "clinical" -> "Medical Research", "ship" -> "Logistics & Distribution").
    - Use simple parsing rules to split addresses (e.g., comma-separated splitting for street, city, country) for normalization.

### Phase 3: Frontend Setup & Premium CSS Design System
- [ ] **Step 3.1: Scaffold React App**
  - Run: `npm create vite@latest frontend -- --template react-ts`
- [ ] **Step 3.2: Create CSS Design System (`index.css`)**
  - Set up CSS variables for colors (vibrant blues/teals for Dr. Reddy's corporate vibe, dark slate neutral background), fonts, shadows, transitions.
  - Build premium UI elements: glassmorphic cards, glowing buttons, smooth hover animations, custom input fields, and status badges (green for Approved, orange for Submitted, gray for Draft, red for Rejected).
- [ ] **Step 3.3: Build Common Layout and Role Switcher**
  - Create a Top Navigation Header with a simulated role switcher dropdown ("Initiator/Employee" vs "Reviewer/Approver"). This avoids complex OAuth setup for the MVP but still demonstrates role-based behavior.

### Phase 4: Frontend Pages & Components
- [ ] **Step 4.1: Partner List Page**
  - Build a responsive table/card list displaying partners.
  - Include search, status filter, and quick action buttons.
- [ ] **Step 4.2: Partner Creation & Edit Form**
  - Design a comprehensive form with validation (email regex, phone validation).
  - Integrate AI triggers:
    - A "Suggest Category" button next to the Description/Organization field which queries the backend AI API.
    - An "Auto-Fill / Normalize" button for the freeform Address input to split it into City, State, Country.
  - Include "Save Draft" and "Submit for Approval" buttons.
- [ ] **Step 4.3: Review & Detail Page**
  - Displays partner information in read-only layout.
  - Underneath, show two tabs:
    - **Approval History**: Chronological list of state transitions with comments.
    - **Audit Log**: Audit tracking details.
  - If current user is a "Reviewer" and status is "Submitted", display the Approve and Reject actions with a text area for comments.

---

## 5. Verification Plan

### Automated Tests
- Run backend unit tests for services:
  - `dotnet test`

### Manual Verification
- **Scenario A (Initiator User)**:
  1. Switch role to "Employee".
  2. Create a partner, use the AI category suggestion, and click "Save Draft". Verify status is "Draft".
  3. Edit the partner, enter a free-form address, click "Normalize Address". Verify fields fill correctly.
  4. Click "Submit for Approval". Verify status changes to "Submitted" and it can no longer be edited.
- **Scenario B (Reviewer User)**:
  1. Switch role to "Reviewer".
  2. Select the submitted partner, review their history.
  3. Enter a comment and click "Approve" (or "Reject").
  4. Verify status updates, and the transition shows up in the history panel.
