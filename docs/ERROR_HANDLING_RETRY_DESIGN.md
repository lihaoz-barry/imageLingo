# Error Handling & Retry Strategy Design Document
## imageLingo Multi-Image Variation Processing

**Document Status**: Design Review
**Last Updated**: 2025-12-29
**Priority**: High

---

## Executive Summary

Currently, when processing multiple images with variations, partial failures (e.g., 3 out of 4 succeed) provide no error feedback to users and no recovery mechanism. Users don't know which variations failed or why, and they cannot retry without restarting the entire process.

**Problem Scope**:
- User processes 4 images with 2 variations each = 8 total variations
- 3 variations succeed, 5 fail (e.g., due to rate limits or API errors)
- **Current behavior**: 3 images show results, 5 silently fail, user unaware
- **No retry option**: User must reprocess all images from scratch
- **Credit loss**: Failed variations don't deduct credits (good), but users lose time

---

## Design Goals

1. **Visibility**: Users immediately know which variations failed and why
2. **Recovery**: Users can retry failed variations without reprocessing succeeded ones
3. **Reliability**: Handle rate limits, transient errors, and API failures gracefully
4. **User Experience**: Minimal friction, clear guidance, automatic recovery when possible
5. **Debuggability**: System operators can analyze failure patterns and root causes

---

## Current State Analysis

### What Works
- ✅ Error codes are tracked (`CONFIG_ERROR`, `API_ERROR`, `RATE_LIMIT`, `NO_IMAGE`)
- ✅ `retryable` flag distinguishes temporary vs permanent errors
- ✅ Error messages stored in `generations.error_message`
- ✅ Failed variations in ProcessingQueue show error status
- ✅ Generation status tracks `failed` state

### What's Missing
- ❌ No automatic retry mechanism
- ❌ No retry count tracking (prevents infinite loops)
- ❌ No retry backoff/exponential delay
- ❌ No retry button in UI
- ❌ No way to distinguish "already retried 3x" vs "never retried"
- ❌ No dedicated error logging/analytics
- ❌ Failed images don't appear in history
- ❌ Sequential job failure halts entire batch

---

## Option 1: Automatic Retry with Exponential Backoff (Recommended)

### Strategy
System **automatically retries failed variations** with exponential backoff, up to 3 retries per failure.

### Architecture

```
User clicks "Process"
    ↓
Process all 8 variations in parallel
    ├─ 3 succeed → Display immediately
    ├─ 5 fail (retryable)
    │   ├─ Wait 2 seconds → Retry (attempt 2)
    │   │   ├─ 2 more succeed
    │   │   └─ 3 still fail (retryable)
    │   ├─ Wait 4 seconds → Retry (attempt 3)
    │   │   ├─ 2 more succeed
    │   │   └─ 1 fails (rate limit)
    │   ├─ Wait 8 seconds → Retry (attempt 4)
    │   │   └─ 1 succeeds ✓
    └─ Total: 8 succeeded (5 on first attempt, 3 from retries)
```

### Implementation Details

**Database Schema Changes**:
```sql
ALTER TABLE generations ADD COLUMN (
  retry_count          integer DEFAULT 0,           -- Track retry attempts
  error_code          text,                          -- RATE_LIMIT, API_ERROR, etc
  last_retry_at       timestamptz,                   -- When last retry happened
  first_error_at      timestamptz,                   -- When first error occurred
  is_retryable        boolean DEFAULT false          -- Can this be retried?
);

-- New table for error analytics
CREATE TABLE error_logs (
  id                  uuid PRIMARY KEY,
  generation_id       uuid REFERENCES generations(id),
  error_code          text,
  error_message       text,
  attempt_number      integer,
  retry_after_ms      integer,                       -- Suggested wait time
  created_at          timestamptz
);
```

