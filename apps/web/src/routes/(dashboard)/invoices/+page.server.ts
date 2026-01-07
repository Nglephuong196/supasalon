import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const { data: invoices, error } = await locals.supabase
		.from('invoice')
		.select('*, customer(name, phone)')
		.order('created_at', { ascending: false });

	return { invoices: invoices ?? [] };
};
