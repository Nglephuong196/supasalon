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

            if (response.ok) {
                session = await response.json();
            }
        } catch (error) {
            console.error('Failed to fetch session:', error);
        }
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

        // Create new headers with organization ID
        const headers = new Headers(request.headers);
        if (organizationId) {
            headers.set('X-Organization-Id', organizationId);
        }

        // Clone request with modified headers
        const modifiedRequest = new Request(request, { headers });

        return fetch(modifiedRequest);
    }

    return fetch(request);
};
