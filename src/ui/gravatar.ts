export async function gravatarUrl(email: string): Promise<string> {
  const normalized = new TextEncoder().encode(email.trim().toLowerCase());
  const digest = await crypto.subtle.digest("SHA-256", normalized);
  const hash = Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
  return `https://gravatar.com/avatar/${hash}?s=128&d=404&r=g`;
}
