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
import Link from 'next/link';
import { formatDate, formatCurrency } from '@/lib/utils';

type Payment = {
  id: string;
  amount: string;
  currency: string;
  paymentDate: Date;
  paymentType: string;
  isRefundable: boolean;
  notes: string | null;
  createdAt: Date;
  application: {
    candidate: {
      firstName: string;
      lastName: string;
    } | null;
  };
  client: {
    name: string;
  };
};

export const columns: ColumnDef<Payment>[] = [
  {
    accessorKey: 'client',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Client" />,
    cell: ({ row }) => row.original.client.name,
  },
  {
    accessorKey: 'candidate',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Candidate" />,
    cell: ({ row }) => {
      const candidate = row.original.application.candidate;
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
    accessorKey: 'paymentType',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
    cell: ({ row }) => {
      const type = row.getValue('paymentType') as string;
      return <Badge variant="outline">{type}</Badge>;
    },
  },
  {
    accessorKey: 'isRefundable',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Refundable" />,
    cell: ({ row }) => {
      const isRefundable = row.getValue('isRefundable') as boolean;
      return (
        <Badge variant={isRefundable ? 'secondary' : 'destructive'}>
          {isRefundable ? 'Yes' : 'No'}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'paymentDate',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Payment Date" />,
    cell: ({ row }) => formatDate(row.getValue('paymentDate')),
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const payment = row.original;

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
              <Link href={`/dashboard/financial/payments/${payment.id}/edit`}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Link>
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
