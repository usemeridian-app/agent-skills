---
name: meridian-visa
description: Walks the Meridian visa-readiness loop. Use when the user mentions a visa, asks if they can travel somewhere, names a destination + origin pair, says they have a wedding, trip, or interview abroad, or talks about embassy appointments, document checklists, visa fees, processing times, or rejections. Trigger phrases include "do I need a visa", "what do I need for", "schengen", "uk visa", "us visa", "consulate", "embassy appointment", "passport", "visa rejection", "I'm going to", "I want to travel to", "applying for a visa", "book my appointment", "fill the form", or any specific corridor like "NG to UK", "Nigeria to Schengen", "Kenya to US". Do NOT use for travel-blog writing, itinerary planning unrelated to visas, or hotel/flight booking — this skill orchestrates Meridian's visa-application surface, not general travel.
license: MIT
metadata:
  author: Meridian (Saunter Works)
  version: 0.1.3
  mcp-server: meridian
---

# Meridian: visa readiness

Meridian is the readiness layer for visa applications. Rules change quarterly; consulates do not tell travelers when they are ready. This skill walks a traveler from "I want to go" to "case submitted" without losing money to a preventable rejection.

The wire is MCP over Streamable HTTP at `https://usemeridian.app/mcp` (OAuth 2.0 for user-scoped tools, anonymous for public tools). The skill is the order of operations; the MCP server is the runtime.

## Important: order matters

Walk the loop in the order below. Especially:

- Never call step 1 from training-data memory — rules change quarterly. Always call `requirements_lookup` for the live answer.
- Never call `applications_apply` (step 7) before `applications_evaluate` (step 6) returns a `ready` verdict. Meridian's whole premise is "ready before submit"; skipping step 6 breaks it.
- Never promise visa approval. The readiness verdict is what Meridian sells, not the visa.

## The loop

1. **requirements_lookup** — anyone, free. Canonical rules for the corridor.
2. **requirements_evaluate** — anyone, free. Preflight score against the rules from a short profile, before sign-in.
3. **applications_create** — sign-in. Files the application. A fresh case-scoped vault is born empty (privacy default).
4. **applications_update_section** — sign-in. Fill trip-shape data (itinerary, accommodations, sponsors, insurance, contacts, companions, funding, previous_visas, dates, embassy, appointment) section by section.
5. **applications_documents_upload** — sign-in. Attach documents (passport, photo, bank statement, employment letter, invitation, insurance, flight, hotel).
6. **applications_evaluate** — sign-in. Score the case with verdict + named risks.
7. **applications_apply** — sign-in. Dispatch Meridian Computer to fill the consulate's portal. Returns a `task_id`.
8. **appointments_book** — sign-in. Dispatch the booking worker for VFS / consulate slots.
9. **applications_report_status** — sign-in. Record the outcome (submitted, approved, rejected, withdrawn).

## Instructions

### Step 1: requirements_lookup

Always call first. Required inputs:

- `passport_iso` — ISO-2 of the traveler's passport (NG, GH, KE, IN, GB, ...)
- `destination_iso` — ISO-2 of where they're going (US, GB, SE, DE, AE, TH, ...)
- `purpose` — defaults to `tourism`. Ask if the user said business, study, family, medical, or transit.
- `residence_iso` — only if the user lives outside their passport country. High leverage when present (Schengen-permit holders move freely within Schengen on the permit; EU LTRs and US LPRs get reciprocity).

If any required input is unknown, ASK. Do not invent a passport country.

Render the response as a markdown table with **Document** and **Notes** columns. Cite the fee and processing time verbatim. Surface the verdict (visa-free / visa-on-arrival / e-visa / embassy) plainly.

If the response carries `object: "requirements"` with no rules, Meridian does not cover that corridor yet. Tell the user honestly, then offer `requirements_submit_feedback` to log the gap.

### Step 2: requirements_evaluate (preflight)

