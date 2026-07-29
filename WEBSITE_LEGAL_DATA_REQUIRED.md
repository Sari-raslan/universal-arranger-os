# Website Legal Data Required

Scope: `public-website/` (Singy Kids & Singy Teen public marketing site only).

No real legal, business-registration, or contact data was found anywhere in this repository or its git history for the public website. The following fields are placeholders in `public-website/public/legal/impressum.html` and `public-website/public/legal/datenschutz.html` and must be supplied by the site owner before this site can be declared production-ready or publicly indexed.

## Impressum (required for a German-facing site)

- [ ] Legal company/operator name
- [ ] Legal form (e.g. GmbH, Einzelunternehmen, sole proprietor)
- [ ] Commercial register details (register court, register number) if applicable
- [ ] Gewerbeanmeldung / trade registration number, if applicable
- [ ] Umsatzsteuer-ID (VAT ID) / Steuernummer, if applicable
- [ ] Responsible person for content per § 18 Abs. 2 MStV (name + address)
- [ ] Full postal address
- [ ] Contact email address
- [ ] Contact phone number (optional but common practice)

## Datenschutz (privacy policy)

- [ ] Data controller identity/address (same entity as Impressum, confirm)
- [ ] Confirmation of what data is actually collected (currently: none — no analytics, no cookies, no forms, no login are implemented on the public site)
- [ ] Hosting provider details (Vercel) and any sub-processor disclosures required under GDPR
- [ ] Data subject rights contact channel
- [ ] Retention policy statement, once any data collection is added in the future
- [x] Cookies / tracking tools disclosure — **confirmed not applicable today**: the current build ships zero cookies, zero analytics, and zero tracking scripts of any kind (verified by reading every file in `public-website/src` and `public-website/index.html`). This line only needs owner input if/when tracking is added later; until then the Datenschutz placeholder correctly states no tracking is active without requiring consent UI.

## Kontakt

- Omitted entirely from the footer/nav because no real, verifiable contact channel was found in the repo. Add a `Kontakt` page/link only once a real email or contact form is provided.

## Current state

- `legalDataComplete: false` in `WEBSITE_DEPLOYMENT_READINESS.json`.
- Both legal pages currently display a clear "pending owner input" notice in English, German, and Arabic instead of fabricated legal text.
- `robots: noindex, nofollow` is set site-wide until this file is resolved and the owner explicitly approves production launch.
