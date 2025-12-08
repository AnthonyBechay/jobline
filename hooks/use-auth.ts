'use client';

import { useState, useEffect } from 'react';
import { getClientSession } from '@/app/actions/auth';
import type { Session } from '@/lib/auth';

export function useSession() {
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchSession() {
            try {
                const { data } = await getClientSession();
                setSession(data);
            } catch (error) {
                console.error('Failed to fetch session', error);
            } finally {
                setLoading(false);
            }
        }

        fetchSession();
    }, []);

    return {
        data: session ? { user: session.user } : null,
        isPending: loading,
    };
}
