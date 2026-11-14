# v82: sign in / sign up redesign with phone and country selector
- New: src/lib/domain/phone.ts (+test), src/components/phone-field.tsx, drizzle/migrations/0055_profile_phone.sql (+journal)
- Changed: src/routes/auth.tsx, src/components/profile-details-gate.tsx, src/lib/app.functions.ts (getMe, completeProfile), src/integrations/supabase/types.ts
- Apply migration 0055 before deploying. Not built or viewed.
