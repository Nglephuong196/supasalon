<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let searchQuery = $state('');
	let selectedCategory = $state<string | null>(null);

	const filteredServices = $derived(
		data.services.filter(service => {
			const matchesSearch = service.name?.toLowerCase().includes(searchQuery.toLowerCase());
			const matchesCategory = !selectedCategory || service.category_id === selectedCategory;
			return matchesSearch && matchesCategory;
		})
	);

	function formatPrice(price: number) {
		return new Intl.NumberFormat('vi-VN', {
			style: 'currency',
			currency: 'VND'
		}).format(price);
	}
</script>

<div class="flex flex-col gap-6">
	<!-- Header -->
	<div class="flex flex-col gap-4">
		<h1 class="text-2xl font-bold tracking-tight">Dịch vụ</h1>
		<div class="flex flex-col sm:flex-row gap-4 justify-between">
			<div class="flex gap-4 flex-1">
				<div class="relative flex-1 max-w-sm">
					<svg xmlns="http://www.w3.org/2000/svg" class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
					</svg>
					<input
						type="text"
						placeholder="Tìm kiếm dịch vụ..."
						bind:value={searchQuery}
						class="input pl-10"
					/>
				</div>
				<select bind:value={selectedCategory} class="input w-auto">
					<option value={null}>Tất cả danh mục</option>
					{#each data.categories as category}
						<option value={category.id}>{category.name}</option>
					{/each}
				</select>
			</div>
			<button class="btn btn-primary btn-md">
				<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M5 12h14"/><path d="M12 5v14"/>
				</svg>
				Thêm dịch vụ
			</button>
		</div>
	</div>

	<!-- Services Grid -->
	<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
		{#if filteredServices.length === 0}
			<div class="col-span-full text-center py-12 text-muted-foreground">
				{searchQuery ? 'Không tìm thấy dịch vụ nào' : 'Chưa có dịch vụ nào'}
			</div>
		{:else}
			{#each filteredServices as service}
				<div class="card p-4 hover:shadow-md transition-shadow">
					<div class="flex flex-col gap-3">
						<div class="flex items-start justify-between">
							<div>
								<h3 class="font-medium">{service.name}</h3>
								{#if service.service_category}
									<span class="badge badge-secondary text-xs mt-1">
										{service.service_category.name}
									</span>
								{/if}
							</div>
							<div class="flex gap-1">
								<button class="btn btn-ghost btn-icon" title="Chỉnh sửa">
									<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
										<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
									</svg>
								</button>
							</div>
						</div>
						{#if service.description}
							<p class="text-sm text-muted-foreground line-clamp-2">{service.description}</p>
						{/if}
						<div class="flex items-center justify-between pt-2 border-t">
							<div class="flex items-center gap-2 text-sm text-muted-foreground">
								<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
									<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
								</svg>
								{service.duration_minutes} phút
							</div>
							<div class="font-semibold text-primary">
								{formatPrice(service.price)}
							</div>
						</div>
					</div>
				</div>
			{/each}
		{/if}
	</div>
</div>
