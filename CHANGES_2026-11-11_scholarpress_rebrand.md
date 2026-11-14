# Full rebrand: Paperly -> SCHOLARPRESS (2026-11-11)
Treated as a new project with the same core. Nothing of the old name remains in code, DB schema, paths or assets.
- Display name -> SCHOLARPRESS. IDs: paperly_id -> scholarpress_id, paperlyId -> scholarpressId, record prefix PLY- -> VLN-, certificate PLY-CERT- -> VLN-CERT-.
- Migrations/SQL renamed consistently: use a NEW Supabase project and apply all migrations from 0000 (do NOT apply to the old DB).
- Android: applicationId/package com.scholarpress.admin, scheme scholarpress://, keystore scholarpress-release.jks (create a new keystore).
- URLs/domains: old Vercel/Lovable/custom domains replaced by placeholder https://scholarpress.example. Set PUBLIC_SITE_URL and CAP_SERVER_URL to the real domain, then run the android-configure script; also update AndroidManifest hosts and capacitor.config.json.
- New logo (navy/ivory/gold V seal): public/scholarpress-seal*.png, icons, favicons, og-image, Android launcher + splash. Regenerate with: python3 scripts/generate-brand-assets.py
