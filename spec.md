Nice, this is turning into a real product now 😄
Below is an **updated, hand-over-ready spec** for your Angular + Firebase devs, with:

* Email/Google-only auth
* Two roles: **patient** & **provider**
* Providers can search & “view as” patient
* Tailwind + ultra-simple UI for elders

You can paste this into a doc or Jira as-is.

---

# 1. Project Overview (Updated)

**Working name:** Elder Chronic Care Companion
**Platform:** Angular PWA + Firebase
**Primary goal:**
Help elderly people with hypertension/diabetes (patients) and **providers** (doctors/clinics/pharmacies) manage and review daily health data with simple, actionable guidance.

**User roles:**

1. **Patient** – records own readings & habits, views status & actions.
2. **Provider** – can search/select assigned patients and **view their data as if logged in as them**, optionally record entries on their behalf.

No ML in MVP – all logic is rule-based.

---

# 2. Tech Stack

* **Frontend:** Angular 16+ (TypeScript)
* **UI:** TailwindCSS (no Angular Material in MVP)
* **State/Data:** Angular services + RxJS
* **Backend:** Firebase

  * Firebase Authentication (Email/Password & Google only)
  * Cloud Firestore (primary DB)
  * Firebase Hosting (PWA)
  * Cloud Functions (optional – not required for MVP)
* **PWA:** Angular Service Worker, offline-first
* **Analytics:** Firebase Analytics or GA4

---

# 3. User Roles & Permissions

## 3.1 Roles

* `role: 'patient' | 'provider'`

### Patient

* Can:

  * Edit own profile.
  * Record/edit own daily entries.
  * View own status, history, insights.
  * Generate/share summaries.
  * Link/unlink providers using a simple **share code**.

### Provider

* Can:

  * See a list/search of **linked patients**.
  * Select a patient and switch into **“Viewing as [Patient Name]”** context.
  * View all patient screens (Today, History, Insights) as read-only or with limited write (configurable below).
  * Optionally record entries on behalf of the patient (e.g., at clinic).

* Cannot:

  * Access patients who have not explicitly linked with them.
  * Modify patients’ account credentials.

---

# 4. Authentication & Onboarding

## 4.1 Auth Methods

Use Firebase Authentication with:

* **Email + Password**
* **Google Sign-In**

> ❌ No anonymous auth.

## 4.2 Signup Flow

1. User chooses **role**: “Patient” or “Provider”.
2. Chooses sign-up method:

   * Email/password or Google.
3. Completes minimal role-specific profile.

### Patient onboarding fields

* Display Name (e.g. “Mama Asha”)
* Year of birth (or age range)
* Conditions: Hypertension / Diabetes / Both
* (Optional) Phone
* Language: English / Swahili
* Auto-generated **share code** (e.g. 6–8 chars) used to link providers.

### Provider onboarding fields

* Full name
* Facility name (optional)
* Role/type: doctor/clinical officer/pharmacist/other (optional)
* (Optional) Phone
* Language: English / Swahili

---

# 5. Core Flows – Patient

(Same as before, but clarified)

## 5.1 Patient – Home / Today

* Shows:

  * Status card (Green/Yellow/Red + short explanation).
  * “Today’s Actions” (1–3 action bullets).
  * Primary button:

    * If no entry today: **“Record Today”**
    * If entry exists: **“Update Today”**
* Shortcuts: “History”, “Insights”.

## 5.2 Patient – Record Daily Entry

Fields (same as previous spec):

* BP: systolic, diastolic, time
* Sukari (glucose): value, context (Fasting / Random), time
* Medications: taken? (Yes/No), optional list
* Food: salt level (1–5), carb level (1–5), optional notes
* Exercise: minutes
* Alcohol: number of drinks
* Cigarettes: number of cigarettes
* Traditional herbs: simple text or chip input
* Notes: optional free text

On save:

* Compute **status**, **riskScore**, **statusReasons**, and **actions** on the client.
* Save to `users/{uid}/entries/{date}`.

## 5.3 Patient – History & Insights

Same as before:

* **History:** list of days with color icons, tap into day detail.
* **Insights:** simple summary and heuristics (streak, salt correlation, missed meds, exercise → lower BP).

---

# 6. Core Flows – Provider

## 6.1 Provider – Dashboard

After login:

* Screen: **“My Patients”**
* Elements:

  * Simple search input (**search by patient name or share code**).
  * List of linked patients (name, age range, conditions, last status color).
  * Button: **“Add patient”** (using share code).

