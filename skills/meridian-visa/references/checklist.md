# universal document checklist

these documents show up on most visa applications. specifics vary by corridor; defer to `requirements_lookup` for the authoritative list.

## identity

- **passport**: bio page scan, valid for 6 months past intended return date. some consulates demand 6 months past intended entry. blank visa pages: 2 minimum, often 4.
- **photo**: passport-spec photo. 35x45mm for schengen, 2x2 inches for US, 35x45mm for UK (white background). taken within 6 months.
- **birth certificate**: required for first-time applicants in some corridors. NG and IN consulates ask more often than EU consulates.

## intent + finances

- **bank statement**: last 3 months (some corridors want 6). minimum balance varies. NG applicants for UK: ~£3,500 minimum, statements stamped by the bank.
- **letter of employment**: company letterhead, signed, salary stated, leave-approval noted. if self-employed: CAC certificate (NG), tax returns, business registration.
- **payslips**: last 3 months. match the salary stated in the employment letter or expect a refusal flag.
- **tax clearance**: TCC (NG), W-2 (US), P60 (UK). often optional but high-leverage if income is the marginal risk.

## trip plan

- **flight reservation**: hold, not paid ticket. some consulates explicitly disallow paid tickets before visa issuance.
- **hotel reservation**: refundable booking covering the full stay. airbnb works for most schengen and UK; some US consular posts prefer hotel.
- **invitation letter**: if visiting family or attending an event. requires the host's passport copy or residence permit and proof of address.
- **travel insurance**: mandatory for schengen (€30,000 cover, full schengen area, full trip dates). other corridors increasingly require it.

## supporting

- **ties to home country**: property deed, family registry, school enrollment for kids, ongoing business. consulates read this as "will return."
- **previous travel history**: old passports with prior visas. schengen and UK weight clean compliance heavily.
- **purpose-specific**: conference invite (business), school admission letter (study), hospital appointment (medical), wedding invite (family event).

## anti-patterns to flag in vault

if you see any of these in the vault, raise a soft blocker before `applications_apply`:

- bank statement from a balance-only screenshot (consulates need the full statement with transactions)
- photo with a non-white background, glasses on, or visibly cropped
- passport scan with the bio page blurred or missing the MRZ (machine readable zone)
- date inconsistencies between employment letter, payslips, and bank statement
- name spelled differently across documents (full middle name vs initial, hyphenated vs not)
- expired insurance dates, partial coverage area, or under-minimum cover amount
- old documents (3+ months) for items that need to be fresh (bank statement, employment letter, photo)

these are the most common preventable rejections meridian sees.
