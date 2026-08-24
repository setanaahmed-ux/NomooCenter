import "dotenv/config";

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export const env = {
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: required("JWT_SECRET", "dev-only-insecure-secret"),
  corsOrigin: process.env.CORS_ORIGIN ?? "*",

  // Google Meet integration — optional, feature checks this at call time.
  googleServiceAccountJson: process.env.GOOGLE_SERVICE_ACCOUNT_JSON || undefined,
  googleImpersonateEmail: process.env.GOOGLE_IMPERSONATE_EMAIL || undefined,
  get googleMeetConfigured() {
    return Boolean(this.googleServiceAccountJson && this.googleImpersonateEmail);
  },

  // Google Cloud / Gemini — backs every AI feature (lesson-script
  // generation, tutor assistant). Optional; features check this at call time.
  geminiApiKey: process.env.GEMINI_API_KEY || undefined,
  geminiModel: process.env.GEMINI_MODEL || "gemini-2.0-flash",
  get geminiConfigured() {
    return Boolean(this.geminiApiKey);
  },

  // Avatar tutor (D-ID) — optional, feature checks this at call time.
  dIdApiKey: process.env.D_ID_API_KEY || undefined,
  dIdDefaultPresenterImageUrl: process.env.D_ID_DEFAULT_PRESENTER_IMAGE_URL || undefined,
  get avatarTutorConfigured() {
    return Boolean(this.dIdApiKey && this.dIdDefaultPresenterImageUrl);
  },
};
