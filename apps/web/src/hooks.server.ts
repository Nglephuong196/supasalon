import { redirect, type Handle, type HandleFetch } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

// Define protected routes that require authentication (root is dashboard)
const protectedRoutes = ['/', '/bookings', '/customers', '/services', '/products', '/employees', '/invoices', '/settings'];

// Define auth routes (redirect to dashboard if already logged in)
const authRoutes = ['/signin', '/signup'];

// API URL for server-side calls
const API_URL = 'http://127.0.0.1:8787';

export const handle: Handle = async ({ event, resolve }) => {
    // Get session from cookies by calling the API
    const sessionCookie = event.cookies.get('better-auth.session_token');

    let session = null;

    if (sessionCookie) {
        try {
            // DEBUG LOGGING
            try {
                const fs = await import('fs');
                const path = await import('path');
                const logPath = path.resolve('debug_auth.log');
                fs.appendFileSync(logPath, `[${new Date().toISOString()}] HOOKS: Received session cookie: ${sessionCookie.substring(0, 10)}...\n`);
            } catch (err) { }

            // Fetch session from your API with timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);

            const response = await fetch(`${API_URL}/api/auth/get-session`, {
                headers: {
                    'Cookie': `better-auth.session_token=${sessionCookie}`
                },
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            // DEBUG LOGGING
            try {
                const fs = await import('fs');
                const path = await import('path');
                const logPath = path.resolve('debug_auth.log');
                fs.appendFileSync(logPath, `[${new Date().toISOString()}] HOOKS: API Response ${response.status} ${response.statusText}\n`);
            } catch (err) { }

            if (response.ok) {
                session = await response.json();
            }
        } catch (error) {
            console.error('Failed to fetch session:', error);
            // DEBUG LOGGING
            try {
                const fs = await import('fs');
                const path = await import('path');
                const logPath = path.resolve('debug_auth.log');
                fs.appendFileSync(logPath, `[${new Date().toISOString()}] HOOKS: Error fetching session: ${error}\n`);
            } catch (err) { }
        }
    } else {
        // DEBUG LOGGING
        try {
            const fs = await import('fs');
            const path = await import('path');
            const logPath = path.resolve('debug_auth.log');
            fs.appendFileSync(logPath, `[${new Date().toISOString()}] HOOKS: No session cookie found for ${event.url.pathname}\n`);
        } catch (err) { }
    }

    // Store session in locals for use in load functions
    event.locals.session = session;

    const pathname = event.url.pathname;

    // Check if trying to access protected route without session
    const isProtected = protectedRoutes.some(route => pathname === route || (route !== '/' && pathname.startsWith(route)));
    if (isProtected) {
        if (!session) {
            throw redirect(303, '/signin');
        }
    }

    // Check if trying to access auth routes while logged in
    if (authRoutes.some(route => pathname.startsWith(route))) {
        if (session) {
            throw redirect(303, '/');
        }
    }

    return resolve(event);
};

/**
 * handleFetch intercepts all fetch() calls made on the server.
 * We use it to automatically inject the X-Organization-Id header for API requests.
 */
export const handleFetch: HandleFetch = async ({ event, request, fetch }) => {
    // Check if request is to our API (both localhost and 127.0.0.1)
    const isApiRequest = request.url.startsWith('http://localhost:8787') ||
        request.url.startsWith('http://127.0.0.1:8787');

    if (isApiRequest) {
        const organizationId = event.cookies.get('organizationId');
        const sessionToken = event.cookies.get('better-auth.session_token');

        // Create new headers with organization ID and Session Token
        const headers = new Headers(request.headers);

        if (organizationId) {
            headers.set('X-Organization-Id', organizationId);
        }

        // Ensure session token is present in cookies
        if (sessionToken) {
            const currentCookie = headers.get('cookie') || '';
            // If cookie header doesn't already contain the token (or to be safe, just ensure it's there)
            // simplest way: append it or reconstruct.
            // SvelteKit's event.cookies.get verifies it exists.
            // Let's explicitly add it to ensure the API sees it.
            // We'll append it to likely existing cookies or start fresh if empty.
            // Using ; separator.
            const newCookie = currentCookie
                ? `${currentCookie}; better-auth.session_token=${sessionToken}`
                : `better-auth.session_token=${sessionToken}`;

            headers.set('cookie', newCookie);

            // DEBUG LOGGING - Trace if we are modifying headers
            try {
                const fs = await import('fs');
                const path = await import('path');
                const logPath = path.resolve('debug_auth.log');
                fs.appendFileSync(logPath, `[${new Date().toISOString()}] COOKIE INJECT: Injecting token into request to ${request.url}\n`);
            } catch (err) { }
        }

        // Clone request with modified headers
        const modifiedRequest = new Request(request, { headers });

        return fetch(modifiedRequest);
    }

    return fetch(request);
};
