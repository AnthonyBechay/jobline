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
import { MoreHorizontal, Pencil, Trash, Eye, FileDown } from 'lucide-react';
import Link from 'next/link';
import { formatDate, formatCurrency } from '@/lib/utils';

type Application = {
  id: string;
  status: string;
  type: string;
  finalFeeAmount: string | null;
  permitExpiryDate: Date | null;
  exactArrivalDate: Date | null;
  createdAt: Date;
  candidate: {
    firstName: string;
    lastName: string;
  } | null;
  client: {
    name: string;
  } | null;
  broker: {
    name: string;
  } | null;
};

const statusColors: Record<string, string> = {
  PENDING_MOL: 'bg-yellow-500',
  MOL_AUTH_RECEIVED: 'bg-blue-500',
  VISA_PROCESSING: 'bg-indigo-500',
  VISA_RECEIVED: 'bg-green-500',
  WORKER_ARRIVED: 'bg-teal-500',
  LABOUR_PERMIT_PROCESSING: 'bg-purple-500',
  RESIDENCY_PERMIT_PROCESSING: 'bg-pink-500',
  ACTIVE_EMPLOYMENT: 'bg-emerald-500',
  CONTRACT_ENDED: 'bg-gray-500',
  RENEWAL_PENDING: 'bg-amber-500',
  CANCELLED_PRE_ARRIVAL: 'bg-red-500',
  CANCELLED_POST_ARRIVAL: 'bg-red-600',
  CANCELLED_CANDIDATE: 'bg-red-700',
};

const typeColors: Record<string, string> = {
  NEW_CANDIDATE: 'bg-blue-600',
  GUARANTOR_CHANGE: 'bg-orange-600',
};

export const columns: ColumnDef<Application>[] = [
  {
    accessorKey: 'candidate',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Candidate" />,
    cell: ({ row }) => {
      const candidate = row.original.candidate;
      return candidate ? `${candidate.firstName} ${candidate.lastName}` : 'N/A';
    },
  },
  {
    accessorKey: 'client',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Client" />,
    cell: ({ row }) => {
      const client = row.original.client;
      return client?.name || 'N/A';
    },
  },
  {
    accessorKey: 'type',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
    cell: ({ row }) => {
      const type = row.getValue('type') as string;
      return (
        <Badge variant="secondary" className={typeColors[type]}>
          {type.replace(/_/g, ' ')}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'status',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => {
      const status = row.getValue('status') as string;
      return (
        <Badge variant="secondary" className={statusColors[status]}>
          {status.replace(/_/g, ' ')}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'finalFeeAmount',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Fee Amount" />,
    cell: ({ row }) => {
      const amount = row.getValue('finalFeeAmount') as string | null;
      return amount ? formatCurrency(parseFloat(amount)) : 'N/A';
    },
  },
  {
    accessorKey: 'exactArrivalDate',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Arrival Date" />,
    cell: ({ row }) => {
      const date = row.getValue('exactArrivalDate') as Date | null;
      return date ? formatDate(date) : 'N/A';
    },
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Created" />,
    cell: ({ row }) => formatDate(row.getValue('createdAt')),
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const application = row.original;

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
              <Link href={`/applications/${application.id}`}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/applications/${application.id}/edit`}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/api/pdf/application/${application.id}`} target="_blank">
                <FileDown className="mr-2 h-4 w-4" />
                Download Document
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
