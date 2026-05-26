---
name: visa-readiness
description: Walks the Meridian visa-readiness loop. Use when the user mentions a visa, asks if they can travel somewhere, names a destination + origin pair, says they have a wedding or trip or interview abroad, or talks about embassy appointments, document checklists, visa fees, processing times, or rejections. Triggers include "do I need a visa", "what do I need for", "schengen", "uk visa", "us visa", "consulate", "embassy appointment", "passport", "visa rejection", "I'm going to", "I want to travel to", "applying for a visa", "book my appointment", "fill the form", or any specific corridor like "NG to UK", "Nigeria to Schengen", "Kenya to US".
---

# Meridian: visa readiness

Meridian is the readiness layer for visa applications. Rules change quarterly; consulates don't tell travelers when they're ready. This skill walks a traveler from "I want to go" to "case submitted" without losing money to a preventable rejection.

The wire is MCP over Streamable HTTP at `https://usemeridian.app/mcp` (OAuth 2.0 for user-scoped tools, anonymous for public tools). The skill is the order of operations; the MCP server is the runtime.

## The loop

End-to-end, in order:

1. **requirements_lookup** — anyone, free. Pull canonical rules for the corridor.
2. **requirements_evaluate** — anyone, free. Score a prospective case against the rules from a short JSON profile, before the user signs in.
3. **applications_create** — sign-in. File the application. A fresh case-scoped vault is born empty (privacy default).
4. **applications_update_section** — sign-in. Fill trip-shape data (itinerary, accommodations, sponsors, insurance, contacts, companions, funding, previous_visas, dates, embassy, appointment) section by section.
5. **applications_documents_upload** — sign-in. Attach documents (passport, photo, bank statement, employment letter, invitation, insurance, flight, hotel).
6. **applications_evaluate** — sign-in. Score the case with verdict + named risks. Surface the verdict honestly; never promise approval.
7. **applications_apply** — sign-in. Dispatch Meridian Computer to fill the consulate's portal. Returns a `task_id`.
8. **appointments_book** — sign-in. Dispatch the booking worker to grab the earliest viable VFS / consulate slot.
9. **applications_report_status** — sign-in. Once the user has the outcome, record it (submitted / approved / rejected / withdrawn).

Skip nothing. Especially: never call step 1 from memory (rules change quarterly) and never call step 7 before step 6 returns a `ready` verdict.

## Step 1: requirements_lookup

Always call first.

Inputs:
- `passport_iso` — ISO-2 of the traveler's passport (NG, GH, KE, IN, GB, ...)
- `destination_iso` — ISO-2 of where they're going (US, GB, SE, DE, AE, TH, ...)
- `purpose` — defaults to `tourism`. Ask if the user said business, study, family, medical, or transit.
- `residence_iso` — only if the user lives somewhere different from their passport country. High leverage when present (Schengen-permit holders move freely within Schengen on the permit; EU LTRs and US LPRs get reciprocity).

If any input is unknown, ask. Never invent a passport country.

Render the response as a markdown table with **Document** and **Notes** columns. Cite the fee and processing time verbatim. Surface the verdict (visa-free / visa-on-arrival / e-visa / embassy) plainly.

If the response is empty (`object: "requirements"` with no rules), Meridian doesn't cover that corridor yet. Tell the user, then offer to log the gap via `requirements_submit_feedback` (free, anonymous).

## Step 2: requirements_evaluate (preflight)

