'use client';

import { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/tables/data-table-column-header';
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
import { formatCurrency, formatDate } from '@/lib/utils';
import { deleteFeeTemplate } from '@/app/actions/fee-templates';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

type FeeTemplate = {
  id: string;
  name: string;
  defaultPrice: string;
  minPrice: string;
  maxPrice: string;
  currency: string;
  nationality: string | null;
  serviceType: string | null;
  description: string | null;
  createdAt: Date;
};

export const columns: ColumnDef<FeeTemplate>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Template Name" />,
  },
  {
    accessorKey: 'defaultPrice',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Default Price" />,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue('defaultPrice'));
      const currency = row.original.currency;
      return formatCurrency(amount, currency);
    },
  },
  {
    id: 'priceRange',
    header: 'Price Range',
    cell: ({ row }) => {
      const minPrice = parseFloat(row.original.minPrice);
      const maxPrice = parseFloat(row.original.maxPrice);
      const currency = row.original.currency;
      return `${formatCurrency(minPrice, currency)} - ${formatCurrency(maxPrice, currency)}`;
    },
  },
  {
    accessorKey: 'nationality',
    header: 'Nationality',
    cell: ({ row }) => row.getValue('nationality') || 'Any',
  },
  {
    accessorKey: 'serviceType',
    header: 'Service Type',
    cell: ({ row }) => row.getValue('serviceType') || 'General',
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Created" />,
    cell: ({ row }) => formatDate(row.getValue('createdAt')),
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const template = row.original;
      const router = useRouter();

      const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this fee template?')) {
          return;
        }

        const result = await deleteFeeTemplate(template.id);
        if (result.success) {
          toast.success('Fee template deleted successfully');
          router.refresh();
        } else {
          toast.error(result.error || 'Failed to delete fee template');
        }
      };

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
            <DropdownMenuItem
              onClick={() => router.push(`/dashboard/financial/fee-templates/${template.id}`)}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive" onClick={handleDelete}>
              <Trash className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
