import type { PageServerLoad } from './$types';
import { redirect, error } from '@sveltejs/kit';
import type { Invoice } from '$lib/types';
import { RESOURCES, ACTIONS } from '@repo/constants';
import { checkPermission, getResourcePermissions } from '$lib/permissions';
import { PUBLIC_API_URL } from '$env/static/public';

export const load: PageServerLoad = async ({ fetch, cookies, parent }) => {
    const organizationId = cookies.get('organizationId');
    const { memberRole, memberPermissions } = await parent();

    // Check read permission - redirect if denied
    if (!checkPermission(memberRole, memberPermissions, RESOURCES.INVOICE, ACTIONS.READ)) {
        throw redirect(302, '/unauthorized');
    }

    // Get permission flags for UI
    const permissions = getResourcePermissions(memberRole, memberPermissions, RESOURCES.INVOICE);

    if (!organizationId) {
        return { invoices: [], ...permissions };
    }

    // handleFetch automatically injects cookies and X-Organization-Id
    try {
        const response = await fetch(`${PUBLIC_API_URL}/invoices`);

        if (response.status === 403) {
            throw redirect(302, '/unauthorized');
        }

        if (!response.ok) {
            throw error(response.status, 'Failed to fetch invoices');
        }

        const invoices: Invoice[] = await response.json();
        return { invoices, ...permissions };
    } catch (e) {
        if ((e as any)?.status === 302) throw e;
        console.error('Error fetching invoices:', e);
        return { invoices: [], ...permissions };
    }
};
