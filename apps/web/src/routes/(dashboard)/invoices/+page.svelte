<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let searchQuery = $state('');

	const filteredInvoices = $derived(
		data.invoices.filter(invoice =>
			invoice.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
			invoice.invoice_number?.toLowerCase().includes(searchQuery.toLowerCase())
		)
	);

	function formatPrice(price: number) {
		return new Intl.NumberFormat('vi-VN', {
			style: 'currency',
			currency: 'VND'
		}).format(price);
	}

	function getStatusBadge(status: string) {
		switch (status) {
			case 'paid': return { class: 'bg-green-100 text-green-700', text: 'Đã thanh toán' };
			case 'cancelled': return { class: 'bg-red-100 text-red-700', text: 'Đã hủy' };
			case 'refunded': return { class: 'bg-orange-100 text-orange-700', text: 'Hoàn tiền' };
			default: return { class: 'bg-yellow-100 text-yellow-700', text: 'Chờ thanh toán' };
		}
	}
</script>

<div class="flex flex-col gap-6">
	<!-- Header -->
	<div class="flex flex-col gap-4">
		<h1 class="text-2xl font-bold tracking-tight">Hóa đơn</h1>
		<div class="flex flex-col sm:flex-row gap-4 justify-between">
			<div class="relative flex-1 max-w-sm">
				<svg xmlns="http://www.w3.org/2000/svg" class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
				</svg>
				<input
					type="text"
					placeholder="Tìm kiếm hóa đơn..."
					bind:value={searchQuery}
					class="input pl-10"
				/>
			</div>
			<button class="btn btn-primary btn-md">
				<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M5 12h14"/><path d="M12 5v14"/>
				</svg>
				Tạo hóa đơn
			</button>
		</div>
	</div>

	<!-- Table -->
	<div class="card">
		<div class="overflow-x-auto">
			<table class="table w-full">
				<thead class="table-header">
					<tr>
						<th class="table-head">Mã hóa đơn</th>
						<th class="table-head">Khách hàng</th>
						<th class="table-head">Ngày tạo</th>
						<th class="table-head">Tổng tiền</th>
						<th class="table-head">Trạng thái</th>
						<th class="table-head w-[100px]">Thao tác</th>
					</tr>
				</thead>
				<tbody class="table-body">
					{#if filteredInvoices.length === 0}
						<tr>
							<td colspan="6" class="table-cell text-center py-8 text-muted-foreground">
								{searchQuery ? 'Không tìm thấy hóa đơn nào' : 'Chưa có hóa đơn nào'}
							</td>
						</tr>
					{:else}
						{#each filteredInvoices as invoice}
							{@const status = getStatusBadge(invoice.status)}
							<tr class="table-row">
								<td class="table-cell font-medium">{invoice.invoice_number}</td>
								<td class="table-cell">
									<div>
										<div class="font-medium">{invoice.customer?.name}</div>
										<div class="text-sm text-muted-foreground">{invoice.customer?.phone}</div>
									</div>
								</td>
								<td class="table-cell">
									{new Date(invoice.created_at).toLocaleDateString('vi-VN')}
								</td>
								<td class="table-cell font-medium">{formatPrice(invoice.total_amount)}</td>
								<td class="table-cell">
									<span class="badge {status.class}">{status.text}</span>
								</td>
								<td class="table-cell">
									<div class="flex items-center gap-2">
										<button class="btn btn-ghost btn-icon" title="Xem chi tiết">
											<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
												<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>
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
