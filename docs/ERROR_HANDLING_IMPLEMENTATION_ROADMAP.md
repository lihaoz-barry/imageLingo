# Error Handling & Retry Implementation Roadmap
## Phase 1: Core Implementation

**Branch**: `feat/error-handling-hybrid-retry-strategy`
**Target Duration**: 3-4 days
**Status**: 🚀 IN PROGRESS

---

## Task Breakdown

### 1. Database Schema Updates

**File**: `supabase/migrations/[timestamp]_add_error_handling.sql`

**Changes**:
```sql
-- 1.1 Add error tracking columns to generations table
ALTER TABLE public.generations ADD COLUMN (
  error_code          TEXT,                         -- RATE_LIMIT, TIMEOUT, CONFIG_ERROR, NO_IMAGE, API_ERROR
  error_message       TEXT,                         -- Full error message from Gemini
  is_retryable        BOOLEAN DEFAULT FALSE,        -- Can user manually retry this?
  retry_count         INTEGER DEFAULT 0,            -- How many retry attempts made
  first_error_at      TIMESTAMP WITH TIME ZONE,     -- When first error occurred
  last_retry_at       TIMESTAMP WITH TIME ZONE      -- When last retry attempted
);

-- 1.2 Create error_logs table for detailed audit trail
CREATE TABLE public.error_logs (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  generation_id       UUID NOT NULL REFERENCES public.generations(id) ON DELETE CASCADE,
  user_id             UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  error_code          TEXT NOT NULL,                -- Error classification
  error_message       TEXT NOT NULL,                -- Full error message
  attempt_number      INTEGER NOT NULL,             -- Which attempt (1, 2, 3)
  retry_after_ms      INTEGER,                      -- Suggested wait before retry
  created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT error_logs_attempt_check CHECK (attempt_number >= 1)
);

-- 1.3 Indexes for performance
CREATE INDEX idx_error_logs_generation_id ON public.error_logs(generation_id);
CREATE INDEX idx_error_logs_user_id ON public.error_logs(user_id);
CREATE INDEX idx_error_logs_error_code ON public.error_logs(error_code);
CREATE INDEX idx_error_logs_created_at ON public.error_logs(created_at);
CREATE INDEX idx_generations_error_code ON public.generations(error_code) WHERE status = 'failed';

-- 1.4 RLS Policies for error_logs
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own error logs"
  ON public.error_logs
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert error logs"
  ON public.error_logs
  FOR INSERT
  WITH CHECK (true);

-- 1.5 Create view for error analytics
CREATE OR REPLACE VIEW public.error_analytics AS
SELECT
  DATE(created_at) AS error_date,
  error_code,
  COUNT(*) AS total_errors,
  COUNT(DISTINCT generation_id) AS unique_generations,
  COUNT(DISTINCT user_id) AS affected_users,
  ROUND(AVG(retry_after_ms)) AS avg_retry_after_ms,
  MAX(created_at) AS last_occurrence
FROM public.error_logs
GROUP BY DATE(created_at), error_code
ORDER BY error_date DESC, total_errors DESC;
```

**Deliverable**: Migration file that can be applied to Supabase

---

### 2. API Route Updates: `/api/translate`

**File**: `app/api/translate/route.ts`

**Changes Required**:

