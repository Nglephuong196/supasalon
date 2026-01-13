import type { LayoutServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

const API_URL = 'http://localhost:8787';

interface Organization {
    id: string;
    name: string;
    slug: string | null;
    logo: string | null;
}

interface User {
    id: string;
    name: string;
    email: string;
    image: string | null;
}

interface SessionResponse {
    session: {
        id: string;
        userId: string;
        activeOrganizationId: string | null;
    } | null;
    user: User | null;
}

export const load: LayoutServerLoad = async ({ fetch, request, cookies }) => {
    const cookie = request.headers.get('cookie') || '';

    // Fetch session from API
    let session: SessionResponse | null = null;
    try {
        const sessionRes = await fetch(`${API_URL}/api/auth/get-session`, {
            headers: { cookie }
        });
        if (sessionRes.ok) {
            session = await sessionRes.json();
        }
    } catch (e) {
        console.error('Error fetching session:', e);
    }

    // If no session, redirect to login
    if (!session?.session || !session?.user) {
        throw redirect(302, '/login');
    }

    // Get organization ID from cookie or session
    let organizationId = cookies.get('organizationId') || session.session.activeOrganizationId;
    let organization: Organization | null = null;

    // If we have an org ID, fetch org details
    if (organizationId) {
        try {
            const orgRes = await fetch(`${API_URL}/api/auth/organization/get-full-organization`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    cookie
                },
                body: JSON.stringify({ organizationId })
            });
            if (orgRes.ok) {
                const orgData = await orgRes.json();
                organization = orgData;
            }
        } catch (e) {
            console.error('Error fetching organization:', e);
        }
    }

    // If no org but user is logged in, try to get their first organization
    if (!organization) {
        try {
            const orgsRes = await fetch(`${API_URL}/api/auth/organization/list`, {
                headers: { cookie }
            });
            if (orgsRes.ok) {
                const orgs = await orgsRes.json();
                if (orgs.length > 0) {
                    organization = orgs[0];
                    organizationId = orgs[0].id;
                }
            }
        } catch (e) {
            console.error('Error fetching organizations:', e);
        }
    }

    // Store org ID in cookie for subsequent requests
    if (organizationId) {
        cookies.set('organizationId', organizationId, {
            path: '/',
            httpOnly: true,
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 30 // 30 days
        });
    }

    return {
        user: session.user,
        organization,
        organizationId
    };
};
