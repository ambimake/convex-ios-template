# Deployment Secrets

Open before configuring Apple Sign In token exchange, Groq transcription,
Sentry, PostHog, Convex env vars, or local development sessions that depend on
secrets.

## Split

- Convex deployment env vars are server-side values read by deployed Convex
  functions.
- Local machine secrets are files and shell env used by Xcode, scripts, or
  one-off setup.

Keep live values in gitignored local files, vendor dashboards, CI secret
stores, or Convex deployment env. Do not commit:

- Apple `.p8` private keys;
- generated Apple client secret JWTs;
- Groq API keys;
- Sentry auth tokens;
- PostHog personal API keys;
- filled `.env` files;
- deployment-specific URLs unless they are intentionally public examples.

When a required live check cannot run because credentials are missing, record
the exact command, missing prerequisite, and owner needed to unblock it.
