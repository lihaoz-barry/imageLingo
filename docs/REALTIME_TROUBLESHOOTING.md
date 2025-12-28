# Real-time Updates Troubleshooting Guide

## Problem Statement
When a generation completes on the backend and its status is updated to 'completed', the frontend may not immediately receive the real-time notification, requiring manual refresh to see the results.

## Root Causes & Solutions

### 1. **Supabase RLS Policy Issue** ⚠️
The most common cause: RLS (Row Level Security) policies preventing real-time updates.

**Problem:**
- Supabase Real-time notifications require database update permissions
- If user cannot UPDATE a row due to RLS, they won't receive real-time notifications for that row

**Solution:**
Check RLS policies on `generations` table:

```sql
-- Verify RLS is enabled
SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename = 'generations';

-- Check policies
SELECT * FROM pg_policies WHERE tablename = 'generations';

-- Ensure users can receive updates on their own records
-- Policy should allow UPDATE for own records
CREATE POLICY "Users can see their own generations" ON generations
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can receive updates for their generations" ON generations
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

### 2. **Real-time Not Enabled on Table**
The `generations` table must have real-time enabled.

**Check Real-time Status:**
In Supabase Dashboard → Table Editor → Realtime
- Click `generations` table
- Toggle "Realtime" to enabled
- Required: `UPDATE` events must be enabled

**SQL Check:**
```sql
-- Check if realtime is enabled
SELECT tablename, replication_set
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime';
```

### 3. **Stale Generation IDs in Hook**
The `generationIds` dependency might not update when new generations are created.

**Problem:**
```typescript
// ❌ WRONG: generationIds might not update in time
const [pendingGenerationIds, setPendingGenerationIds] = useState([]);

useGenerationRealtime({
  generationIds: pendingGenerationIds, // May be stale
  onComplete: handleComplete,
});
```

**Solution:**
Ensure `pendingGenerationIds` updates immediately when generations are created:

```typescript
// ✅ CORRECT: Update array immediately
const handleCreateGenerations = (newIds: string[]) => {
  setPendingGenerationIds(prev => [...prev, ...newIds]);
};
```

### 4. **Demo Mode Bypassing Real-time**
If `NEXT_PUBLIC_DEMO_MODE=true`, real-time updates are disabled.

**Check:**
```bash
# In .env.local
echo $NEXT_PUBLIC_DEMO_MODE

# Should be false or not set
NEXT_PUBLIC_DEMO_MODE=false
```

### 5. **Channel Not Properly Subscribed**
Real-time channel might not be subscribing correctly.

**Debug:**
```typescript
// Enable debug logging in useGenerationRealtime hook:
console.log('Creating channel:', channelName);
console.log('Subscription status:', status);

// Check in browser console for:
// "Realtime subscription active for generations" - means it's working
// "Realtime channel error" - means there's an issue
```

### 6. **Network/WebSocket Issue**
WebSocket connection might be blocked.

**Check:**
```javascript
// In browser console
const supabase = supabaseClient;
console.log('Supabase realtime:', supabase.channel('test'));
// Should not be undefined
```

### 7. **Data Not Matching Filter**
The real-time filter `user_id=eq.${userId}` might not match updated records.

**Verify:**
```sql
-- Check generation user_id matches current user
SELECT id, user_id, status FROM generations
WHERE id = 'generation-id-here'
AND user_id = 'user-id-here';
```

---

## Implementation Improvements

### Add Console Logging for Debugging
```typescript
// In useGenerationRealtime hook
const handleUpdate = useCallback((payload: { new: GenerationUpdate }) => {
  const generation = payload.new;
  console.log('📬 Real-time update received:', {
    id: generation.id,
    status: generation.status,
    processingMs: generation.processing_ms,
    tracked: generationIdsRef.current.has(generation.id),
  });

  if (!generationIdsRef.current.has(generation.id)) {
    console.log('⏭️ Skipping: generation not in tracked list');
    return;
  }

  console.log('✅ Processing real-time update');
  // ... rest of logic
}, []);
```

### Add Real-time Status Indicator
```typescript
// In UI component
const [realtimeConnected, setRealtimeConnected] = useState(false);

useEffect(() => {
  const supabase = getSupabaseClient();
  const channel = supabase.channel('health-check');

  channel
    .on('postgres_changes', { event: '*', schema: 'public', table: 'dummy' }, () => {})
    .subscribe(status => {
      setRealtimeConnected(status === 'SUBSCRIBED');
    });

  return () => supabase.removeChannel(channel);
}, []);

// Show indicator in UI
{!realtimeConnected && <div>⚠️ Real-time disconnected</div>}
```

---

## Testing Real-time

### 1. Local Testing
```typescript
// Manually trigger an update
const supabase = getSupabaseClient();
await supabase
  .from('generations')
  .update({ status: 'completed' })
  .eq('id', 'test-generation-id');
// Should see real-time callback in console
```

### 2. Monitor Browser Console
Look for these messages:
- ✅ "Realtime subscription active" = Good
- ❌ "Realtime channel error" = Problem
- ⚠️ "Supabase client not available" = Configuration issue

### 3. Check Network Tab
- Look for WebSocket connections in DevTools → Network
- Should see connections to Supabase real-time servers
- No 403/401 errors

---

## Quick Checklist

- [ ] Real-time enabled on `generations` table in Supabase
- [ ] UPDATE event is enabled for real-time
- [ ] RLS policies allow users to UPDATE their own records
- [ ] `NEXT_PUBLIC_DEMO_MODE` is false
- [ ] `generationIds` updates immediately when generations created
- [ ] Browser console shows "Realtime subscription active"
- [ ] WebSocket connection visible in Network tab
- [ ] generation `user_id` matches authenticated user
- [ ] Status is actually being updated to 'completed' in database

---

## Fake Progress Bar Integration

While real-time updates are being verified, the fake progress bar provides:
- ✅ Consistent UX across all users
- ✅ Accurate time estimation (based on averageTime)
- ✅ Smooth animations
- ✅ Fallback if real-time has issues

Real-time + Fake Progress Bar = Best UX ✨