## 6.2 Linking a Patient (Provider side)

1. Provider clicks **“Add patient”**.
2. Enters patient’s **share code** (patient shows or tells them).
3. App:

   * Checks existence of patient with that share code.
   * If found:

     * Creates mapping in Firestore: `providers/{providerId}/patients/{patientId}`.
     * Optionally writes patient profile with `linkedProviders` array including `providerId`.

Future: patient-confirmation screen can be implemented later if needed.

## 6.3 Provider – Patient Search

* Limited to **linked patients only**.
* Search by:

  * Patient display name.
  * Optional: last 4 chars of share code or phone (if stored & allowed).
* Implement as client-side filter over the fetched patient list for MVP.

## 6.4 Provider – “View as Patient” Mode

When provider selects a patient:

* Context changes to: `Viewing as: [Patient name]` (always visible banner).
* Navigation and screens behave like patient’s app, but with role-specific restrictions:

### Provider can:

* See:

  * Patient’s Today status & actions.
  * Full history & day details.
  * Insights.
  * Patient profile (non-credential info).

* Optionally record daily entries on behalf of the patient:

  * When they use the same **Record Today** form.
  * Entries created this way should include `createdByRole: 'provider'` and `createdByProviderId`.

### Provider cannot:

* Change patient email/password.
* Delete patient account.
* (Configurable) Edit patient thresholds unless allowed.

---

# 7. UI/UX Requirements (Tailwind + Simplicity)

## 7.1 General Principles

* Use **TailwindCSS** for all styling.
* UI must be **elder-friendly**:

  * Base font size ≥ 16px, important text 18–20px.
  * Buttons ≥ 48x48 px, clear labels, big hit areas.
  * Very few elements per screen.
  * High contrast, avoid low-contrast gray text.
* Navigation layout:

  * Simple bottom nav with 3–4 items max:

    * For patient: Today | History | Insights | Profile
    * For provider: Patients | (optionally Today/Insights for selected patient) | Profile

## 7.2 Example Tailwind Layout Patterns

* Page container: `max-w-md mx-auto px-4 py-4`
* Primary button: `w-full py-3 rounded-xl text-lg font-semibold`
* Status card:

  * Rounded box: `rounded-2xl p-4`
  * Color-coded background class:

    * Green: `bg-green-100 border border-green-300`
    * Yellow: `bg-yellow-100 border border-yellow-300`
    * Red: `bg-red-100 border border-red-300`
* Large inputs:

  * `text-lg py-2 px-3 rounded-xl border w-full`
* Stepper-style record form:

  * Either vertical sections with big headings or minimal stepper; no complex UX.

## 7.3 “Viewing as Patient” Banner

Always show on top when provider is viewing a patient:

* example Tailwind:
  `class="w-full bg-sky-100 text-sky-900 text-sm py-2 px-4 flex justify-between items-center"`

Text:
“Viewing as: [Patient name]”
Button: “Exit” → back to provider dashboard.

---

# 8. Data Model (Updated)

## 8.1 Firestore Structure

* `users/{uid}`
* `users/{uid}/entries/{date}`
* `providers/{providerId}/patients/{patientId}` (link table)

> Note: `providers/{providerId}` doc can mirror data in `users/{uid}` for quick access, *or* you can only read from `users` and use `providers/.../patients` as a link. MVP can keep providers’ main profile in `users` and use `providers` solely for links.

### `users/{uid}`

```ts
type UserRole = 'patient' | 'provider';

interface UserProfile {
  uid: string;
  role: UserRole;

  displayName: string;
  lang: 'en' | 'sw';
  yearOfBirth?: number;

  // Patient-only fields
  conditions?: ('hypertension' | 'diabetes')[];
  phone?: string;
  shareCode?: string; // only for patients
  thresholds?: {
    bpSysHigh: number;
    bpDiaHigh: number;
    bpSysVeryHigh: number;
    glucoseFastingHigh: number;
    glucoseRandomHigh: number;
    glucoseVeryHigh: number;
    glucoseLow: number;
  };
  comorbidities?: string[];
  linkedProviders?: string[]; // provider uids

  // Provider-only fields
  facilityName?: string;
  providerType?: string; // doctor, pharmacist, etc.

  createdAt: FirebaseTimestamp;
  updatedAt: FirebaseTimestamp;
}
```

### `users/{uid}/entries/{date}`

Same as before, plus creator metadata:

