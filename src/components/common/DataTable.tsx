import { ReactNode } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface Column<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (item: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  emptyMessage?: string;
  onRowClick?: (item: T) => void;
}

export function DataTable<T extends { id: string }>({
  columns,
  data,
  isLoading,
  emptyMessage = "No data available",
  onRowClick,
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-border/50 overflow-hidden">
        <div className="p-8 text-center">
          <div className="inline-flex items-center gap-2 text-muted-foreground">
            <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            <span>Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-border/50 overflow-hidden">
        <div className="p-8 text-center text-muted-foreground">
          {emptyMessage}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/50 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-border/50 hover:bg-transparent">
            {columns.map((column, index) => (
              <TableHead
                key={index}
                className={cn(
                  "bg-secondary/30 text-muted-foreground font-semibold",
                  column.className
                )}
              >
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => (
            <TableRow
              key={item.id}
              onClick={() => onRowClick?.(item)}
              className={cn(
                "border-border/50 transition-colors",
                onRowClick && "cursor-pointer hover:bg-primary/5"
              )}
            >
              {columns.map((column, index) => (
                <TableCell key={index} className={column.className}>
                  {column.cell
                    ? column.cell(item)
                    : column.accessorKey
                    ? String(item[column.accessorKey] ?? "")
                    : ""}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