```typescript
// 2.1 Add retry configuration constants
const RETRY_CONFIG = {
  maxRetries: 2,                    // 0 = no retries, attempt up to 3 times (0 + 2)
  transientDelay: 2000,             // 2 seconds
  backoffMultiplier: 2,             // 2s, then 4s
  retryableErrors: ['RATE_LIMIT', 'TIMEOUT', 'DEADLINE_EXCEEDED'],
  nonRetryableErrors: ['CONFIG_ERROR', 'NO_IMAGE', 'INVALID_TYPE']
};

// 2.2 Create translateWithRetry function
async function translateWithRetry(
  generationId: string,
  userId: string,
  projectId: string,
  retriesSoFar: number = 0
): Promise<TranslationResult> {
  try {
    // Original translate logic
    const result = await callGeminiTranslate(...);

    // Success - clear any error state
    if (retriesSoFar > 0) {
      await updateGeneration(generationId, {
        status: 'completed',
        error_code: null,
        error_message: null,
        retry_count: retriesSoFar
      });
    }

    return result;

  } catch (error) {
    const geminiError = error as GeminiError;

    // Log this error attempt
    await logErrorAttempt({
      generation_id: generationId,
      user_id: userId,
      error_code: geminiError.code,
      error_message: geminiError.message,
      attempt_number: retriesSoFar + 1,
      retry_after_ms: geminiError.retryAfterMs || null
    });

    // Determine if we should retry
    const isRetryable = RETRY_CONFIG.retryableErrors.includes(geminiError.code);
    const canRetry = isRetryable && retriesSoFar < RETRY_CONFIG.maxRetries;

    if (canRetry) {
      // Calculate backoff delay
      const delayMs = RETRY_CONFIG.transientDelay *
                     Math.pow(RETRY_CONFIG.backoffMultiplier, retriesSoFar);

      // Update generation with retry info
      await updateGeneration(generationId, {
        status: 'retrying',
        first_error_at: retriesSoFar === 0 ? NOW : undefined,
        last_retry_at: NOW,
        error_code: geminiError.code,
        is_retryable: true
      });

      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, delayMs));

      // Recursive retry
      return translateWithRetry(generationId, userId, projectId, retriesSoFar + 1);

    } else {
      // No more retries - mark as failed
      await updateGeneration(generationId, {
        status: 'failed',
        error_code: geminiError.code,
        error_message: geminiError.message,
        retry_count: retriesSoFar,
        is_retryable: !geminiError.code.includes('CONFIG') && isRetryable,
        first_error_at: retriesSoFar === 0 ? NOW : undefined,
        last_retry_at: NOW
      });

      // Throw for client to handle
      throw geminiError;
    }
  }
}

// 2.3 Update POST handler to use new logic
export async function POST(req: NextRequest) {
  const { generation_id, retry = false, retryCount = 0 } = await req.json();

  try {
    const result = await translateWithRetry(generation_id, userId, projectId, retryCount);
    return Response.json(result);

  } catch (error) {
    const geminiError = error as GeminiError;

    return Response.json({
      error: geminiError.message,
      error_code: geminiError.code,
      retryable: geminiError.retryable,
      retriesExhausted: true
    }, { status: 500 });
  }
}
```

**Deliverable**: Updated route with retry logic

---

### 3. Client-Side Error Tracking

**File**: `app/page.tsx`

**Changes Required**:

```typescript
// 3.1 Extend ProcessingJob interface
interface ProcessingJob {
  id: string;
  imageFile: ImageFile;
  status: 'queued' | 'uploading' | 'processing' | 'done' | 'error' | 'retrying';
  currentVariation: number;
  totalVariations: number;
  progress: number;
  errorMessage?: string;

  // NEW: Error tracking
  errorCode?: string;                    // RATE_LIMIT, TIMEOUT, etc.
  retryCount?: number;                   // How many retries attempted
  isRetryable?: boolean;                 // Can user manually retry?
  failedAttempts?: Array<{               // History of attempts
    attemptNumber: number;
    errorCode: string;
    errorMessage: string;
    timestamp: string;
  }>;
}

// 3.2 Track failed variations for manual retry
const [failedVariations, setFailedVariations] = useState<Map<string, ProcessingJob>>(new Map());

// 3.3 Update processImageJob to handle retries
const processImageJob = async (job: ProcessingJob) => {
  try {
    // ... existing code ...

    for (let varIndex = 0; varIndex < variationsPerImage; varIndex++) {
      try {
        const genRes = await fetch('/api/generations', {
          method: 'POST',
          body: JSON.stringify({
            project_id: projId,
            type: 'translation',
            input_image_id: uploadedImage.id,
            source_language: sourceLanguage,
            target_language: targetLanguage
          })
        });

        const { generation: newGeneration } = await genRes.json();

        // Translate with auto-retry (handled by server)
        const translateRes = await fetch('/api/translate', {
          method: 'POST',
          body: JSON.stringify({
            generation_id: newGeneration.id
          })
        });

        if (!translateRes.ok) {
          const error = await translateRes.json();

          // Track failed variation
          setFailedVariations(prev => new Map(prev).set(newGeneration.id, {
            ...job,
            status: 'error',
            errorCode: error.error_code,
            errorMessage: error.error,
            isRetryable: error.retryable
          }));

          // Don't throw - continue processing other variations
          updateJob(job.id, {
            status: 'error',
            errorCode: error.error_code,
            errorMessage: error.error,
            isRetryable: error.retryable
          });

          continue;
        }

        // Success
        const result = await translateRes.json();
        variations.push(result);

      } catch (error) {
        // Unexpected error
        updateJob(job.id, {
          status: 'error',
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // ... existing code ...

  } catch (error) {
    // Outer error handling
  }
};

// 3.4 Add manual retry handler
const handleRetryVariation = async (generationId: string) => {
  const failedJob = failedVariations.get(generationId);
  if (!failedJob) return;

  updateJob(failedJob.id, { status: 'retrying' });

  try {
    const res = await fetch('/api/translate', {
      method: 'POST',
      body: JSON.stringify({
        generation_id: generationId,
        retry: true
      })
    });

    if (!res.ok) {
      const error = await res.json();
      updateJob(failedJob.id, {
        status: 'error',
        errorMessage: error.error,
        isRetryable: false  // After manual retry fails, no more retries
      });
      return;
    }

    const result = await res.json();
    // Update results
    setFailedVariations(prev => {
      const next = new Map(prev);
      next.delete(generationId);
      return next;
    });

    updateJob(failedJob.id, { status: 'done' });

  } catch (error) {
    updateJob(failedJob.id, {
      status: 'error',
      errorMessage: error instanceof Error ? error.message : 'Retry failed'
    });
  }
};
```