**Retry Logic (in translation processor)**:
```typescript
// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelayMs: 2000,                           // 2 second base delay
  backoffMultiplier: 2,                        // Exponential: 2s, 4s, 8s
  maxDelayMs: 30000,                           // Cap at 30 seconds
  retryableErrors: ['RATE_LIMIT', 'TIMEOUT']  // Only retry these
};

async function translateWithRetry(generationId: string): Promise<Result> {
  let lastError: GeminiError | null = null;

  for (let attempt = 1; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
    try {
      const result = await translate(generationId);

      // Success - update DB
      if (attempt > 1) {
        await db.generations.update(generationId, {
          retry_count: attempt - 1,
          status: 'completed'
        });
      }
      return result;

    } catch (error) {
      lastError = error as GeminiError;

      // Log attempt
      await db.error_logs.insert({
        generation_id: generationId,
        error_code: lastError.code,
        error_message: lastError.message,
        attempt_number: attempt,
        retry_after_ms: lastError.retryAfterMs || null
      });

      // Check if retryable
      if (!lastError.retryable || attempt === RETRY_CONFIG.maxRetries) {
        break; // Don't retry permanent errors or max retries exceeded
      }

      // Calculate backoff delay
      const delayMs = Math.min(
        RETRY_CONFIG.baseDelayMs * Math.pow(RETRY_CONFIG.backoffMultiplier, attempt - 1),
        RETRY_CONFIG.maxDelayMs
      );

      // Wait before next retry
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  // All retries exhausted - mark as failed
  await db.generations.update(generationId, {
    status: 'failed',
    error_message: lastError?.message || 'Unknown error',
    retry_count: RETRY_CONFIG.maxRetries,
    is_retryable: lastError?.retryable || false
  });

  throw lastError;
}
```

**Client-Side Updates**:
```typescript
// In handleProcess():
const processImageJob = async (job: ProcessingJob) => {
  // ... existing code ...

  for (let varIndex = 0; varIndex < variationsPerImage; varIndex++) {
    try {
      // API now handles retries internally
      const translateRes = await fetch('/api/translate', {
        method: 'POST',
        body: JSON.stringify({ generation_id: newGeneration.id })
      });

      if (!translateRes.ok) {
        const error = await translateRes.json();

        // Check if retries were exhausted
        if (error.retriesExhausted) {
          throw new Error(`Failed after 3 retries: ${error.message}`);
        }
        // Else: will be retried server-side
      }

      const result = await translateRes.json();
      variations.push(result);

    } catch (error) {
      // Only permanent errors reach here
      updateJob(job.id, {
        status: 'error',
        errorMessage: error.message
      });
    }
  }
};
```

**UI Changes**:
```typescript
// ProcessingQueue.tsx - show retry status
function JobItemLarge({ job }: { job: ProcessingJob }) {
  return (
    <div>
      {/* ... existing code ... */}
      {job.status === 'processing' && (
        <span className="text-white/50 text-xs">
          {job.retryCount > 0 ? `Attempt ${job.retryCount + 1}/4` : ''}
        </span>
      )}
      {job.status === 'error' && job.isRetryable && (
        <span className="text-yellow-400 text-xs">
          Failed after retries - Click "Retry" to try again
        </span>
      )}
    </div>
  );
}
```

### Pros
✅ **User-Friendly**: Users don't see transient errors; system handles automatically
✅ **High Success Rate**: Rate limits and timeouts automatically recover
✅ **Transparent**: Retry count visible in UI
✅ **Respects API Limits**: Exponential backoff prevents overwhelming rate-limited APIs
✅ **Fire and Forget**: Client doesn't need to implement retry logic
✅ **Efficient**: Only failed variations are retried
✅ **Error Analytics**: Detailed error logs for debugging

### Cons
❌ **Latency**: Process takes longer (up to 2+4+8=14 seconds for 3 retries)
❌ **Server Cost**: More API calls to Gemini per user request
❌ **Complex Backend**: More code, state management, error handling
❌ **User Anxiety**: Long wait time might make users think it's frozen
❌ **Limited User Control**: Can't stop retries once started

### Risk Assessment
- **Low Risk**: Rate limits are handled; backoff prevents hammering API
- **Implementation Complexity**: Medium (new DB columns, retry loop, error logging)
- **Testing Complexity**: Medium (need to mock timeout/rate limit scenarios)

---

## Option 2: Manual User-Initiated Retry (Simple Alternative)

### Strategy
**Failed variations are clearly marked**, user can click "Retry" button to retry just the failed ones.

### Architecture

