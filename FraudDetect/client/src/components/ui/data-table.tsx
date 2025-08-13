import { ReactNode } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, Download } from "lucide-react";

interface Column<T> {
  key: keyof T;
  label: string;
  render?: (value: any, item: T) => ReactNode;
  sortable?: boolean;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  onFilter?: () => void;
  onExport?: () => void;
  isLoading?: boolean;
  emptyMessage?: string;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  searchPlaceholder = "Search...",
  onSearch,
  onFilter,
  onExport,
  isLoading,
  emptyMessage = "No data available"
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      {/* Header with search and filters */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex space-x-2">
          {onSearch && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <Input
                placeholder={searchPlaceholder}
                className="pl-10 w-64"
                onChange={(e) => onSearch(e.target.value)}
                data-testid="input-search"
              />
            </div>
          )}
          {onFilter && (
            <Button variant="outline" onClick={onFilter} data-testid="button-filter">
              <Filter className="mr-2" size={16} />
              Filter
            </Button>
          )}
        </div>
        {onExport && (
          <Button variant="outline" onClick={onExport} data-testid="button-export">
            <Download className="mr-2" size={16} />
            Export
          </Button>
        )}
      </div>

      {/* Table */}
      {data.length === 0 ? (
        <div className="text-center py-8 text-gray-500" data-testid="text-empty-state">
          {emptyMessage}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead key={String(column.key)} className="cursor-pointer hover:bg-gray-100">
                    {column.label}
                    {column.sortable && <span className="ml-1">↕</span>}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item, index) => (
                <TableRow key={index} className="hover:bg-gray-50">
                  {columns.map((column) => (
                    <TableCell key={String(column.key)}>
                      {column.render
                        ? column.render(item[column.key], item)
                        : String(item[column.key] || '')}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
