import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import type { Booking } from '$lib/types';

const API_URL = 'http://localhost:8787';

export const load: PageServerLoad = async ({ fetch, request, cookies }) => {
    const organizationId = cookies.get('organizationId');

    if (!organizationId) {
        return { bookings: [] };
    }

    try {
        const response = await fetch(`${API_URL}/bookings`, {
            headers: {
                cookie: request.headers.get('cookie') || '',
                'X-Organization-Id': organizationId
            }
        });

        if (!response.ok) {
            throw error(response.status, 'Failed to fetch bookings');
        }

        const bookings: Booking[] = await response.json();
        return { bookings };
    } catch (e) {
        console.error('Error fetching bookings:', e);
        return { bookings: [] };
    }
};
