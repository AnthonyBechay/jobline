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
import { MoreHorizontal, Pencil, Trash } from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/utils';

type Cost = {
  id: string;
  amount: string;
  currency: string;
  costDate: Date;
  costType: string;
  description: string | null;
  createdAt: Date;
  application: {
    candidate: {
      firstName: string;
      lastName: string;
    } | null;
    client: {
      name: string;
    } | null;
  };
};

export const columns: ColumnDef<Cost>[] = [
  {
    accessorKey: 'costType',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
    cell: ({ row }) => {
      const type = row.getValue('costType') as string;
      return <Badge variant="outline">{type}</Badge>;
    },
  },
  {
    id: 'client',
    header: 'Client',
    cell: ({ row }) => row.original.application?.client?.name || 'N/A',
  },
  {
    id: 'candidate',
    header: 'Candidate',
    cell: ({ row }) => {
      const candidate = row.original.application?.candidate;
      return candidate ? `${candidate.firstName} ${candidate.lastName}` : 'N/A';
    },
  },
  {
    accessorKey: 'amount',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Amount" />,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue('amount'));
      const currency = row.original.currency;
      return `${formatCurrency(amount)} ${currency}`;
    },
  },
  {
    accessorKey: 'description',
    header: 'Description',
    cell: ({ row }) => {
      const description = row.getValue('description') as string | null;
      return description ? (
        <div className="max-w-[200px] truncate" title={description}>
          {description}
        </div>
      ) : (
        'N/A'
      );
    },
  },
  {
    accessorKey: 'costDate',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Date" />,
    cell: ({ row }) => formatDate(row.getValue('costDate')),
  },
  {
    id: 'actions',
    cell: () => {
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
            <DropdownMenuItem>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
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
