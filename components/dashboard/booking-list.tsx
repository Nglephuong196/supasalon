import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const recentBookings = [
  {
    id: "BK001",
    customer: "Nguyễn Văn A",
    service: "Cắt tóc nam",
    staff: "Trần B",
    time: "09:00 AM",
    status: "Confirmed",
    amount: "150.000đ",
  },
  {
    id: "BK002",
    customer: "Trần Thị C",
    service: "Gội đầu & Massage",
    staff: "Lê D",
    time: "10:30 AM",
    status: "Pending",
    amount: "200.000đ",
  },
  {
    id: "BK003",
    customer: "Phạm Văn E",
    service: "Nhuộm tóc",
    staff: "Nguyễn F",
    time: "01:00 PM",
    status: "Completed",
    amount: "500.000đ",
  },
  {
    id: "BK004",
    customer: "Hoàng Thị G",
    service: "Làm móng",
    staff: "Phạm H",
    time: "02:30 PM",
    status: "Cancelled",
    amount: "100.000đ",
  },
  {
    id: "BK005",
    customer: "Vũ Văn I",
    service: "Cạo mặt",
    staff: "Trần B",
    time: "04:00 PM",
    status: "Confirmed",
    amount: "50.000đ",
  },
];

export function BookingList() {
  return (
    <div className="rounded-md border bg-white dark:bg-zinc-950">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Khách hàng</TableHead>
            <TableHead>Dịch vụ</TableHead>
            <TableHead>Nhân viên</TableHead>
            <TableHead>Thời gian</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead className="text-right">Tổng tiền</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {recentBookings.map((booking) => (
            <TableRow key={booking.id}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                        <AvatarFallback>{booking.customer[0]}</AvatarFallback>
                    </Avatar>
                    {booking.customer}
                </div>
              </TableCell>
              <TableCell>{booking.service}</TableCell>
              <TableCell>{booking.staff}</TableCell>
              <TableCell>{booking.time}</TableCell>
              <TableCell>
                <Badge
                  variant={
                    booking.status === "Confirmed"
                      ? "default"
                      : booking.status === "Completed"
                      ? "secondary" // Changed from success to secondary as success isn't default
                      : booking.status === "Pending"
                      ? "outline" // Changed from warning to outline
                      : "destructive"
                  }
                  className={
                      booking.status === "Confirmed" ? "bg-blue-500 hover:bg-blue-600" :
                      booking.status === "Completed" ? "bg-green-500 hover:bg-green-600 text-white" :
                      booking.status === "Pending" ? "bg-yellow-500 hover:bg-yellow-600 text-white border-0" :
                      ""
                  }
                >
                  {booking.status === "Confirmed" ? "Đã xác nhận" :
                   booking.status === "Completed" ? "Hoàn thành" :
                   booking.status === "Pending" ? "Chờ duyệt" : "Đã hủy"}
                </Badge>
              </TableCell>
              <TableCell className="text-right">{booking.amount}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
