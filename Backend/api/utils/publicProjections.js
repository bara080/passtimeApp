// Public-safe views of user documents. Anything returned to OTHER users must
// pass through here — the allowlist is the privacy boundary.

function computeAge(dateOfBirth) {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const beforeBirthday =
    now.getMonth() < dob.getMonth() ||
    (now.getMonth() === dob.getMonth() && now.getDate() < dob.getDate());
  if (beforeBirthday) age -= 1;
  return age >= 0 && age <= 120 ? age : null;
}

/** Discovery card for a host, shown to members. NEVER include email, phone,
 *  raw dateOfBirth, or any auth/onboarding internals. */
function toPublicHostCard(host) {
  return {
    uid: host.uid,
    displayName: host.displayName || host.firstName || "Host",
    firstName: host.firstName || "",
    age: computeAge(host.dateOfBirth),
    photoUrl: Array.isArray(host.photos) && host.photos[0] ? host.photos[0].url : host.avatarUrl || null,
    city: host.location?.city || null,
    experienceTypes: host.experienceTypes || [],
    hourlyRate: host.hourlyRate ?? null,
    currency: host.currency || "usd",
  };
}

module.exports = { toPublicHostCard, computeAge };
