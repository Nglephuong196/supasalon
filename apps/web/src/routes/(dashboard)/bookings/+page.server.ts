import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const { data: bookings, error } = await locals.supabase
		.from('booking')
		.select('*, customer(name, phone), employee(name), service(name, price)')
		.order('booking_date', { ascending: false })
		.order('start_time', { ascending: false });

	return { bookings: bookings ?? [] };
};
