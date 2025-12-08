'use client';

import { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/tables/data-table-column-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Download, Trash, Eye } from 'lucide-react';
import { formatDate } from '@/lib/utils';

type ClientDocument = {
  id: string;
  documentName: string;
  fileName: string;
  url: string;
  mimeType: string;
  size: number;
  createdAt: Date;
  client: {
    name: string;
  };
};

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function getFileTypeColor(mimeType: string): string {
  if (mimeType.includes('pdf')) return 'bg-red-500';
  if (mimeType.includes('image')) return 'bg-green-500';
  if (mimeType.includes('word') || mimeType.includes('document')) return 'bg-blue-500';
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'bg-emerald-500';
  return 'bg-gray-500';
}

export const columns: ColumnDef<ClientDocument>[] = [
  {
    accessorKey: 'documentName',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Document Name" />,
  },
  {
    accessorKey: 'client',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Client" />,
    cell: ({ row }) => row.original.client.name,
  },
  {
    accessorKey: 'fileName',
    header: ({ column }) => <DataTableColumnHeader column={column} title="File Name" />,
    cell: ({ row }) => (
      <div className="max-w-[200px] truncate" title={row.original.fileName}>
        {row.original.fileName}
      </div>
    ),
  },
  {
    accessorKey: 'mimeType',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
    cell: ({ row }) => {
      const mimeType = row.getValue('mimeType') as string;
      const fileType = mimeType.split('/')[1]?.toUpperCase() || 'FILE';
      return (
        <Badge variant="secondary" className={getFileTypeColor(mimeType)}>
          {fileType}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'size',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Size" />,
    cell: ({ row }) => formatFileSize(row.getValue('size')),
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Uploaded" />,
    cell: ({ row }) => formatDate(row.getValue('createdAt')),
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const document = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <a href={document.url} target="_blank" rel="noopener noreferrer">
                <Eye className="mr-2 h-4 w-4" />
                View Document
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a href={document.url} download={document.fileName}>
                <Download className="mr-2 h-4 w-4" />
                Download
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive">
              <Trash className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
