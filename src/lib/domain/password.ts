/** Rules for choosing a new password and entering the e-mailed code. Pure, so they are unit tested. */
export const MIN_PASSWORD = 8;
export const MAX_PASSWORD = 72; // bcrypt (used by Supabase Auth) ignores everything after 72 bytes

/** Keep digits only; the code is 6 digits by default but Supabase lets projects choose 6 to 10. */
export function cleanOtp(raw: string): string { return raw.replace(/\D/g, "").slice(0, 10); }
export function isOtp(code: string): boolean { return /^\d{6,10}$/.test(code); }

/** Returns an error message, or null when the new password is acceptable. */
export function checkNewPassword(password: string, confirm: string): string | null {
  if (password.length < MIN_PASSWORD) return `Use at least ${MIN_PASSWORD} characters.`;
  if (new TextEncoder().encode(password).length > MAX_PASSWORD) return `Use at most ${MAX_PASSWORD} characters.`;
  if (/^\s+$/.test(password)) return "The password cannot be only spaces.";
  if (password !== confirm) return "The two passwords do not match.";
  return null;
}
