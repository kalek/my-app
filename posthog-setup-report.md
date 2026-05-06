<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into the Subspace Expo app. Here is a summary of every change made:

- **`app.config.js`** (new) — Converted `app.json` to a dynamic JS config that reads `POSTHOG_PROJECT_TOKEN` and `POSTHOG_HOST` from the environment at build time and passes them into `expo-constants` via the `extra` field.
- **`.env`** — Added `POSTHOG_PROJECT_TOKEN` and `POSTHOG_HOST` environment variables.
- **`lib/posthog.ts`** (new) — Singleton PostHog client configured via `expo-constants`. Includes lifecycle event capture, batching, feature flags, and debug logging in development.
- **`app/_layout.tsx`** — Wrapped the app in `PostHogProvider` (with touch autocapture enabled), and added manual screen tracking via `usePathname` + `useGlobalSearchParams` so every navigation change is recorded as a `$screen` event.
- **`app/(auth)/sign-in.tsx`** — Added `posthog.identify()` and `posthog.capture('user_signed_in')` on successful sign-in (both password and MFA paths).
- **`app/(auth)/sign-up.tsx`** — Added `posthog.identify()` with `$set_once: first_signup_date` and `posthog.capture('user_signed_up')` on successful account creation.
- **`app/(tabs)/settings.tsx`** — Added `posthog.capture('user_signed_out')` and `posthog.reset()` before signing out to clear the current distinct ID.
- **`app/(tabs)/index.tsx`** — Added `posthog.capture('subscription_expanded')` when a user expands a subscription card (only fires on expand, not collapse).
- **`app/subscriptions/[id].tsx`** — Added `posthog.capture('subscription_detail_viewed')` on mount to track full detail screen views.
- **`app/onboarding.tsx`** — Added `posthog.capture('onboarding_viewed')` on mount.

## Events

| Event | Description | File |
|---|---|---|
| `user_signed_in` | User successfully signs in with email and password (including MFA verification) | `app/(auth)/sign-in.tsx` |
| `user_signed_up` | User completes account creation and email verification | `app/(auth)/sign-up.tsx` |
| `user_signed_out` | User taps Log out in the Settings screen | `app/(tabs)/settings.tsx` |
| `subscription_expanded` | User expands a subscription card on the home screen to see more details | `app/(tabs)/index.tsx` |
| `subscription_detail_viewed` | User navigates to the full subscription detail screen | `app/subscriptions/[id].tsx` |
| `onboarding_viewed` | Onboarding screen is shown to the user | `app/onboarding.tsx` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- [Analytics basics dashboard](/dashboard/1553185)
- [Sign-ups & Sign-ins over time](/insights/QW1JPTRN)
- [Sign-up to Sign-in conversion funnel](/insights/6projlT7)
- [User churn (sign-outs)](/insights/K9MpnHPl)
- [Subscription engagement](/insights/lukrfRSf)
- [New users over time](/insights/wBIeQrBF)

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
