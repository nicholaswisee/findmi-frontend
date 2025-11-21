type BufferLike = {
  from(
    input: string,
    encoding?: string
  ): { toString: (encoding: string) => string };
};

const getEnv = () =>
  (
    import.meta as ImportMeta & {
      env?: Record<string, string | undefined>;
    }
  ).env ?? {};

const getProcessEnv = () =>
  (
    globalThis as typeof globalThis & {
      process?: { env?: Record<string, string | undefined> };
    }
  ).process?.env ?? {};

const getGlobalBuffer = (): BufferLike | undefined => {
  if (typeof globalThis === "undefined") return undefined;
  return (globalThis as typeof globalThis & { Buffer?: BufferLike }).Buffer;
};

const getEnvSecret = (): string | undefined => {
  const envSecret = getEnv()?.VITE_QR_CODE_SECRET;
  if (envSecret && envSecret.length > 0) return envSecret;
  const processSecret = getProcessEnv()?.VITE_QR_CODE_SECRET;
  return processSecret;
};

const resolvedSecret = getEnvSecret();
const SECRET =
  resolvedSecret && resolvedSecret.length > 0
    ? resolvedSecret
    : "AkuMasukInkubatorTEDx2026";

const PREFIX = "FMIQR:";
const TOKEN_PARAM = "token";
const DASHBOARD_PATH =
  getEnv()?.VITE_DASHBOARD_ORDERS_PATH ?? "/dashboard/orders";

const getSecretCharCodes = () =>
  SECRET.split("").map((char) => char.charCodeAt(0));

const xorCipher = (input: string) => {
  const secretCodes = getSecretCharCodes();
  if (secretCodes.length === 0) return input;
  return input
    .split("")
    .map((char, index) => {
      const secretCode = secretCodes[index % secretCodes.length];
      return String.fromCharCode(char.charCodeAt(0) ^ secretCode);
    })
    .join("");
};

const base64Encode = (value: string) => {
  if (typeof window !== "undefined" && typeof window.btoa === "function") {
    return window.btoa(value);
  }
  const buffer = getGlobalBuffer();
  if (buffer) {
    return buffer.from(value, "utf-8").toString("base64");
  }
  throw new Error("Base64 encoding unsupported in this environment.");
};

const base64Decode = (value: string) => {
  if (typeof window !== "undefined" && typeof window.atob === "function") {
    return window.atob(value);
  }
  const buffer = getGlobalBuffer();
  if (buffer) {
    return buffer.from(value, "base64").toString("utf-8");
  }
  throw new Error("Base64 decoding unsupported in this environment.");
};

const getDashboardBaseUrl = (): string => {
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  const env = getEnv();
  const processEnv = getProcessEnv();
  return (
    env?.VITE_FRONTEND_URL ??
    env?.VITE_PUBLIC_URL ??
    processEnv?.VITE_FRONTEND_URL ??
    "https://findmi.app"
  );
};

const buildOrdersUrl = (): string => {
  const base = getDashboardBaseUrl();
  try {
    return new URL(DASHBOARD_PATH, base).toString();
  } catch {
    return `${base.replace(/\/$/, "")}${DASHBOARD_PATH}`;
  }
};

export const createOrderQrValue = (orderId: number): string => {
  const targetUrl = buildOrdersUrl();
  const payload = {
    orderId,
    issuedAt: Date.now(),
    target: targetUrl,
  };
  const cipher = xorCipher(JSON.stringify(payload));
  return `${PREFIX}${base64Encode(cipher)}`;
};

const extractToken = (value: string): string | null => {
  if (!value) return null;
  try {
    const decodedUrl = new URL(value);
    const param =
      decodedUrl.searchParams.get(TOKEN_PARAM) ??
      decodedUrl.searchParams.get("code") ??
      decodedUrl.searchParams.get("orderToken");
    if (param) return param;
  } catch {
    // value might not be a URL
  }

  if (value.startsWith(PREFIX)) {
    return value.slice(PREFIX.length);
  }

  return value;
};

export const decodeOrderPayload = (value: string): number | null => {
  const raw = extractToken(value);
  if (!raw) return null;

  try {
    const cipher = base64Decode(raw);
    const plain = xorCipher(cipher);
    const parsed = JSON.parse(plain) as { orderId?: number };
    if (typeof parsed.orderId === "number" && Number.isFinite(parsed.orderId)) {
      return parsed.orderId;
    }
  } catch {
    // Ignore decoding errors and treat as invalid payload
  }

  return null;
};
