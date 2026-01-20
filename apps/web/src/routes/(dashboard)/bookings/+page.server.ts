import type { PageServerLoad, Actions } from './$types';
import { redirect, error, fail } from '@sveltejs/kit';
import { RESOURCES, ACTIONS } from '@repo/constants';
import { checkPermission, getResourcePermissions } from '$lib/permissions';
import { PUBLIC_API_URL } from '$env/static/public';

interface BookingFilters {
    from?: string;
    to?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
}

export const load: PageServerLoad = async ({ fetch, request, cookies, parent, url }) => {
    const organizationId = cookies.get('organizationId');
    const { memberRole, memberPermissions } = await parent();

    // Check read permission - redirect if denied
    if (!checkPermission(memberRole, memberPermissions, RESOURCES.BOOKING, ACTIONS.READ)) {
        throw redirect(302, '/unauthorized');
    }

    // Get permission flags for UI
    const permissions = getResourcePermissions(memberRole, memberPermissions, RESOURCES.BOOKING);

    if (!organizationId) {
        return {
            bookings: [],
            stats: { total: 0, pending: 0, confirmed: 0, completed: 0, cancelled: 0, cancelRate: 0 },
            pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
            filters: {},
            customers: [],
            services: [],
            ...permissions
        };
    }

    // Get filters from URL
    const from = url.searchParams.get('from') || '';
    const to = url.searchParams.get('to') || '';
    const status = url.searchParams.get('status') || 'all';
    const search = url.searchParams.get('search') || '';
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');

    const filters: BookingFilters = { from, to, status, search, page, limit };

    // Build query string
    const queryParams = new URLSearchParams();
    if (from) queryParams.set('from', from);
    if (to) queryParams.set('to', to);
    if (status && status !== 'all') queryParams.set('status', status);
    if (search) queryParams.set('search', search);
    queryParams.set('page', page.toString());
    queryParams.set('limit', limit.toString());

    const headers = {
        cookie: request.headers.get('cookie') || '',
        'X-Organization-Id': organizationId
    };

    try {
        // Fetch bookings with filters
        const [bookingsRes, statsRes, customersRes, servicesRes, categoriesRes, membersRes] = await Promise.all([
            fetch(`${PUBLIC_API_URL}/bookings?${queryParams.toString()}`, { headers }),
            fetch(`${PUBLIC_API_URL}/bookings/stats?${from ? `from=${from}` : ''}${to ? `&to=${to}` : ''}`, { headers }),
            fetch(`${PUBLIC_API_URL}/customers`, { headers }),
            fetch(`${PUBLIC_API_URL}/services`, { headers }),
            fetch(`${PUBLIC_API_URL}/services/categories`, { headers }),
            fetch(`${PUBLIC_API_URL}/members`, { headers }),
        ]);

        if (bookingsRes.status === 403) {
            throw redirect(302, '/unauthorized');
        }

        const bookingsData = bookingsRes.ok ? await bookingsRes.json() : { data: [], total: 0, page: 1, limit: 20, totalPages: 0 };
        const stats = statsRes.ok ? await statsRes.json() : { total: 0, pending: 0, confirmed: 0, completed: 0, cancelled: 0, cancelRate: 0 };
        const customers = customersRes.ok ? await customersRes.json() : [];
        const services = servicesRes.ok ? await servicesRes.json() : [];
        const serviceCategories = categoriesRes.ok ? await categoriesRes.json() : [];
        const members = membersRes.ok ? await membersRes.json() : [];

        return {
            bookings: bookingsData.data || [],
            stats,
            pagination: {
                page: bookingsData.page || 1,
                limit: bookingsData.limit || 20,
                total: bookingsData.total || 0,
                totalPages: bookingsData.totalPages || 0,
            },
            filters,
            customers,
            services,
            serviceCategories,
            members,
            ...permissions
        };
    } catch (e) {
        if ((e as any)?.status === 302) throw e;
        console.error('Error fetching bookings:', e);
        return {
            bookings: [],
            stats: { total: 0, pending: 0, confirmed: 0, completed: 0, cancelled: 0, cancelRate: 0 },
            pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
            filters,
            customers: [],
            services: [],
            serviceCategories: [],
            members: [],
            ...permissions
        };
    }
};

