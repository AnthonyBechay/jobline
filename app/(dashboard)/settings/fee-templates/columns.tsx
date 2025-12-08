'use client';

import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Pencil, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DataTableColumnHeader } from '@/components/tables/data-table-column-header';
import { formatCurrency } from '@/lib/utils';
import { deleteFeeTemplate } from '@/app/actions/settings';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

// Define the type based on the schema select type
// We can import it from schema if exported, or define a subset
export type FeeTemplate = {
    id: string;
    name: string;
    defaultPrice: string | number; // Decimal comes as string often
    minPrice: string | number;
    maxPrice: string | number;
    currency: string;
    nationality?: string | null;
    createdAt: Date;
};

export const columns: ColumnDef<FeeTemplate>[] = [
    {
        accessorKey: 'name',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Name" />
        ),
    },
    {
        accessorKey: 'defaultPrice',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Price" />
        ),
        cell: ({ row }) => {
            const amount = parseFloat(row.getValue('defaultPrice'));
            const currency = row.original.currency;
            return <div className="font-medium">{formatCurrency(amount, currency)}</div>;
        },
    },
    {
        accessorKey: 'range',
        header: 'Range',
        cell: ({ row }) => {
            const min = parseFloat(row.original.minPrice as string);
            const max = parseFloat(row.original.maxPrice as string);
            const currency = row.original.currency;
            return (
                <div className="text-sm text-muted-foreground">
                    {formatCurrency(min, currency)} - {formatCurrency(max, currency)}
                </div>
            );
        },
    },
    {
        accessorKey: 'nationality',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Nationality" />
        ),
        cell: ({ row }) => row.getValue('nationality') || 'All',
    },
    {
        id: 'actions',
        cell: ({ row }) => {
            const template = row.original;
            const router = useRouter();

            const handleDelete = async () => {
                const result = await deleteFeeTemplate(template.id);
                if (result.success) {
                    toast.success('Template deleted');
                    router.refresh();
                } else {
                    toast.error('Failed to delete template');
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
                        <DropdownMenuItem
                            onClick={() => navigator.clipboard.writeText(template.id)}
                        >
                            Copy ID
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                            <Pencil className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                            <Trash className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            );
        },
    },
];
