import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { type ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";

type ColumnMeta = {
  className?: string;
  headerClassName?: string;
};

type DataTableProps<TData> = {
  data: TData[];
  columns: Array<ColumnDef<TData>>;
  loading?: boolean;
  loadingMessage?: string;
  emptyMessage?: string;
  className?: string;
};

function getMeta(meta: unknown): ColumnMeta {
  if (!meta || typeof meta !== "object") return {};
  return meta as ColumnMeta;
}

export function DataTable<TData>({
  data,
  columns,
  loading = false,
  loadingMessage = "Đang tải...",
  emptyMessage = "Không có dữ liệu",
  className,
}: DataTableProps<TData>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const columnCount = Math.max(columns.length, 1);

  return (
    <Table className={cn("w-full text-sm", className)}>
      <TableHeader className="bg-muted/40">
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => {
              const meta = getMeta(header.column.columnDef.meta);
              return (
                <TableHead key={header.id} className={cn("px-3 py-2", meta.headerClassName)}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              );
            })}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {loading ? (
          <TableRow>
            <TableCell
              colSpan={columnCount}
              className="px-3 py-4 text-center text-muted-foreground"
            >
              {loadingMessage}
            </TableCell>
          </TableRow>
        ) : table.getRowModel().rows.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={columnCount}
              className="px-3 py-4 text-center text-muted-foreground"
            >
              {emptyMessage}
            </TableCell>
          </TableRow>
        ) : (
          table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => {
                const meta = getMeta(cell.column.columnDef.meta);
                return (
                  <TableCell key={cell.id} className={cn("px-3 py-2", meta.className)}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                );
              })}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
