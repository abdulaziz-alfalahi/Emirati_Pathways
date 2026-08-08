# Mobile app — v1 scope

**Status:** proposal, not yet approved
**Drafted:** 2026-08-08
**Companion document:** `api_versioning_plan.md` — the app cannot ship without it.

---

## 1. The decision this document assumes

A **candidate-only** native app, built in React Native (Expo), shipped **before** the mass onboarding campaign rather than after it.

The sequencing is the load-bearing part. Onboarding is a one-time event per person. Land 150,000 people in the web app and you have put them in a channel you cannot reach them through; moving them to an app afterwards means running the acquisition twice, at a worse conversion rate the second time.

## 2. Who it is for

**In:** the ~150,000 Dubai nationals aged 15+ the platform is targeting.

**Out:** every staff role. Recruiters, HR, career-services agents, assessors, advisors, education and community operators, board members. They work at desks, with caseloads, on screens the size of a desk. The web platform serves them and will continue to.

This is not a phase-one simplification. Operator functionality is permanently out of scope for the app. Guarding that boundary is what keeps this a six-month project instead of a two-year one.

## 3. What justifies a native app over the web

Three things, in order of weight:

**UAE Pass app-to-app.** On mobile, UAE Pass authenticates app-to-app: tap, switch, biometric, return. Against the web redirect chain candidates go through today, this is the single largest reduction in onboarding friction available — and onboarding friction is the bottleneck. Of 5,310 candidates in the CRM, **36 have ever logged in**.

**Push.** The wake-up mechanism. An Emirates ID identifies someone; it does not reach them. Push is what replaces the phone number, and it is why the app exists at all.

**CallKit / ConnectionService.** The OS can wake the app and ring it on the lock screen with the platform's name attached. This is the prerequisite for in-platform voice calling — the WebRTC side already exists in LiveKit; the ability to make a phone ring does not.

Secondary: biometric re-auth instead of repeating UAE Pass every session, camera capture for certificates, and app-store presence as a legitimacy signal for a government service.

**What it does not do:** help first contact. Installing an app is *more* friction than opening a URL for someone who has never heard of you. The outsourced call centre remains the on-ramp. The app wins on the second through two-hundredth interaction.

## 4. Screens

Roughly twenty screens across eight areas. Endpoint columns reference the surface to be frozen as `/api/v1` (see the companion document).

### 4.0 Shell

Bilingual AR/EN with RTL. Auth guard, offline and error states, forced-upgrade gate on launch.

Direction is set at login and not offered as a mid-session toggle — React Native's `I18nManager` requires an app reload to flip, and a toggle that restarts the app reads as a crash. Language is changed in Settings, with an explicit "this will restart the app" confirmation.

| | endpoint |
|---|---|
| Forced upgrade check | `GET /api/v1/client-status` |

### 4.1 Launch and authentication

| Screen | Notes |
|---|---|
| Splash + language | First launch only; thereafter remembered |
| UAE Pass sign-in | App-to-app via the UAE Pass mobile SDK, with in-app browser fallback where the UAE Pass app is not installed |
| Biometric enrolment | Opt-in, offered *after* the first successful login, never before |
| Push permission | Asked after the first moment of value — a job match or a message — never on launch. Asking cold is how you get a permanent denial |

| | endpoint |
|---|---|
| Sign in | `GET /api/auth/uaepass/login` → `/api/auth/uaepass/callback` |
| Session refresh | `POST /api/auth/refresh` |
| Sign out | `POST /api/auth/uaepass/logout` |
| Identity | `GET /api/auth/uaepass/profile` |

`/api/auth/login`, `/api/auth/register` and `/api/auth/setup-mfa` are the legacy password path and must **not** be part of the published surface — UAE Pass is the sole login. Neither must `/api/auth/uaepass/dev-login` or `/api/auth/uaepass/dev-login/users`.

Session handling is already close to ready: 1-hour access tokens, 30-day refresh, the UAE Pass callback issues both, and `JWT_TOKEN_LOCATION` already accepts `headers`. The app flow needs the tokens returned in the response body rather than only set as cookies.

### 4.2 Home

One screen, and the most important one in the app. Not a menu — a state summary answering "what should I do next".

Next best action, application status at a glance, new match count, unread messages, upcoming interview.

| | endpoint |
|---|---|
| Summary | `GET /api/candidate/dashboard/stats` |
| Match count | `GET /api/candidate/job-matches` |
| Unread messages | `GET /api/communication/conversations` |

### 4.3 Jobs

