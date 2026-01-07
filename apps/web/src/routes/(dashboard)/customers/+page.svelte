<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let searchQuery = $state('');
	let showAddDialog = $state(false);

	const filteredCustomers = $derived(
		data.customers.filter(customer =>
			customer.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
			customer.phone?.includes(searchQuery) ||
			customer.email?.toLowerCase().includes(searchQuery.toLowerCase())
		)
	);
</script>

<div class="flex flex-col gap-6">
	<!-- Header -->
	<div class="flex flex-col gap-4">
		<h1 class="text-2xl font-bold tracking-tight">Khách hàng</h1>
		<div class="flex flex-col sm:flex-row gap-4 justify-between">
			<div class="relative flex-1 max-w-sm">
				<svg xmlns="http://www.w3.org/2000/svg" class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
				</svg>
				<input
					type="text"
					placeholder="Tìm kiếm khách hàng..."
					bind:value={searchQuery}
					class="input pl-10"
				/>
			</div>
			<button class="btn btn-primary btn-md" onclick={() => showAddDialog = true}>
				<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M5 12h14"/><path d="M12 5v14"/>
				</svg>
				Thêm khách hàng
			</button>
		</div>
	</div>

	<!-- Table -->
	<div class="card">
		<div class="overflow-x-auto">
			<table class="table w-full">
				<thead class="table-header">
					<tr>
						<th class="table-head">Tên khách hàng</th>
						<th class="table-head">Số điện thoại</th>
						<th class="table-head">Email</th>
						<th class="table-head">Giới tính</th>
						<th class="table-head">Ngày sinh</th>
						<th class="table-head">Ghi chú</th>
						<th class="table-head w-[100px]">Thao tác</th>
					</tr>
				</thead>
				<tbody class="table-body">
					{#if filteredCustomers.length === 0}
						<tr>
							<td colspan="7" class="table-cell text-center py-8 text-muted-foreground">
								{searchQuery ? 'Không tìm thấy khách hàng nào' : 'Chưa có khách hàng nào'}
							</td>
						</tr>
					{:else}
						{#each filteredCustomers as customer}
							<tr class="table-row">
								<td class="table-cell font-medium">{customer.name}</td>
								<td class="table-cell">{customer.phone || '-'}</td>
								<td class="table-cell">{customer.email || '-'}</td>
								<td class="table-cell">
									{#if customer.gender === 'male'}
										<span class="badge badge-secondary">Nam</span>
									{:else if customer.gender === 'female'}
										<span class="badge badge-secondary">Nữ</span>
									{:else}
										<span class="text-muted-foreground">-</span>
									{/if}
								</td>
								<td class="table-cell">
									{customer.date_of_birth 
										? new Date(customer.date_of_birth).toLocaleDateString('vi-VN') 
										: '-'}
								</td>
								<td class="table-cell text-muted-foreground">{customer.notes || '-'}</td>
								<td class="table-cell">
									<div class="flex items-center gap-2">
										<button class="btn btn-ghost btn-icon" title="Chỉnh sửa">
											<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
												<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/>
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
