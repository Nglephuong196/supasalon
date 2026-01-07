<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let searchQuery = $state('');

	const filteredProducts = $derived(
		data.products.filter(product =>
			product.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
			product.sku?.toLowerCase().includes(searchQuery.toLowerCase())
		)
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
		<h1 class="text-2xl font-bold tracking-tight">Sản phẩm</h1>
		<div class="flex flex-col sm:flex-row gap-4 justify-between">
			<div class="relative flex-1 max-w-sm">
				<svg xmlns="http://www.w3.org/2000/svg" class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
				</svg>
				<input
					type="text"
					placeholder="Tìm kiếm sản phẩm..."
					bind:value={searchQuery}
					class="input pl-10"
				/>
			</div>
			<button class="btn btn-primary btn-md">
				<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M5 12h14"/><path d="M12 5v14"/>
				</svg>
				Thêm sản phẩm
			</button>
		</div>
	</div>

	<!-- Table -->
	<div class="card">
		<div class="overflow-x-auto">
			<table class="table w-full">
				<thead class="table-header">
					<tr>
						<th class="table-head">Tên sản phẩm</th>
						<th class="table-head">SKU</th>
						<th class="table-head">Giá bán</th>
						<th class="table-head">Giá gốc</th>
						<th class="table-head">Tồn kho</th>
						<th class="table-head w-[100px]">Thao tác</th>
					</tr>
				</thead>
				<tbody class="table-body">
					{#if filteredProducts.length === 0}
						<tr>
							<td colspan="6" class="table-cell text-center py-8 text-muted-foreground">
								{searchQuery ? 'Không tìm thấy sản phẩm nào' : 'Chưa có sản phẩm nào'}
							</td>
						</tr>
					{:else}
						{#each filteredProducts as product}
							<tr class="table-row">
								<td class="table-cell font-medium">{product.name}</td>
								<td class="table-cell text-muted-foreground">{product.sku || '-'}</td>
								<td class="table-cell">{formatPrice(product.price)}</td>
								<td class="table-cell text-muted-foreground">{product.cost_price ? formatPrice(product.cost_price) : '-'}</td>
								<td class="table-cell">
									{#if product.stock <= 5}
										<span class="badge bg-red-100 text-red-700">{product.stock}</span>
									{:else}
										<span class="badge badge-secondary">{product.stock}</span>
									{/if}
								</td>
								<td class="table-cell">
									<div class="flex items-center gap-2">
										<button class="btn btn-ghost btn-icon" title="Chỉnh sửa">
											<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
												<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
											</svg>
										</button>
										<button class="btn btn-ghost btn-icon text-destructive" title="Xóa">
											<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
												<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
											</svg>
										</button>
									</div>
								</td>
							</tr>
						{/each}
					{/if}
				</tbody>
			</table>
		</div>
	</div>
</div>