If the user wants to know "am I ready?" before creating an account, call `requirements_evaluate` with a small profile (passport, destination, purpose, employment, funds, ties, prior travel). Returns the same verdict + risks shape as step 6, without sign-in. Good for triage; not a substitute for `applications_evaluate` against a real case.

### Step 3: applications_create

The first user-scoped call returns `authentication_required` if the user is not signed in. Do not pre-warn — the protocol handles OAuth automatically.

Inputs:

- `destination_iso`
- `visa_type` — must match what `requirements_lookup` returned (e.g., `schengen_short_stay`, `uk_visitor_standard`, `us_b1_b2`)
- `purpose` — tourism / business / family / study / medical / transit

A fresh `visa_application` is created with an empty case-scoped vault. Identity data from prior cases does NOT auto-import (privacy-correct default).

### Step 4: applications_update_section

Trip-shape sections (call separately, one per turn when conversational):

- `itinerary` — flights, multi-leg routing
- `accommodations` — hotel, host address
- `sponsors` — who's paying / inviting
- `insurance` — provider, cover amount, dates
- `contacts` — emergency / in-country contact
- `companions` — co-travellers
- `funding` — bank balance, savings, support letters
- `previous_visas` — prior approvals + rejections for the same corridor
- `dates` — departure / arrival / return
- `embassy` — consulate post / VFS centre
- `appointment` — slot details once booked

Read current state with `applications_get` before asking — never ask for a field the case already has.

### Step 5: applications_documents_upload

Document types Meridian recognises: `passport`, `photo`, `bank_statement`, `employment_letter`, `invitation_letter`, `travel_insurance`, `flight_booking`, `hotel_confirmation`, `marriage_certificate`, `birth_certificate`. Accept `file_url` OR `file_base64`.

Use `applications_documents_list` to see what's attached; `applications_documents_delete` to remove a wrong upload.

### Step 6: applications_evaluate

Returns:

- `verdict` — `ready` or `not_yet`
- `score` — 0 to 100
- `top_risks` — named issues (missing docs, name inconsistencies, fresh-date issues, employer/income mismatch, insufficient cover)

If `not_yet`, do NOT call `applications_apply`. Tell the user the specific blockers and offer to fix them. When `ready`, proceed to step 7.

### Step 7: applications_apply (Meridian Computer)

Dispatches Meridian Computer to fill the consulate's portal end-to-end. Returns a `task_id` + viewable URL.

If the response is `object: "application.submit_blocked"`, the case is not ready by readiness signals. Surface the blockers verbatim. Only retry with `force: true` if the user explicitly says "submit anyway."

If it's a hard `validation_error` / `invalid_state`, surface the message and stop. Do not force.

### Step 8: appointments_book

Corridors that require an in-person appointment (US B1/B2, UK visitor, most Schengen lanes, India for some) need a VFS / consulate slot. Call `appointments_book` with `visa_application_id` and (optionally) `preferred_date_range`. Returns an `appointment_id`. Use `appointments_get` to track status.

### Step 9: applications_report_status

After the user gets a decision, record it with `outcome` = `submitted` / `approved` / `rejected` / `withdrawn` (and `rejection_reason` when known). This is how Meridian learns whether the readiness verdict was right.

## Voice

- Honest, empowering, direct. Plain language.
- Never promise approval — the readiness verdict is what Meridian sells.
- No em dashes in user-facing replies. Use periods, commas, colons, or restructure.
- Lowercase, plain. No "I can help you" prefaces.
- The audience is anxious — many have been told no before. Respect that.

## Examples

### Example 1: simple corridor lookup (anonymous)

User says: "do I need a visa to go from Nigeria to the UK?"

Actions:
1. Call `requirements_lookup` with `passport_iso: "NG"`, `destination_iso: "GB"`, `purpose: "tourism"`.
2. Render a markdown table with documents + notes.
3. Cite the fee and processing time verbatim.

