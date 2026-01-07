<script lang="ts">
	import StatsCard from '$lib/components/dashboard/StatsCard.svelte';

	let formattedDate = $state('');

	$effect(() => {
		const today = new Date();
		formattedDate = today.toLocaleDateString('vi-VN', {
			weekday: 'long',
			day: 'numeric',
			month: 'long',
			year: 'numeric'
		});
	});
</script>

<div class="flex flex-col gap-6">
	<!-- Header Section -->
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
		<div>
			<h1 class="text-2xl font-bold tracking-tight">
				Chào mừng trở lại, Salon Pro
			</h1>
			<p class="text-muted-foreground">
				Đây là những gì đang xảy ra tại salon của bạn hôm nay.
			</p>
		</div>
		<div class="flex items-center gap-3">
			<span class="text-sm text-muted-foreground capitalize">
				{formattedDate}
			</span>
			<button class="btn btn-primary btn-md">
				<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M5 12h14"/><path d="M12 5v14"/>
				</svg>
				Tạo lịch hẹn mới
			</button>
		</div>
	</div>

	<!-- Stats Cards -->
	<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
		<StatsCard
			title="Tổng doanh thu"
			value="12.450.000đ"
			description="so với tháng trước"
			icon="dollar-sign"
			trend="up"
			trendValue="+12%"
			iconBgColor="bg-purple-100"
			iconColor="text-purple-600"
		/>
		<StatsCard
			title="Lịch hẹn hôm nay"
			value="45"
			description="so với hôm qua"
			icon="calendar-days"
			trend="up"
			trendValue="+5%"
			iconBgColor="bg-blue-100"
			iconColor="text-blue-600"
		/>
		<StatsCard
			title="Khách hàng mới"
			value="8"
			description="so với tuần trước"
			icon="users"
			trend="up"
			trendValue="+2%"
			iconBgColor="bg-green-100"
			iconColor="text-green-600"
		/>
		<StatsCard
			title="Giá trị trung bình"
			value="85.000đ"
			description="so với tháng trước"
			icon="trending-up"
			trend="up"
			trendValue="+1.5%"
			iconBgColor="bg-orange-100"
			iconColor="text-orange-600"
		/>
	</div>

	<!-- Main Content Grid -->
	<div class="grid gap-6 lg:grid-cols-5">
		<!-- Revenue Chart - Takes 3 columns -->
		<div class="lg:col-span-3">
			<div class="card">
				<div class="card-header">
					<h3 class="text-lg font-semibold">Doanh thu theo tháng</h3>
					<p class="text-sm text-muted-foreground">Biểu đồ doanh thu 12 tháng gần nhất</p>
				</div>
				<div class="card-content">
					<div class="h-[300px] flex items-center justify-center text-muted-foreground">
						Biểu đồ doanh thu sẽ hiển thị ở đây
					</div>
				</div>
			</div>
		</div>
		<!-- Today's Schedule - Takes 2 columns -->
		<div class="lg:col-span-2">
			<div class="card h-full">
				<div class="card-header">
					<h3 class="text-lg font-semibold">Lịch hẹn hôm nay</h3>
					<p class="text-sm text-muted-foreground">Các cuộc hẹn sắp tới</p>
				</div>
				<div class="card-content">
					<div class="space-y-4">
						{#each [
							{ time: '09:00', customer: 'Nguyễn Văn A', service: 'Cắt tóc nam', stylist: 'Minh' },
							{ time: '10:30', customer: 'Trần Thị B', service: 'Nhuộm tóc', stylist: 'Hương' },
							{ time: '11:00', customer: 'Lê Văn C', service: 'Uốn tóc', stylist: 'Lan' },
							{ time: '14:00', customer: 'Phạm Thị D', service: 'Gội đầu', stylist: 'Minh' }
						] as booking}
							<div class="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
								<div class="text-sm font-medium w-12">{booking.time}</div>
								<div class="flex-1">
									<div class="font-medium">{booking.customer}</div>
									<div class="text-sm text-muted-foreground">{booking.service}</div>
								</div>
								<div class="text-sm text-muted-foreground">{booking.stylist}</div>
							</div>
						{/each}
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Bottom Section -->
	<div class="grid gap-6 md:grid-cols-2">
		<!-- Top Stylists -->
		<div class="card">
			<div class="card-header">
				<h3 class="text-lg font-semibold">Nhân viên xuất sắc</h3>
				<p class="text-sm text-muted-foreground">Top 5 nhân viên có doanh thu cao nhất</p>
			</div>
			<div class="card-content">
				<div class="space-y-4">
					{#each [
						{ name: 'Nguyễn Minh', revenue: '5.200.000đ', bookings: 45 },
						{ name: 'Trần Hương', revenue: '4.800.000đ', bookings: 42 },
						{ name: 'Lê Lan', revenue: '4.500.000đ', bookings: 38 },
						{ name: 'Phạm Đức', revenue: '4.200.000đ', bookings: 35 },
						{ name: 'Hoàng Mai', revenue: '3.900.000đ', bookings: 32 }
					] as stylist, i}
						<div class="flex items-center gap-4">
							<div class="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
								{i + 1}
							</div>
							<div class="flex-1">
								<div class="font-medium">{stylist.name}</div>
								<div class="text-sm text-muted-foreground">{stylist.bookings} lịch hẹn</div>
							</div>
							<div class="text-sm font-medium">{stylist.revenue}</div>
						</div>
					{/each}
				</div>
			</div>
		</div>

		<!-- Low Stock Alerts -->
		<div class="card">
			<div class="card-header">
				<h3 class="text-lg font-semibold">Cảnh báo tồn kho</h3>
				<p class="text-sm text-muted-foreground">Sản phẩm sắp hết hàng</p>
			</div>
			<div class="card-content">
				<div class="space-y-4">
					{#each [
						{ name: 'Dầu gội Loreal', stock: 3, unit: 'chai' },
						{ name: 'Thuốc nhuộm Revlon', stock: 5, unit: 'hộp' },
						{ name: 'Kéo cắt tóc', stock: 2, unit: 'cái' },
						{ name: 'Wax vuốt tóc', stock: 4, unit: 'hũ' }
					] as product}
						<div class="flex items-center gap-4 p-3 rounded-lg bg-red-50 border border-red-100">
							<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
								<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>
							</svg>
							<div class="flex-1">
								<div class="font-medium">{product.name}</div>
								<div class="text-sm text-red-600">Còn {product.stock} {product.unit}</div>
							</div>
							<button class="btn btn-outline btn-sm">Đặt hàng</button>
						</div>
					{/each}
				</div>
			</div>
		</div>
	</div>
</div>