| Screen | Endpoint | Note |
|---|---|---|
| Matches | `GET /api/jobs/matches` | also `/api/candidate/job-matches` — **duplicate** |
| Job detail | `GET /api/jobs/<job_id>` | |
| Apply | `POST /api/jobs/<job_id>/apply` | also `/api/jobs/apply`, `/api/applications/apply` — **triplicate** |
| Save / unsave | `POST /api/jobs/<job_id>/save`, `/unsave` | also `/api/candidate/saved-jobs` — **duplicate** |
| Saved list | `GET /api/jobs/saved` | also `/api/candidate/saved-jobs` — **duplicate** |
| My applications | `GET /api/applications/my-applications` | also `/api/jobs/applications`, `/api/candidate/applications` — **triplicate** |
| Application detail | `GET /api/applications/<application_id>` | |
| Status history | `GET /api/applications/<application_id>/status` | see note below |
| Withdraw | `POST /api/applications/<application_id>/withdraw` | also two other variants |

**No route exposes an application timeline.** Migration 041 created the timeline table and the `record_status_change` hook, but nothing matching `*timeline*` is registered. Before this screen is designed, confirm whether the history is embedded in `/api/applications/<id>/status` or simply not yet exposed.

The duplicate operations above are not cosmetic — see §7.1.

The match score must be presented exactly as the web presents it — one canonical scorer (`backend/match_scoring.py`), no geography factor, no flat nationality bonus, commute informational, national priority as a separately disclosed axis. A second, mobile-flavoured explanation of the score is how the two surfaces drift apart and how the number stops being defensible.

### 4.4 Profile and career passport

| Screen | Endpoint |
|---|---|
| Overview | `GET /api/v2/profile/` |
| Readiness | `GET /api/v2/profile/readiness` |
| Edit identity | `PUT /api/v2/profile/identity` |
| Education (add/edit/delete) | `/api/v2/profile/education[/<edu_id>]` |
| Experience (add/edit/delete) | `/api/v2/profile/experience[/<exp_id>]` |
| Completion, photo, preferences | `/api/profile/candidate/completion`, `/photo`, `/preferences` |
| Availability | `/api/profile/availability` — also `/api/candidate/profile/availability` (**duplicate**) |
| Documents | camera capture → `POST /api/cv/upload` |
| Career passport | `GET /api/career-passport/passport`, `/stamps` |
| CV list / view / export | `GET /api/cv/list`, `/api/cv/<cv_id>`, `/api/cv/<cv_id>/export/<format>` |

Those profile endpoints are the ten-rule `/api/v2/profile/*` island; the versioning plan folds them into `/api/v1`.

Note that `/api/cv/*` also carries `debug-auth`, `debug-list/<user_id>` and `debug-stats`. These must not appear in a published surface, and `debug-list/<user_id>` taking an arbitrary user id should be checked for a missing ownership guard before anything freezes.

The CV **builder** stays on the web. It is a long-form document editor and it is the wrong thing to do first on a phone. The app views, downloads and shares the CV, and deep-links to the web builder for editing.

### 4.5 Messages

| Screen | Endpoint |
|---|---|
| Conversation list | `GET /api/communication/conversations` |
| Conversation + history | `GET /api/communication/conversations/<conversation_id>/messages` |
| Send | `POST /api/communication/messages` |
| Mark read | `POST /api/communication/conversations/<conversation_id>/read` |

The existing authorization policy — candidates message staff, not each other — is enforced server-side and needs no mobile-specific work.

### 4.6 Notifications

| Screen | Endpoint |
|---|---|
| Inbox | `GET /api/v1/communication/notifications` |
| Mark read / all read | `POST …/<id>/read`, `…/mark-all-read` |
| Preferences | `GET|PUT …/notifications/preferences` |

Push delivery hooks into `backend/notification_helper.py`, which every notification already routes through — one integration point, not twenty.

### 4.7 Interviews

| Screen | Endpoint |
|---|---|
| Upcoming | `GET /api/interviews/sessions/my` |
| Detail | `GET /api/interviews/sessions/<session_id>` |
| Join | `/api/video-interview/*` → LiveKit |

