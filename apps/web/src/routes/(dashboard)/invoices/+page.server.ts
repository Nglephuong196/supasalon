import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import type { Invoice } from '$lib/types';

const API_URL = 'http://localhost:8787';

export const load: PageServerLoad = async ({ fetch, request, cookies }) => {
    const organizationId = cookies.get('organizationId');

    if (!organizationId) {
        return { invoices: [] };
    }

    try {
        const response = await fetch(`${API_URL}/invoices`, {
            headers: {
                cookie: request.headers.get('cookie') || '',
                'X-Organization-Id': organizationId
            }
        });

        if (!response.ok) {
            throw error(response.status, 'Failed to fetch invoices');
        }

        const invoices: Invoice[] = await response.json();
        return { invoices };
    } catch (e) {
        console.error('Error fetching invoices:', e);
        return { invoices: [] };
    }
};
