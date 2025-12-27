// =============================================================================
// ImageLingo Configuration
// =============================================================================
// Central configuration file for app-wide constants.
// Modify these values to customize behavior across the application.
// =============================================================================

// -----------------------------------------------------------------------------
// Beta Program Settings
// -----------------------------------------------------------------------------

/**
 * Beta mode flag
 * When true: Shows BetaFeedbackPanel (email-based credit requests)
 * When false: Shows BillingPanel (Stripe integration)
 */
export const IS_BETA = true;

/**
 * Number of credits granted per beta request
 * This is the fixed amount users receive when their request is approved
 */
export const BETA_CREDITS_PER_REQUEST = 20;

// -----------------------------------------------------------------------------
// Contact & Support
// -----------------------------------------------------------------------------

/**
 * Support email for feedback and credit requests
 */
export const SUPPORT_EMAIL = 'feedback@imagelingo.com';

// -----------------------------------------------------------------------------
// Processing Costs
// -----------------------------------------------------------------------------

/**
 * Cost in credits per image variation processed
 */
export const CREDITS_PER_IMAGE = 1;
