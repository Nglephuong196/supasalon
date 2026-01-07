<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let searchQuery = $state('');

	const filteredBookings = $derived(
		data.bookings.filter(booking =>
			booking.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
			booking.service?.name?.toLowerCase().includes(searchQuery.toLowerCase())
		)
	);

	function getStatusBadge(status: string) {
		switch (status) {
			case 'confirmed': return { class: 'bg-blue-100 text-blue-700', text: 'Đã xác nhận' };
			case 'completed': return { class: 'bg-green-100 text-green-700', text: 'Hoàn thành' };
			case 'cancelled': return { class: 'bg-red-100 text-red-700', text: 'Đã hủy' };
			case 'no_show': return { class: 'bg-gray-100 text-gray-700', text: 'Không đến' };
			default: return { class: 'bg-yellow-100 text-yellow-700', text: 'Chờ xác nhận' };
		}
	}
</script>

<div class="flex flex-col gap-6">
	<!-- Header -->
	<div class="flex flex-col gap-4">
		<h1 class="text-2xl font-bold tracking-tight">Lịch hẹn</h1>
		<div class="flex flex-col sm:flex-row gap-4 justify-between">
			<div class="relative flex-1 max-w-sm">
				<svg xmlns="http://www.w3.org/2000/svg" class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
				</svg>
				<input
					type="text"
					placeholder="Tìm kiếm lịch hẹn..."
					bind:value={searchQuery}
					class="input pl-10"
				/>
			</div>
			<button class="btn btn-primary btn-md">
				<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M5 12h14"/><path d="M12 5v14"/>
				</svg>
				Tạo lịch hẹn
			</button>
		</div>
	</div>

	<!-- Table -->
	<div class="card">
		<div class="overflow-x-auto">
			<table class="table w-full">
				<thead class="table-header">
					<tr>
						<th class="table-head">Ngày</th>
						<th class="table-head">Giờ</th>
						<th class="table-head">Khách hàng</th>
						<th class="table-head">Dịch vụ</th>
						<th class="table-head">Nhân viên</th>
						<th class="table-head">Trạng thái</th>
						<th class="table-head w-[100px]">Thao tác</th>
					</tr>
				</thead>
				<tbody class="table-body">
					{#if filteredBookings.length === 0}
						<tr>
							<td colspan="7" class="table-cell text-center py-8 text-muted-foreground">
								{searchQuery ? 'Không tìm thấy lịch hẹn nào' : 'Chưa có lịch hẹn nào'}
							</td>
						</tr>
					{:else}
						{#each filteredBookings as booking}
							{@const status = getStatusBadge(booking.status)}
							<tr class="table-row">
								<td class="table-cell">
									{new Date(booking.booking_date).toLocaleDateString('vi-VN')}
								</td>
								<td class="table-cell font-medium">{booking.start_time?.slice(0, 5)}</td>
								<td class="table-cell">
									<div>
										<div class="font-medium">{booking.customer?.name}</div>
										<div class="text-sm text-muted-foreground">{booking.customer?.phone}</div>
									</div>
								</td>
								<td class="table-cell">{booking.service?.name}</td>
								<td class="table-cell">{booking.employee?.name || '-'}</td>
								<td class="table-cell">
									<span class="badge {status.class}">{status.text}</span>
								</td>
								<td class="table-cell">
									<div class="flex items-center gap-2">
										<button class="btn btn-ghost btn-icon" title="Chỉnh sửa">
											<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
												<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
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
