# Scholarly rebrand + new certificate design (2026-11-13)
- Certificate now uses the approved Scholarly design (A4 landscape, 2296 x 1623 template): masthead, seal, signature and journal line are part of the template; everything else is filled automatically per certificate:
  name, role (+ORCID), "OF PUBLICATION/SUBMISSION/PEER REVIEW/AUTHOR RECORD", intro sentence, article title (auto-fits 1-3 lines), certificate ID, reference ID, published (UTC), issue date, DOI line (+Sandbox note), review statement, verification QR, DOI QR (publication with a confirmed DOI), footer disclaimer + verification address.
- Same layout drives the PDF and the on-screen certificate (src/lib/domain/certificate-layout.ts). Fonts: Cormorant Garamond, Playfair Display Italic, Inter (Lora / DejaVu fall back for characters they lack).
- The Google Scholar search line is no longer printed on the certificate image (the link still appears on the certificate page and in e-mails).
- Site brand renamed SCHOLARPRESS -> Scholarly (all visible text, e-mails, PDFs, manifest, Android app name). New logo/icons/OG image from the Scholarly S mark: python3 scripts/generate-brand-assets.py
- Regenerate the template: python3 scripts/generate-certificate-template.py (source design in scripts/assets/).
- NOT changed (to avoid breaking an existing database/app install): DB column scholarpress_id, ID prefixes, Android applicationId com.scholarpress.admin, scholarpress:// scheme, asset file names.
- Set PUBLIC_SITE_URL to your real domain; the QR codes and footer address use it (placeholder is https://scholarly.example).
