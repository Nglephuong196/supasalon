import type { LayoutServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import type { Permissions } from '@repo/constants';

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

interface MemberWithPermissions {
    id: string;
    role: string;
    // Note: permissions is an array because it's a "many" relation in the schema
    permissions: Array<{ permissions: Permissions }>;
}

export const load: LayoutServerLoad = async ({ fetch, request, cookies, url }) => {
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
        cookies.delete('organizationId', { path: '/' });
        throw redirect(302, '/signin');
    }

    // Get organization ID from cookie or session
    let organizationId: string | null | undefined = cookies.get('organizationId') || session.session.activeOrganizationId;
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
            } else {
                // If fetching org fails (e.g. 403 not member), clear the invalid ID
                organizationId = null;
            }
        } catch (e) {
            console.error('Error fetching organization:', e);
            organizationId = null;
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

    // Store org ID in cookie for subsequent requests OR clear it if invalid
    if (organizationId) {
        cookies.set('organizationId', organizationId, {
            path: '/',
            httpOnly: true,
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 30 // 30 days
        });
    } else {
        cookies.delete('organizationId', { path: '/' });
    }

    // Fetch member data with permissions
    let memberRole: string = 'member';
    let memberPermissions: Permissions | null = null;

    if (organizationId) {
        try {
            const membersRes = await fetch(`${API_URL}/members`, {
                headers: {
                    cookie,
                    'X-Organization-Id': organizationId
                }
            });
            if (membersRes.ok) {
                const members: MemberWithPermissions[] = await membersRes.json();
                // Find current user's member record
                const currentMember = members.find(m => {
                    // Member should have a user property with id matching session user
                    return (m as any).user?.id === session?.user?.id || (m as any).userId === session?.user?.id;
                });
                if (currentMember) {
                    memberRole = currentMember.role;
                    // permissions is an array (many relation), get first record's permissions
                    memberPermissions = currentMember.permissions?.[0]?.permissions || null;
                }
            }
        } catch (e) {
            console.error('Error fetching member permissions:', e);
        }
    }

    return {
        user: session.user,
        organization,
        organizationId,
        memberRole,
        memberPermissions
    };
};
