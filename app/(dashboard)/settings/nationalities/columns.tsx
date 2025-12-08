'use client';

import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Trash } from 'lucide-react';
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
import { deleteNationality, toggleNationality } from '@/app/actions/settings';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Switch } from '@/components/ui/switch';

export type Nationality = {
    id: string;
    code: string;
    name: string;
    active: boolean;
    createdAt: Date;
};

export const columns: ColumnDef<Nationality>[] = [
    {
        accessorKey: 'code',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Code" />
        ),
    },
    {
        accessorKey: 'name',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Name" />
        ),
    },
    {
        accessorKey: 'active',
        header: 'Active',
        cell: ({ row }) => {
            const nationality = row.original;
            const router = useRouter();

            const handleToggle = async (checked: boolean) => {
                const result = await toggleNationality(nationality.id, checked);
                if (result.success) {
                    toast.success('Nationality updated');
                    router.refresh();
                } else {
                    toast.error('Failed to update nationality');
                }
            };

            return (
                <Switch
                    checked={nationality.active}
                    onCheckedChange={handleToggle}
                />
            );
        },
    },
    {
        id: 'actions',
        cell: ({ row }) => {
            const nationality = row.original;
            const router = useRouter();

            const handleDelete = async () => {
                const result = await deleteNationality(nationality.id);
                if (result.success) {
                    toast.success('Nationality deleted');
                    router.refresh();
                } else {
                    toast.error('Failed to delete nationality');
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
                            onClick={() => navigator.clipboard.writeText(nationality.id)}
                        >
                            Copy ID
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                            <Trash className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            );
        },
    },
];
