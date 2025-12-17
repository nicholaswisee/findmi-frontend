export function isInAppBrowser(): boolean {
  if (typeof navigator === "undefined") return false;

  const ua = navigator.userAgent || "";
  return /Instagram|FBAN|FBAV|TikTok|Line|Twitter|Snapchat/i.test(ua);
}
