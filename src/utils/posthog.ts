import posthog from 'posthog-js';

export function initPostHog() {
    const key = import.meta.env.VITE_POSTHOG_KEY;
    const host = import.meta.env.VITE_POSTHOG_HOST ?? 'https://us.i.posthog.com';
    const excludeDistinctIds = (import.meta.env.VITE_POSTHOG_EXCLUDE_DISTINCT_IDS ?? '')
        .split(',')
        .map((id: string) => id.trim())
        .filter(Boolean);

    if (!key) {
        if (import.meta.env.DEV) {
            console.warn('[posthog] VITE_POSTHOG_KEY not set; analytics disabled');
        }
        return;
    }

    posthog.init(key, {
        api_host: host,
        autocapture: true,
        capture_pageview: true,
        disable_session_recording: true,
        loaded: (ph) => {
            if (excludeDistinctIds.includes(ph.get_distinct_id())) {
                ph.opt_out_capturing();
                return;
            }
            ph.register({ app: 'signature' });
        },
    });
}

export { posthog };
