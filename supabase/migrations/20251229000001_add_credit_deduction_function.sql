-- Credit Deduction Function (Atomic with Row Locking)
-- This function atomically checks and deducts translation credits
-- Uses FOR UPDATE to prevent race conditions when multiple concurrent requests process

CREATE OR REPLACE FUNCTION public.deduct_translation_credit(
  p_user_id UUID,
  p_amount INTEGER DEFAULT 1
)
RETURNS JSONB AS $$
DECLARE
  v_subscription subscriptions;
  v_result JSONB;
BEGIN
  -- Lock the row to prevent concurrent reads of stale values
  -- FOR UPDATE serializes all concurrent requests for this user
  SELECT * INTO v_subscription FROM subscriptions
  WHERE user_id = p_user_id
  FOR UPDATE;

  -- Check if row exists
  IF v_subscription.id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Subscription not found'
    );
  END IF;

  -- Check if user has enough credits
  IF (v_subscription.generations_limit - v_subscription.generations_used) < p_amount THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Insufficient credits',
      'available', v_subscription.generations_limit - v_subscription.generations_used,
      'required', p_amount
    );
  END IF;

  -- Atomically update the credit count
  UPDATE subscriptions
  SET generations_used = generations_used + p_amount
  WHERE user_id = p_user_id;

  -- Get the updated subscription record
  SELECT * INTO v_subscription FROM subscriptions
  WHERE user_id = p_user_id;

  -- Return success with new balance
  v_result := jsonb_build_object(
    'success', true,
    'generations_used', v_subscription.generations_used,
    'credits_balance', v_subscription.generations_limit - v_subscription.generations_used
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.deduct_translation_credit(UUID, INTEGER) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION public.deduct_translation_credit(UUID, INTEGER) IS
'Atomically deducts translation credits for a user. Uses row-level locking (FOR UPDATE) to prevent race conditions in concurrent requests. Returns JSON object with success flag and updated credit balance.';
