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
import { deleteDocumentTemplate } from '@/app/actions/settings';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';

export type DocumentTemplate = {
    id: string;
    name: string;
    stage: string;
    required: boolean;
    requiredFrom: string;
    createdAt: Date;
};

export const columns: ColumnDef<DocumentTemplate>[] = [
    {
        accessorKey: 'name',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Document Name" />
        ),
    },
    {
        accessorKey: 'stage',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Stage" />
        ),
        cell: ({ row }) => <Badge variant="outline">{row.getValue('stage')}</Badge>,
    },
    {
        accessorKey: 'required',
        header: 'Required',
        cell: ({ row }) => (
            <Badge variant={row.getValue('required') ? 'default' : 'secondary'}>
                {row.getValue('required') ? 'Yes' : 'No'}
            </Badge>
        ),
    },
    {
        id: 'actions',
        cell: ({ row }) => {
            const template = row.original;
            const router = useRouter();

            const handleDelete = async () => {
                const result = await deleteDocumentTemplate(template.id, template.requiredFrom as 'office' | 'client');
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
                        <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                            <Trash className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            );
        },
    },
];