```
User clicks "Process" → 5 fail, 3 succeed
    ↓
UI shows:
  ✓ Image 1: 2 variations done
  ✗ Image 2: Variation 1 failed (Rate Limit)
  ✗ Image 2: Variation 2 failed (Rate Limit)
  ✓ Image 3: 2 variations done
  ✗ Image 4: 2 variations failed
    ↓
User clicks "Retry Failed (5 variations)"
    ↓
Client sends retry request with failed generation IDs
    ↓
Server retries only those 5, no backoff
    ↓
Results shown
```

### Implementation Details

**Database Changes**:
```sql
ALTER TABLE generations ADD COLUMN (
  retry_count       integer DEFAULT 0,        -- How many times retried
  error_code        text,                     -- Error type for filtering
  is_retryable      boolean DEFAULT false,    -- Can user retry this?
  parent_generation_id uuid                   -- Link to original (for tracking)
);
```

**Client-Side Implementation**:
```typescript
// Track failed variations
const [failedVariations, setFailedVariations] = useState<GenerationId[]>([]);

const handleRetryFailed = async () => {
  setIsProcessing(true);

  try {
    // Retry only the failed variations
    const retryPromises = failedVariations.map(genId =>
      fetch('/api/translate', {
        method: 'POST',
        body: JSON.stringify({
          generation_id: genId,
          isRetry: true,
          retryCount: 1
        })
      })
    );

    const results = await Promise.all(retryPromises);

    // Update UI with new results
    // Clear failed list
    setFailedVariations([]);

  } finally {
    setIsProcessing(false);
  }
};

// In UI:
{failedVariations.length > 0 && (
  <button
    onClick={handleRetryFailed}
    className="btn btn-warning"
  >
    Retry {failedVariations.length} Failed Variations
  </button>
)}
```

**API Route Changes**:
```typescript
// POST /api/translate
export async function POST(req: NextRequest) {
  const { generation_id, isRetry, retryCount } = await req.json();

  try {
    // Standard translate logic
    const result = await translate(generation_id);

    if (isRetry) {
      await db.generations.update(generation_id, {
        retry_count: retryCount,
        status: 'completed',
        updated_at: new Date()
      });
    }

    return Response.json(result);

  } catch (error) {
    const geminiError = error as GeminiError;

    // Mark as retryable for UI
    await db.generations.update(generation_id, {
      status: 'failed',
      error_message: geminiError.message,
      is_retryable: geminiError.retryable
    });

    return Response.json({
      error: geminiError.message,
      retryable: geminiError.retryable
    }, { status: 500 });
  }
}
```

### Pros
✅ **Simple**: Minimal backend changes, straightforward logic
✅ **User Control**: Users decide when to retry, can wait before retrying
✅ **No Server Cost**: Only retries when user explicitly asks
✅ **Fast Initial Response**: No waiting for automatic retries
✅ **Easy Testing**: Simple retry flow, no timing/backoff complexity
✅ **Transparent**: Users understand why they're retrying

### Cons
❌ **User Effort**: Users must manually retry (friction)
❌ **User Confusion**: Need clear error messages explaining what failed
❌ **No Backoff**: If rate limited, immediate retry will fail again
❌ **Poor Rate Limit Handling**: Users might hammer retry button, making situation worse
❌ **Incomplete UX**: Users see failures but no clear recovery path

### Risk Assessment
- **Low Risk**: Minimal new code, uses existing translate endpoint
- **Implementation Complexity**: Low (just add retry button + UI)
- **User Friction**: Higher (users must manually intervene)

---

## Option 3: Hybrid Approach (Recommended Production Solution)

### Strategy
**Combine automatic retries for transient errors + manual retry for permanent errors.**

- **Automatic Retries**: Rate limits, timeouts → Auto-retry with exponential backoff (up to 2 attempts)
- **Manual Retries**: Config errors, permission errors → Show error, let user retry manually
- **Failed History**: Show what failed, why, and offer one-click retry

### Architecture

```
User clicks "Process" → 8 variations attempted

Variation 1: ✓ Success
Variation 2: ✗ Rate Limit (retryable)
  → Auto-wait 2s → Retry → ✓ Success
Variation 3: ✗ Config Error (not retryable)
  → Mark as failed, show error
Variation 4-8: ✓ Success

Results:
  ✓ 7 succeeded (6 first attempt + 1 from retry)
  ✗ 1 failed with error message

UI offers: "Retry Config Error (1 variation)" button
User clicks → Retries only that 1 variation
```