export const actions: Actions = {
    create: async ({ request, fetch, cookies }) => {
        const organizationId = cookies.get('organizationId');
        if (!organizationId) return fail(401, { message: 'Unauthorized' });

        const data = await request.formData();
        const customerId = data.get('customerId');
        const serviceIds = data.getAll('serviceId');
        const memberIds = data.getAll('memberId');
        const date = data.get('date');
        const notes = data.get('notes') || '';
        const guestCount = parseInt(data.get('guestCount')?.toString() || '1');

        if (!customerId || serviceIds.length === 0 || !date) {
            return fail(400, { message: 'Missing required fields' });
        }

        const services = serviceIds.map((id, index) => ({
            serviceId: parseInt(id.toString()),
            memberId: memberIds[index]?.toString() || undefined
        }));

        try {
            const res = await fetch(`${PUBLIC_API_URL}/bookings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    cookie: request.headers.get('cookie') || '',
                    'X-Organization-Id': organizationId,
                },
                body: JSON.stringify({
                    customerId: parseInt(customerId as string),
                    services,
                    guestCount,
                    date: new Date(date as string).toISOString(),
                    notes,
                    status: 'pending',
                }),
            });

            if (!res.ok) {
                const err = await res.json();
                return fail(res.status, { message: err.error || 'Failed to create booking' });
            }

            return { success: true };
        } catch (e) {
            console.error('Create booking error:', e);
            return fail(500, { message: 'Server error' });
        }
    },

    updateStatus: async ({ request, fetch, cookies }) => {
        const organizationId = cookies.get('organizationId');
        if (!organizationId) return fail(401, { message: 'Unauthorized' });

        const data = await request.formData();
        const id = data.get('id');
        const status = data.get('status');

        if (!id || !status) {
            return fail(400, { message: 'Missing required fields' });
        }

        try {
            const res = await fetch(`${PUBLIC_API_URL}/bookings/${id}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    cookie: request.headers.get('cookie') || '',
                    'X-Organization-Id': organizationId,
                },
                body: JSON.stringify({ status }),
            });

            if (!res.ok) {
                const err = await res.json();
                return fail(res.status, { message: err.error || 'Failed to update status' });
            }

            return { success: true };
        } catch (e) {
            console.error('Update status error:', e);
            return fail(500, { message: 'Server error' });
        }
    },

    delete: async ({ request, fetch, cookies }) => {
        const organizationId = cookies.get('organizationId');
        if (!organizationId) return fail(401, { message: 'Unauthorized' });

        const data = await request.formData();
        const id = data.get('id');

        if (!id) {
            return fail(400, { message: 'Missing booking ID' });
        }

        try {
            const res = await fetch(`${PUBLIC_API_URL}/bookings/${id}`, {
                method: 'DELETE',
                headers: {
                    cookie: request.headers.get('cookie') || '',
                    'X-Organization-Id': organizationId,
                },
            });

            if (!res.ok) {
                const err = await res.json();
                return fail(res.status, { message: err.error || 'Failed to delete booking' });
            }

            return { success: true };
        } catch (e) {
            console.error('Delete booking error:', e);
            return fail(500, { message: 'Server error' });
        }
    },

    createCustomer: async ({ request, fetch, cookies }) => {
        const organizationId = cookies.get('organizationId');
        if (!organizationId) return fail(401, { message: 'Unauthorized' });

        const data = await request.formData();
        const name = data.get('name');
        const phone = data.get('phone');

        if (!name || !phone) {
            return fail(400, { message: 'Missing required fields' });
        }

        try {
            const res = await fetch(`${PUBLIC_API_URL}/customers`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    cookie: request.headers.get('cookie') || '',
                    'X-Organization-Id': organizationId,
                },
                body: JSON.stringify({ name, phone }),
            });

            if (!res.ok) {
                const err = await res.json();
                return fail(res.status, { message: err.error || 'Failed to create customer' });
            }

            const newCustomer = await res.json();
            return { success: true, customer: newCustomer };
        } catch (e) {
            console.error('Create customer error:', e);
            return fail(500, { message: 'Server error' });
        }
    },
};