**Blocked.** External WebRTC media does not currently traverse the firewall (issue #308, with Moro). Build the list and the detail screen; the join button ships dark until that opens.

### 4.8 Settings

Language (with restart confirmation), biometrics, notification preferences, sign out, app version and build.

Data-subject rights are already served and should be surfaced here rather than rebuilt — both stores require a working in-app account-deletion path, and this satisfies it:

| | endpoint |
|---|---|
| Consents held | `GET /api/auth/consents/me` |
| Export my data | `POST /api/auth/dsr/export` |
| Delete my account | `POST /api/auth/dsr/erase` |

## 5. Explicitly out of scope for v1

Cut, and to be defended as cut: CV Builder, the LMS, assessments, the gig marketplace, startup launchpad, communities, mentorship, the Education Pathway browse pages, scholarships, analytics dashboards, financial planning — and every operator, recruiter, HR, board and CRM surface.

Reasonable **v2** candidates, in rough priority order: mentorship, training and credentials, scholarships browse, communities.

## 6. Technology

**React Native with Expo.** The team is React and TypeScript; the API client, types, i18n strings, validation and business logic carry across, and Expo's over-the-air updates for JS-only changes materially soften the store-review cycle.

One expectation to set firmly, because it will otherwise be assumed: **the frontend is not reused.** Tailwind and shadcn do not run in React Native. What carries over is the language and the logic — realistically 20–30%, almost none of it visual. An estimate built on "we already have the React code" is wrong by roughly a factor of three.

Rejected: Flutter (better runtime, but Dart is a new skill and nothing carries over), fully native (twice the work, two skill sets the team does not have), PWA (cheapest, but gives up app-to-app UAE Pass, CallKit and store presence — the three things that justify doing this at all).

## 7. Backend prerequisites

### 7.1 Pick one implementation per operation — first

Mapping the screens above against the live URL map turned up that the core candidate operations each exist **two or three times over**:

| operation | implementations |
|---|---|
| apply to a job | `/api/jobs/<id>/apply`, `/api/jobs/apply`, `/api/applications/apply` |
| list my applications | `/api/jobs/applications`, `/api/applications/my-applications`, `/api/candidate/applications` |
| withdraw | `/api/jobs/applications/<id>/withdraw`, `/api/applications/<id>/withdraw`, `/api/candidate/applications/<id>/withdraw` |
| save a job | `/api/jobs/<id>/save`, `/api/candidate/saved-jobs` |
| list saved jobs | `/api/jobs/saved`, `/api/candidate/saved-jobs` |
| job matches | `/api/jobs/matches`, `/api/candidate/job-matches`, `/api/matching/visible/top-vacancies` |
| availability | `/api/profile/availability`, `/api/candidate/profile/availability` |

On the web this is untidy but survivable — whichever one the frontend calls is the one that matters, and both are deployed together.

**On a phone it is not survivable.** Freezing the contract means choosing one, and choosing wrong means 150,000 devices calling a duplicate that nobody maintains, whose behaviour silently diverges from the one the web uses. It is also a live risk today: if two apply endpoints write applications differently, the record depends on which client you used.

So the first task is not versioning. It is deciding which implementation is canonical for each row above, confirming the others are equivalent or reconciling them, and pointing the web at the winner. Only then is there a contract worth freezing.

### 7.2 Prerequisites

Both must land before the app ships; neither depends on the app to be worth doing.

1. **A frozen `/api/v1` surface with contract tests.** See the companion document. 908 endpoints exist; roughly 205 are candidate-facing; the app's own surface is smaller still.
2. **A device-token registry and APNS/FCM send path.** Entirely greenfield — no device token table exists anywhere in the schema.

And two that are not optional:

3. **Rotate `JWT_SECRET_KEY`.** The application logs `CRITICAL: JWT_SECRET_KEY appears low-entropy/known` on every boot. With 30-day refresh tokens on 150,000 phones, a guessable signing key is an authentication bypass against the entire population, and rotating it later invalidates every session on every device simultaneously.
4. **Guarantee dev-login is impossible in production.** `POST /api/auth/uaepass/dev-login` mints a valid session for any Emirates ID with no proof of identity. It is correctly enabled on staging; it needs a startup assertion that refuses to boot with it enabled under `FLASK_ENV=production`.

**Capacity, needing a decision:** Socket.IO runs on a single gunicorn worker, forced by gevent. That is survivable for the web at current usage. It will not hold persistent connections from a mobile population at target scale. Either it becomes a Redis-backed multi-worker setup, or the app goes push-only and drops the socket — which for a battery-powered device is arguably the better design regardless.

## 8. Dependencies outside engineering

- Apple and Google developer accounts under the government entity. Procurement plus legal review of the store agreements, and this consistently takes longer than anyone budgets. **Start first** — it gates release, not development.
- Dubai government digital-service standards, and possibly TDRA requirements, for a public-sector app. Needs confirming with the relevant authority early, for the same reason.
- Bilingual store listings, screenshots, privacy policy and support content.
- A legal position on the data an app collects from users aged 15–17, including push consent.

## 9. Definition of done for v1

- A candidate can install the app, authenticate with UAE Pass app-to-app, and complete a job application without touching the web.
- Push reaches a backgrounded device and deep-links to the right screen.
- Contract tests gate every `/api/v1` endpoint the app calls.
- Forced upgrade works — a build below `min_supported_version` is blocked.
- Full AR and EN parity including RTL layout.
- Store listings live in both languages on both platforms.

The interview join button is explicitly **not** in this list. It ships when the firewall does.
