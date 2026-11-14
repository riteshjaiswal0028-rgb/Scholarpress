-- 0055: every new account gives a phone number (country + number). NOT APPLIED to any database. Review, then apply manually.
-- Additive and nullable: existing accounts keep working and are NOT asked for a number (details_completed is left as it is).
--  * profiles.phone: E.164 (+ country code + digits), 8 to 16 characters. profiles.phone_country: ISO 3166-1 alpha-2.
--  * Same visibility as the rest of the profile: the owner and staff only (see "read own profile or staff").
alter table public.profiles add column if not exists phone text check (phone is null or phone ~ '^\+[1-9][0-9]{6,14}$');
alter table public.profiles add column if not exists phone_country text check (phone_country is null or phone_country ~ '^[A-Z]{2}$');
