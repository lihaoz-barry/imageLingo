// Configuration flags for ImageLingo

/**
 * Beta mode flag
 * When true: Shows BetaFeedbackPanel (email-based credit requests)
 * When false: Shows BillingPanel (Stripe integration)
 */
export const IS_BETA = true;

/**
 * Support email for beta feedback and credit requests
 * TODO: Update this to your actual support email
 */
export const SUPPORT_EMAIL = 'feedback@imagelingo.com';

/**
 * Maximum credits a user can request during beta
 */
export const BETA_MAX_CREDITS = 30;