```ts
type EntryCreatorRole = 'patient' | 'provider';

interface DailyEntry {
  date: string; // 'YYYY-MM-DD'
  bp?: { sys: number; dia: number; time?: string };
  glucose?: { mmol: number; context: 'fasting' | 'random'; time?: string };
  meds?: { taken: boolean; names?: string[] };
  food?: { salt: 1|2|3|4|5; carb: 1|2|3|4|5; notes?: string };
  exercise?: { minutes: number };
  alcohol?: number;
  cigarettes?: number;
  herbs?: string[];
  notes?: string;

  status: 'green' | 'yellow' | 'red';
  statusReasons: string[];
  riskScore: number;
  actions: string[]; // i18n keys

  createdByRole: EntryCreatorRole;
  createdByUid: string; // uid of patient or provider
  createdAt: FirebaseTimestamp;
  updatedAt: FirebaseTimestamp;
}
```

### `providers/{providerId}/patients/{patientId}`

```ts
interface ProviderPatientLink {
  providerId: string; // same as provider uid
  patientId: string;  // user uid with role 'patient'
  createdAt: FirebaseTimestamp;
}
```

---

# 9. Business Logic (unchanged core, with creator role)

**Status, risk score, and insights** follow the same deterministic rules defined earlier:

* `computeStatus(entry, thresholds) -> 'green'|'yellow'|'red' + reasons[]`
* `computeRiskScore(entry, thresholds, streak) -> number`
* `generateActions(entry, status, reasons) -> string[]`

All of these are pure functions implemented in something like `HealthRulesService`.

When a **provider** records an entry:

* `createdByRole = 'provider'`
* `createdByUid = provider.uid`

When a **patient** records an entry:

* `createdByRole = 'patient'`
* `createdByUid = patient.uid`

---

# 10. Provider Context Handling (Frontend)

Implement a `ContextService`:

```ts
interface ViewingContext {
  currentRole: 'patient' | 'provider';
  actingAsPatientId?: string; // used when provider is viewing a patient
}
```

* If `currentRole === 'patient'`:

  * `actingAsPatientId` is always own `uid`.
* If `currentRole === 'provider'`:

  * When no patient selected: `actingAsPatientId` is `undefined`.
  * When patient selected: `actingAsPatientId = selectedPatientId`.

All data-fetching services should:

* Use `ContextService.getActivePatientId()` to know whose data to read/write from `users/{patientId}/entries`.

---

# 11. Firestore Security Rules (Updated Outline)

Goals:

* Patients can only access their own data.
* Providers can access data of patients **only when** there is an existing link in `providers/{providerId}/patients/{patientId}`.

Example:

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isSignedIn() {
      return request.auth != null;
    }

    function isSelf(userId) {
      return isSignedIn() && request.auth.uid == userId;
    }

    // Check if provider is linked to patient
    function isLinkedProvider(providerId, patientId) {
      return isSignedIn()
        && request.auth.uid == providerId
        && exists(/databases/$(database)/documents/providers/$(providerId)/patients/$(patientId));
    }

    match /users/{userId} {
      allow read, update: if isSelf(userId); // patient own profile or provider own profile
      allow create: if isSignedIn() && request.auth.uid == userId;

      // Patient entries
      match /entries/{entryId} {
        // Patient can read/write own entries
        allow read, write: if isSelf(userId)
          // OR linked provider can read/write entries for this patient
          || isLinkedProvider(request.auth.uid, userId);
      }
    }

    // Provider-patient link documents
    match /providers/{providerId}/patients/{patientId} {
      // Provider can manage their own link documents
      allow read, write: if isSelf(providerId);
    }
  }
}
```

> Devs should refine this, but the core idea is clear: **provider must have a link document** to access a patient’s entries.

---

# 12. Localization & Copy

* Use ngx-translate or Angular i18n.
* Provide keys for:

  * Status labels
  * Action descriptions
  * Provider-specific labels (e.g., “My Patients”, “Viewing as …”, “Add patient via code”).
* All copy must be available in **English and Swahili**.

---

# 13. Analytics (Updated)

Additional events:

* `provider_patient_linked`

  * `{ providerId, patientId }` (IDs hashed or anonymized if needed)
* `provider_view_as_start`

  * `{ patientId }`
* `provider_entry_saved`

  * `{ patientId, status }`

Same previous events for patient actions.

---

If you want, next I can:

* Draft the **Angular module/component/service layout** including `ContextService`, `HealthRulesService`, and `ProviderDashboardComponent`, or
* Provide **sample Tailwind-based HTML** for the Today screen and the Provider’s “My Patients” screen.