### Implementation Details

```typescript
// Hybrid retry config
const RETRY_CONFIG = {
  transientRetries: 2,        // Auto-retry transient errors
  transientDelay: 2000,       // 2s base delay
  transientBackoff: 2,        // Exponential backoff

  permanentRetries: 0,        // Don't auto-retry permanent errors
  retryableErrors: ['RATE_LIMIT', 'TIMEOUT', 'DEADLINE_EXCEEDED'],
  nonRetryableErrors: ['CONFIG_ERROR', 'NO_IMAGE', 'INVALID_TYPE']
};

async function translateWithHybridRetry(generationId: string) {
  let attempt = 1;
  let lastError: GeminiError | null = null;

  while (attempt <= (lastError?.retryable ? RETRY_CONFIG.transientRetries : 1)) {
    try {
      return await translate(generationId);

    } catch (error) {
      lastError = error as GeminiError;

      // Log error
      await db.error_logs.insert({
        generation_id: generationId,
        error_code: lastError.code,
        error_message: lastError.message,
        attempt_number: attempt
      });

      // For transient errors, auto-retry
      if (lastError.retryable && attempt < RETRY_CONFIG.transientRetries) {
        const delayMs = RETRY_CONFIG.transientDelay *
                       Math.pow(RETRY_CONFIG.transientBackoff, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        attempt++;
      } else {
        break; // Don't retry permanent errors
      }
    }
  }

  // Mark as failed (non-retryable)
  await db.generations.update(generationId, {
    status: 'failed',
    error_message: lastError?.message,
    error_code: lastError?.code,
    is_retryable: lastError?.retryable || false,
    retry_count: attempt - 1
  });

  throw lastError;
}
```

### UI Component

```typescript
// Show errors clearly
function FailurePanel() {
  const [failedVariations, setFailedVariations] = useState<Generation[]>([]);

  return (
    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
      <h3 className="text-red-400 font-semibold mb-3">
        {failedVariations.length} Variation{failedVariations.length > 1 ? 's' : ''} Failed
      </h3>

      {failedVariations.map(gen => (
        <div key={gen.id} className="mb-2 p-2 bg-red-500/5 rounded text-sm">
          <div className="text-red-300 font-medium">
            {gen.error_code}: {gen.error_message}
          </div>
          <div className="text-red-300/60 text-xs mt-1">
            {gen.is_retryable ? '(Transient error - may succeed if retried)' : '(Permanent error)'}
          </div>
        </div>
      ))}

      {failedVariations.some(g => g.is_retryable) && (
        <button
          onClick={() => handleRetryFailed(failedVariations.filter(g => g.is_retryable))}
          className="mt-4 btn btn-warning"
        >
          Retry {failedVariations.filter(g => g.is_retryable).length} Variations
        </button>
      )}
    </div>
  );
}
```

### Pros
✅ **Best UX**: Automatic recovery for transient errors, clear feedback for permanent
✅ **Balanced**: Server cost minimal (only retries transient errors)
✅ **User Friendly**: Fast response for most users, recovery option available
✅ **Clear Error Messaging**: Users know exactly what failed and why
✅ **Efficient**: Combines benefits of both approaches
✅ **Scalable**: Transient retries keep server load reasonable

### Cons
❌ **Moderate Complexity**: More code than Option 2, less than Option 1
❌ **Requires Error Categorization**: Must correctly identify error types
❌ **Testing**: Need to test both auto-retry and manual retry paths

### Risk Assessment
- **Low Risk**: Limited auto-retries minimize server cost
- **Implementation Complexity**: Medium (hybrid logic, error categorization)
- **Best Balance**: Recommended for production

---

## Option 4: Async Retry Queue (Advanced)

### Strategy
Failed variations are placed in a **background retry queue** that processes them later with more sophisticated retry strategies.

### When to Use
- Users have millions of images daily
- Want to optimize API usage (batch retries during off-peak hours)
- Need detailed retry analytics and SLA tracking
- Have infrastructure for job queue (Redis, Bull, etc.)

### Implementation Complexity
🔴 Very High (requires job queue, background workers, scheduling)

### Recommended For
Not recommended for current scale (project still in early stages)

