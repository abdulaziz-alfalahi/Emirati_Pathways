## Prompt: Implement Recruiter Magic Link → UAEPass Onboarding Flow

**Context:** UAEPass is now integrated into the platform. I need you to implement the Recruiter onboarding flow that was designed in our earlier session.

**Reference:** Review the approved implementation plan at:
`C:\Users\user\.gemini\antigravity\brain\63fd0989-6e66-445e-9496-d97110a2fde9\implementation_plan.md`

**What to implement (Journey B from the plan):**

1. **`/join/{token}` route (Frontend):** When a Recruiter clicks a magic link, validate the token against `company_invitations`, then redirect to UAEPass sign-in (passing the `invitation_token` in session state so it survives the OAuth redirect).

2. **UAEPass callback handler (Backend):** After UAEPass authentication, merge the UAEPass-verified identity (name, Emirates ID, phone, email) with the invitation data (company, sector, vacancies) and return the merged payload to the frontend.

3. **Confirmation page (Frontend):** Show a pre-filled confirmation page with UAEPass data + company data. The only user input is a **role selection dropdown** (Recruiter or HR Manager). On submit, call `accept_company_invitation()`.

4. **Update `accept_company_invitation()` in `backend/growth_system.py`:** Modify to accept UAEPass-verified identity fields instead of manually-entered data. Link the new user account to their UAEPass ID (`emirates_id`). Remove the OTP/password fallback for this flow.

5. **Auto-login:** After successful registration, issue a JWT immediately and redirect to the Recruiter Dashboard with NAFIS jobs pre-populated (this part already works via the existing `auto-assign` logic in `growth_system.py:642-651`).

6. **Spam prevention:** In the NAFIS Import tab (`NafisVacancyImport.tsx`), add per-row dedup status badges (🟢 New, 🟡 Invite Pending, 🔵 Already Onboarded, 🔴 Error) and grey out already-onboarded rows.

7. **Replace `_mock_send_email()`** in `growth_system.py` with the real email provider (SendGrid or SMTP) using the approved email template from the plan.

**Key files to modify:**
- `backend/growth_system.py` — `accept_company_invitation()`, `_mock_send_email()`
- `frontend/src/pages/public/SeekerOnboardingWizard.tsx` or new `/join` page
- `frontend/src/components/growth-operator/NafisVacancyImport.tsx` — dedup badges
- Whatever UAEPass auth module exists by then (check for `uaepass` in the codebase)
