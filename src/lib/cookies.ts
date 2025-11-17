/**
 * Check if cookies are enabled in the browser
 * @returns true if cookies are enabled, false otherwise
 */
export function areCookiesEnabled(): boolean {
  try {
    // Try to set a test cookie
    document.cookie = "cookietest=1; SameSite=Strict";
    const cookiesEnabled = document.cookie.indexOf("cookietest=") !== -1;
    // Delete the test cookie
    document.cookie = "cookietest=1; expires=Thu, 01-Jan-1970 00:00:01 GMT; SameSite=Strict";
    return cookiesEnabled;
  } catch {
    return false;
  }
}