---

## Option 5: Credit-Aware Retry (Payment-Conscious)

### Strategy
Auto-retry **only once per variation** to minimize wasted credits, show clear cost to users.

```
Variation fails → Auto-retry once (consumes 1 credit total, not 2)
If still fails → Stop, show error, offer manual retry with cost warning
```

### When to Use
Users care deeply about credit usage, want minimal waste

### Pros
✅ Respects user budget
✅ Transparent credit costs

### Cons
❌ Lower success rate (only 1 auto-retry)
❌ More manual retries needed

---

## Comparison Matrix

| Criteria | Option 1: Auto | Option 2: Manual | Option 3: Hybrid ⭐ | Option 4: Queue | Option 5: Credit-Aware |
|----------|---|---|---|---|---|
| **Implementation Difficulty** | 🟡 Medium | 🟢 Low | 🟡 Medium | 🔴 Very High | 🟢 Low |
| **User Experience** | 🟢 Excellent | 🟡 Good | 🟢 Excellent | 🟢 Excellent | 🟡 Good |
| **Error Recovery Rate** | 🟢 95%+ | 🟡 70% (manual) | 🟢 90%+ | 🟢 95%+ | 🟡 80% |
| **Server Cost** | 🟡 Higher (retries) | 🟢 Lower | 🟢 Low | 🟡 Medium | 🟢 Low |
| **User Control** | 🔴 None | 🟢 Full | 🟢 Good | 🟡 Limited | 🟢 Full |
| **Production Ready** | 🟢 Yes | 🟢 Yes | 🟢 Yes | 🟡 Need infra | 🟢 Yes |
| **Recommended Stage** | Large scale | MVP | **Now (Growth)** | Enterprise | Scaling |

---

## Recommendation: **Option 3 - Hybrid Approach**

### Why Option 3?

**Current State**: You're in growth phase, not MVP (those are done) and not enterprise scale yet.

**Ideal Fit**:
1. ✅ **Handles transient errors automatically** (rate limits, timeouts) → Users don't see them
2. ✅ **Respects user control** → Users decide on permanent error retries
3. ✅ **Low server cost** → Only retries transient errors (2x max)
4. ✅ **Moderate complexity** → More manageable than full auto-retry, better UX than manual-only
5. ✅ **Clear error visibility** → Users see what failed and why
6. ✅ **Scales with you** → Can evolve to Option 1 later if needed
7. ✅ **Good user perception** → Fast for happy path, clear recovery options

### Implementation Plan

**Phase 1** (Immediate - 2-3 days):
- Add database columns for error tracking
- Implement 1-2 auto-retries for transient errors with exponential backoff
- Update ProcessingQueue to show retry status
- Add error logging table

**Phase 2** (Next week):
- Show error details panel with failed variations
- Add "Retry Failed" button with retry count limit
- Implement error analytics dashboard

**Phase 3** (Following week):
- Add error category filtering (show all RATE_LIMIT errors, etc.)
- Email notifications for repeated failures
- User settings: auto-retry preference (enabled/disabled)

---

## Implementation Roadmap

### Database Schema Changes

```sql
-- 1. Add columns to generations table
ALTER TABLE generations ADD COLUMN (
  error_code          TEXT,                    -- RATE_LIMIT, TIMEOUT, CONFIG_ERROR, etc.
  is_retryable        BOOLEAN DEFAULT FALSE,   -- Can this be manually retried?
  retry_count         INTEGER DEFAULT 0,       -- How many retries attempted
  first_error_at      TIMESTAMP,              -- When first error occurred
  last_retry_at       TIMESTAMP               -- When last retry happened
);

-- 2. Create error logs table (optional but recommended)
CREATE TABLE error_logs (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  generation_id       UUID REFERENCES generations(id) ON DELETE CASCADE,
  error_code          TEXT NOT NULL,
  error_message       TEXT NOT NULL,
  attempt_number      INTEGER NOT NULL,       -- Which attempt failed
  created_at          TIMESTAMP DEFAULT NOW()
);

-- 3. Index for common queries
CREATE INDEX idx_error_logs_generation ON error_logs(generation_id);
CREATE INDEX idx_error_logs_code ON error_logs(error_code);
CREATE INDEX idx_generations_error_code ON generations(error_code) WHERE status = 'failed';
```