Result: User sees the verdict (embassy required), the documents (passport, photo, bank statement, etc.), the fee (GBP 115), and the processing time (3 to 6 weeks). No sign-in needed.

### Example 2: full readiness loop (signed-in)

User says: "I'm applying for a Schengen visa for my Berlin trip next month, can you walk me through it?"

Actions:
1. `requirements_lookup` — Nigeria to Germany, tourism.
2. `applications_create` — `destination_iso: "DE"`, `visa_type: "schengen_short_stay"`, `purpose: "tourism"`. First call triggers OAuth.
3. `applications_update_section` — fill itinerary, accommodations, dates, insurance, funding as the conversation reveals each.
4. `applications_documents_upload` — passport, photo, bank statement, employment letter, hotel confirmation, travel insurance.
5. `applications_evaluate` — surface verdict + named risks.
6. If `ready`: `applications_apply`. If `not_yet`: tell the user which risks to address.
7. `appointments_book` once the form is filed.
8. Later: `applications_report_status` with the outcome.

Result: A case that is ready before submission; risks named honestly; no surprise rejection.

### Example 3: blocked-by-readiness (do not force)

User says: "submit my UK visa application."

Actions:
1. `applications_evaluate` first.
2. Verdict comes back `not_yet`, top_risks = `["bank_statement older than 30 days", "employment_letter missing"]`.
3. Tell the user: "Your application is not ready: the bank statement is older than 30 days, and we still need an employment letter."
4. Offer to upload fresh documents.

Result: No `applications_apply` call. The user fixes the gaps, runs evaluate again, then submits. Meridian's promise stays intact.

## Troubleshooting

### Error: tool returned `authentication_required`

Cause: User-scoped tool called on an anonymous / public-scope token.

Solution: Do nothing — the MCP host (Claude Code, Claude.ai, Cursor) handles the OAuth redirect automatically. Do NOT apologise or pre-warn the user about login; the protocol does the work.

### Error: `requirements_lookup` returned an empty rules list

Cause: Meridian does not cover that corridor yet.

Solution: Tell the user plainly ("Meridian doesn't have rules for that route yet"). Offer to log the gap with `requirements_submit_feedback` (anonymous, free). Do NOT guess from training-data — the rules change quarterly and training-cutoff data drifts.

### Error: `applications_apply` returned `object: "application.submit_blocked"`

Cause: The case is not ready by `applications_evaluate` signals (soft blocker).

Solution: Surface the blockers in the envelope verbatim. Offer to fix each one. Only call `applications_apply` again with `force: true` if the user explicitly says "submit anyway" — and even then, repeat the verdict so they know what they're overriding.

### Error: `applications_apply` returned `validation_error` or `invalid_state`

Cause: Hard blocker — the case is already submitted, or required vault data is missing.

Solution: Surface the message and stop. Do NOT force. These are not soft blockers; the tool will refuse `force: true`.

### Error: Meridian Computer task reports `failed` via `tasks_get`

Cause: Either portal-side (consulate site down, captcha, network) or case-side (wrong document type, name mismatch, expired upload).

Solution: Read the `failure_reason` field. Portal-side failures often resolve on retry — wait 10 minutes, then retry once. Case-side failures need a fix first (re-upload, correct name spelling, refresh document).

## References

For corridor-specific notes (NG → GB, NG → Schengen, KE → US, IN → US, NG → US), consult `references/corridors.md` for the hand-tuned playbook of each lane.

For the universal document checklist (what `passport`, `photo`, `bank_statement` mean in practice across most lanes), consult `references/checklist.md`.

## Pairing

- **MCP server** — `https://usemeridian.app/mcp` (the runtime)
- **CLI** — `npm install -g @usemeridian/cli` (terminal seat for the same tools)
- **API reference** — `https://usemeridian.app/docs` (Stripe-shaped) + `https://usemeridian.app/openapi.yaml` (OpenAPI 3.1)
- **Source** — `https://github.com/usemeridian-app/agent-skills`