**Deliverable**: Updated client logic with retry tracking

---

### 4. ProcessingQueue Component Updates

**File**: `components/ProcessingQueue.tsx`

**Changes Required**:

```typescript
// 4.1 Update JobItemLarge to show error details
function JobItemLarge({ job }: { job: ProcessingJob }) {
  const displayProgress = useFakeProgress(job.status);

  const getStatusText = () => {
    switch (job.status) {
      case 'retrying':
        return `Retrying... (Attempt ${(job.retryCount || 0) + 1}/3)`;
      case 'error':
        return job.isRetryable ? 'Failed - Retry Available' : 'Failed - Permanent Error';
      // ... rest of cases
    }
  };

  const getErrorDisplay = () => {
    if (job.status !== 'error') return null;

    return (
      <div className="mt-2 p-2 bg-red-500/10 border border-red-500/30 rounded text-sm">
        <div className="text-red-400 font-semibold flex items-center gap-2">
          <span>✕</span>
          <span>{job.errorCode || 'Error'}</span>
        </div>
        <div className="text-red-300/80 text-xs mt-1">{job.errorMessage}</div>

        {job.isRetryable && (
          <button
            onClick={() => handleRetryVariation(job.id)}
            className="mt-2 px-3 py-1 bg-yellow-600 hover:bg-yellow-700 rounded text-white text-xs"
          >
            Retry Now
          </button>
        )}

        {job.retryCount !== undefined && (
          <div className="text-white/40 text-[10px] mt-2">
            Attempts: {job.retryCount}/{RETRY_CONFIG.maxRetries}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
      {/* ... existing thumbnail and progress ... */}

      {/* Error display section */}
      {getErrorDisplay()}
    </div>
  );
}

// 4.2 Add retry attempt history display
function RetryHistoryPanel({ job }: { job: ProcessingJob }) {
  if (!job.failedAttempts || job.failedAttempts.length === 0) return null;

  return (
    <div className="mt-3 space-y-1 text-xs text-white/50">
      <div className="font-semibold text-white/70">Attempt History:</div>
      {job.failedAttempts.map((attempt, i) => (
        <div key={i} className="pl-2 border-l border-white/20">
          <div className="text-white/60">
            Attempt {attempt.attemptNumber}: {attempt.errorCode}
          </div>
          <div className="text-white/40 text-[10px]">
            {new Date(attempt.timestamp).toLocaleTimeString()}
          </div>
        </div>
      ))}
    </div>
  );
}
```

**Deliverable**: Updated ProcessingQueue with error details and retry button

---

### 5. Error Logging Utility

**File**: `lib/error-logger.ts` (NEW)