### API Route Changes

```typescript
// /api/translate/route.ts - Updated
// - Add retry loop with exponential backoff
// - Log to error_logs table
// - Set error_code and is_retryable on failure
// - Return retry metadata in response
```

### Client Changes

```typescript
// app/page.tsx
// - Track failed generation IDs
// - Display failure panel with error details
// - Add handleRetryFailed function

// components/ProcessingQueue.tsx
// - Show retry count badge
// - Display error code and message
// - Color code by error type
```

### Testing Requirements

```
Test Suite: Error Handling & Retries
├─ Unit Tests
│  ├─ GeminiError classification (retryable vs permanent)
│  ├─ Exponential backoff calculation
│  └─ Error code extraction
├─ Integration Tests
│  ├─ Mock rate limit error → Auto-retry succeeds
│  ├─ Mock permanent error → Marked as failed, is_retryable = false
│  ├─ Mock 2 transient errors → Exhausts retries, marked as failed
│  └─ Manual retry of failed variation
└─ E2E Tests
   ├─ Process 4 images, 1 rate limited → Auto-retry succeeds
   ├─ Process 4 images, 1 config error → Shows retry button
   └─ Click retry button → Retries only failed variation
```

---

## ✅ APPROVED DESIGN - Implementation Decisions

**Status**: APPROVED FOR IMPLEMENTATION
**Branch**: `feat/error-handling-hybrid-retry-strategy`
**Approach**: Option 3 - Hybrid Approach
**Approved Date**: 2025-12-29

### Specific Implementation Requirements (User-Approved)

1. **Retry Policy** ✅
   - Maximum 2 auto-retries per variation
   - Transient errors only (RATE_LIMIT, TIMEOUT)
   - Permanent errors skip auto-retry, show to user

2. **User Experience** ✅
   - **Errors don't disappear** from ProcessingQueue
   - Show "Retry" button next to error message
   - Display error code + message clearly
   - Show retry count/history for each variation

3. **Error Tracking in UI** ✅
   - Show transaction details: "Attempt 1/3: Failed - Rate Limit"
   - Show retry history: which attempts failed, why
   - Persist error state in ProcessingQueue until success or manual abandon

4. **Timing** ✅
   - Backoff delay: 2-4 seconds (exponential: 2s first retry, 4s second retry)

5. **Notifications** ✅
   - No email notifications at this stage

6. **Credit Policy** ✅
   - Retries are FREE - do not deduct credits
   - Track retry attempts in database for cost analysis

7. **Database Tracking** ✅
   - Store **detailed error record** for each variation:
     - `error_code`: RATE_LIMIT, TIMEOUT, CONFIG_ERROR, etc.
     - `error_message`: Full error message from API
     - `retry_count`: How many retries attempted
     - `first_error_at`: Timestamp of first failure
     - `last_retry_at`: Timestamp of last retry attempt
     - `is_retryable`: Boolean flag for UI
   - Create `error_logs` table for detailed audit trail:
     - Each failed attempt logged separately
     - Track which attempt number failed
     - Useful for analytics and improvement

8. **History/Analytics** ✅
   - All failed variations visible in history
   - Show retry information: "Failed after 2 retries", "Rate Limit"
   - Use for analyzing error patterns and improving system

### Implementation Phases

**Phase 1 (This PR - 3-4 days)**:
- ✅ Add database columns for error tracking
- ✅ Implement hybrid retry logic (2 auto-retries + manual retry)
- ✅ Update ProcessingQueue to show error details + retry button
- ✅ Create error_logs table for audit trail
- ✅ Update generaterations table schema
- ✅ Show transaction/retry history in UI

**Phase 2 (Next PR)**:
- Show failed variations in history panel
- Add error filtering by code
- Error analytics dashboard

**Phase 3 (Later)**:
- Email notifications (if needed)
- User settings for retry preferences

---

## Next Steps

1. ✅ **Approved** - Option 3 Hybrid Approach
2. ✅ **Design finalized** with specific requirements
3. ➡️ **Implementation starting** on new branch
4. ➡️ Create detailed PR with implementation

---

**Document Status**: FINALIZED FOR IMPLEMENTATION
**Implementation Status**: IN PROGRESS
