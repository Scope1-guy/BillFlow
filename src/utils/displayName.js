// Uses the name saved on the account (Google gives the real name).
// Otherwise falls back to the part of the email before the @.
export function getDisplayName(user) {
  if (!user) return "";

  const meta = user.user_metadata || {};
  const savedName = (meta.full_name || meta.name || "").trim();
  if (savedName) return savedName;

  return (user.email || "")
    .split("@")[0]
    .split(/[._-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
