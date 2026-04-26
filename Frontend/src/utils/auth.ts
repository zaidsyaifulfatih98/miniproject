const USER_COOKIE = "user";
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

export function getUserFromCookie(): Record<string, any> | null {
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(USER_COOKIE + "="));
  if (!match) return null;
  try {
    const value = match.split("=").slice(1).join("=");
    return JSON.parse(decodeURIComponent(value));
  } catch {
    return null;
  }
}

export function setUserCookie(user: Record<string, any>): void {
  document.cookie = `${USER_COOKIE}=${encodeURIComponent(JSON.stringify(user))}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

export function removeUserCookie(): void {
  document.cookie = `${USER_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
}
