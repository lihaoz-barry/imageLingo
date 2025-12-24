import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase-server';

export async function GET() {
    const supabase = createSupabaseAdminClient();

    if (!supabase) {
        return NextResponse.json({ error: 'Supabase admin client not initialized' }, { status: 500 });
    }

    try {
        const { data: buckets, error: listError } = await supabase.storage.listBuckets();
        if (listError) throw listError;

        // Fix: Explicitly type parameter b
        const imagesBucket = buckets.find((b: { name: string }) => b.name === 'images');

        if (!imagesBucket) {
            const { error: createError } = await supabase.storage.createBucket('images', {
                public: false,
                fileSizeLimit: 52428800, // 50MB
                allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
            });

            if (createError) throw createError;
            return NextResponse.json({ message: 'Created images bucket' });
        }

        return NextResponse.json({ message: 'Images bucket already exists' });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