**Content**:
```typescript
import { createClient } from '@/lib/supabase-server';

export interface ErrorLogEntry {
  generation_id: string;
  user_id: string;
  error_code: string;
  error_message: string;
  attempt_number: number;
  retry_after_ms?: number;
}

export async function logErrorAttempt(entry: ErrorLogEntry) {
  try {
    const supabase = createClient();

    await supabase
      .from('error_logs')
      .insert({
        generation_id: entry.generation_id,
        user_id: entry.user_id,
        error_code: entry.error_code,
        error_message: entry.error_message,
        attempt_number: entry.attempt_number,
        retry_after_ms: entry.retry_after_ms || null
      });

  } catch (error) {
    // Log to console if DB insert fails
    console.error('Failed to log error:', error);
  }
}

export async function getErrorHistory(generationId: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('error_logs')
    .select('*')
    .eq('generation_id', generationId)
    .order('attempt_number', { ascending: true });

  if (error) throw error;
  return data;
}

export async function getErrorStats(userId: string, days: number = 7) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('error_analytics')
    .select('*')
    .eq('user_id', userId)
    .gte('error_date', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString());

  if (error) throw error;
  return data;
}
```

**Deliverable**: Error logging utility

---

### 6. Type Updates

**File**: `types/index.ts`

**Add**:
```typescript
export interface ErrorLog {
  id: string;
  generation_id: string;
  user_id: string;
  error_code: string;
  error_message: string;
  attempt_number: number;
  retry_after_ms?: number;
  created_at: string;
}

export interface ErrorAttempt {
  attemptNumber: number;
  errorCode: string;
  errorMessage: string;
  timestamp: string;
}

export interface GenerationWithErrors {
  id: string;
  status: 'completed' | 'failed' | 'retrying';
  error_code?: string;
  error_message?: string;
  retry_count: number;
  is_retryable: boolean;
  first_error_at?: string;
  last_retry_at?: string;
  error_history?: ErrorLog[];
}
```

---

### 7. Testing Requirements

**File**: `__tests__/api/translate-retry.test.ts` (NEW)

**Test Cases**:
- ✅ Successful translation on first attempt
- ✅ Rate limit error → Auto-retry succeeds (attempt 2)
- ✅ Rate limit error → Auto-retry fails → Manual retry (attempt 3)
- ✅ Config error → No auto-retry → Show error + retry button
- ✅ Permanent error → is_retryable = false
- ✅ Transient error → is_retryable = true
- ✅ Error logging stores correct attempt numbers
- ✅ Backoff delay between retries (2s, then 4s)
- ✅ Max retries enforced (no more than 3 attempts)

---

## Implementation Checklist

### Database
- [ ] Create migration file `supabase/migrations/[timestamp]_add_error_handling.sql`
- [ ] Test migration locally
- [ ] Verify RLS policies work
- [ ] Verify indexes created

### API Route
- [ ] Update `app/api/translate/route.ts` with retry logic
- [ ] Test auto-retry with mocked Gemini errors
- [ ] Test error logging
- [ ] Verify credits not deducted on retry

### Client
- [ ] Update `app/page.tsx` with retry tracking
- [ ] Update ProcessingJob interface
- [ ] Add error tracking state
- [ ] Implement manual retry handler

### UI
- [ ] Update `components/ProcessingQueue.tsx`
- [ ] Show error details (code + message)
- [ ] Add retry button
- [ ] Show attempt history
- [ ] Test error display at different viewport sizes

### Utilities
- [ ] Create `lib/error-logger.ts`
- [ ] Create type definitions

### Testing
- [ ] Write unit tests for retry logic
- [ ] Write integration tests for error flow
- [ ] Write E2E tests for user-facing flows
- [ ] Manual testing with real variations

### Documentation
- [ ] Update API documentation
- [ ] Document new error codes
- [ ] Document retry behavior

---

## Quality Assurance Checklist

Before PR submission, verify:
- [ ] `npm run lint` → 0 errors
- [ ] `npx tsc --noEmit` → 0 errors
- [ ] `npm test` → All tests passing
- [ ] Error codes consistent across codebase
- [ ] Database migration applies cleanly
- [ ] RLS policies secure and correct
- [ ] No console errors in browser
- [ ] Error display works on mobile
- [ ] Retry button clickable and responsive

---

## Success Criteria

✅ **Phase 1 Complete When**:
1. 2 auto-retries implemented with exponential backoff
2. Transient errors retry automatically
3. Permanent errors show error message + retry button
4. UI displays retry count and error details
5. Error logs stored in database
6. All tests passing
7. Zero lint/type errors
8. PR created with detailed description

---

**Next**: Start implementation on Phase 1 tasks (Database Schema first)
