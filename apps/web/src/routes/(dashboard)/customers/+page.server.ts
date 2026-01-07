import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const { data: customers, error } = await locals.supabase
		.from('customer')
		.select('*')
		.order('created_at', { ascending: false });

	if (error) {
		console.error('Error fetching customers:', error);
		return { customers: [] };
	}

	return { customers: customers ?? [] };
};
