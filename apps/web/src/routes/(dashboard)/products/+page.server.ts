import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const { data: products, error } = await locals.supabase
		.from('product')
		.select('*')
		.order('name');

	return { products: products ?? [] };
};