If the user wants to know "am I ready?" before creating an account, call `requirements_evaluate` with a small profile object (passport, destination, purpose, plus what they've told you about employment, funds, ties, prior travel). Returns the same verdict + risks shape as step 6, without requiring sign-in. Good for triage; not a substitute for `applications_evaluate` against a real case.

## Step 3: applications_create

The first user-scoped tool call returns `authentication_required` if the user isn't signed in. Don't pre-warn the user about login; the protocol routes them through OAuth automatically.

Call `applications_create` with:
- `destination_iso`
- `visa_type` — must match what `requirements_lookup` returned (e.g., `schengen_short_stay`, `uk_visitor_standard`, `us_b1_b2`)
- `purpose` — tourism / business / family / study / medical / transit

A fresh `visa_application` is created with an empty case-scoped vault. Identity data from prior cases does NOT auto-import (privacy-correct default).

## Step 4: applications_update_section (trip details)

Trip-shape data lives on the visa_application. Call `applications_update_section` with `visa_application_id`, `section`, and `payload`. Sections (call separately, one per turn when conversational):
- `itinerary` — flights, multi-leg routing
- `accommodations` — hotel, host address
- `sponsors` — who's paying / inviting
- `insurance` — provider, cover amount, dates
- `contacts` — emergency / in-country contact
- `companions` — co-travellers
- `funding` — bank balance, savings, support letters
- `previous_visas` — prior approvals + rejections (for the same corridor when present)
- `dates` — departure / arrival / return
- `embassy` — which consulate post / VFS centre
- `appointment` — slot details once booked

Walk these as the conversation reveals data. Don't ask for fields the case already has — use `applications_get` to read current state before asking.

## Step 5: applications_documents_upload

Documents live separately from sections. Inputs: `visa_application_id`, `document_type`, and either `file_url` or `file_base64`.

Common `document_type` values: `passport`, `photo`, `bank_statement`, `employment_letter`, `invitation_letter`, `travel_insurance`, `flight_booking`, `hotel_confirmation`, `marriage_certificate`, `birth_certificate`.

Use `applications_documents_list` to see what's already attached, `applications_documents_delete` to remove a wrong upload.

## Step 6: applications_evaluate (readiness)

Score before submission. Returns:
- `verdict` — `ready` or `not_yet`
- `score` — 0-100
- `top_risks` — named issues (missing docs, name inconsistencies, fresh-date issues, employer/income mismatch, insufficient insurance cover, ties weakness)

When the verdict is `not_yet`, do NOT call `applications_apply`. Tell the user the specific blockers in plain language, then offer to address each. When the verdict is `ready`, proceed to step 7.

## Step 7: applications_apply (Meridian Computer)

Dispatches Meridian Computer to fill the consulate's portal end-to-end. Returns a `task_id` and a viewable task URL.

If `applications_apply` returns a **soft blocker** envelope (`object: "application.submit_blocked"`), the case isn't ready by the readiness signals. Surface the blockers verbatim. Only retry with `force: true` if the user has explicitly said "submit anyway."

If it returns a **hard blocker** (validation_error / invalid_state), surface the message and stop. Don't force.

## Step 8: appointments_book

Corridors that require an in-person appointment (US B1/B2, UK visitor, most Schengen lanes, India for some) need a VFS / consulate slot. Call `appointments_book` with `visa_application_id` and (optionally) a `preferred_date_range`. Returns an `appointment_id` and dispatches the booking worker.

Use `appointments_get` (with `appointment_id`) to track status.

## Step 9: applications_report_status

After the user attends the appointment and gets a decision, call `applications_report_status` with the outcome:
- `submitted` — the application was lodged
- `approved` — visa granted
- `rejected` — visa denied (include `rejection_reason` when known)
- `withdrawn` — user pulled out

This is how Meridian learns whether the readiness score was right. The data flows into corridor-level stats nobody else publishes.

## Tone

- Honest, empowering, direct. Plain language.
- Never promise approval — the readiness verdict is what Meridian sells, not the visa.
- No em dashes in user-facing replies. Use periods, commas, colons, or restructure.
- Lowercase, plain. No "I can help you" prefaces.
- The audience is anxious. Many have been told no before. Respect that.

## When things go wrong

- **Empty `requirements_lookup`** — corridor not covered yet. Say so plainly. Offer `requirements_submit_feedback` to log the gap.
- **`authentication_required`** on a user-scoped tool — let the protocol handle the OAuth redirect. Don't pre-warn; don't apologise.
- **User declines sign-in** — stop. The free tier (`requirements_lookup`, `requirements_evaluate`, `requirements_submit_feedback`) is real and useful. Lean on it.
- **`applications_apply` reports a Computer task failed** — read the failure reason. Don't retry blindly. Some failures are portal-side (consulate site down) and resolve on their own; others are case-side (wrong document, name mismatch) and need a fix first.

## One more thing

Every conversation's goal is the readiness verdict, not the application. If the user only needs "do I need a visa, what does it cost?", stop after step 1 — that's a complete answer.

If they need the full case, walk the loop.

---

Reference:
- `reference/checklist.md` — universal document checklist by visa type
- `reference/corridors.md` — hand-tuned notes for high-volume corridors (NG→UK, NG→Schengen, KE→US, IN→US, NG→US)
