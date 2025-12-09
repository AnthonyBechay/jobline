'use client';

import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Pencil, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { deleteCandidate } from '@/app/actions/candidates';
import { toast } from 'sonner';

// Define the type based on the schema/query result
export type Candidate = {
    id: string;
    firstName: string;
    lastName: string;
    nationality: string;
    status: string;
    photoUrl: string | null;
    facePhotoUrl: string | null; // Added
    fullBodyPhotoUrl: string | null; // Added
    createdAt: Date;
    agent?: {
        name: string;
    } | null;
};

export const columns: ColumnDef<Candidate>[] = [
    {
        accessorKey: 'photoUrl',
        header: '',
        cell: ({ row }) => {
            const photo = row.original.facePhotoUrl || row.original.photoUrl; // Prefer face photo
            const initials = `${row.original.firstName[0]}${row.original.lastName[0]}`;
            return (
                <Avatar>
                    <AvatarImage src={photo || ''} alt={initials} />
                    <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
            );
        },
    },
    {
        accessorKey: 'firstName',
        header: 'Name',
        cell: ({ row }) => (
            <div className="font-medium">
                {row.original.firstName} {row.original.lastName}
            </div>
        ),
    },
    {
        accessorKey: 'nationality',
        header: 'Nationality',
    },
    {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
            const status = row.original.status;
            let variant: 'default' | 'secondary' | 'destructive' | 'outline' = 'default';

            switch (status) {
                case 'AVAILABLE_ABROAD':
                case 'AVAILABLE_IN_LEBANON':
                    variant = 'default'; // Green-ish usually, or primary
                    break;
                case 'RESERVED':
                    variant = 'secondary';
                    break;
                case 'PLACED':
                    variant = 'outline';
                    break;
                default:
                    variant = 'secondary';
            }

            return <Badge variant={variant}>{status.replace(/_/g, ' ')}</Badge>;
        },
    },
    {
        accessorKey: 'agent.name',
        header: 'Agent',
        cell: ({ row }) => row.original.agent?.name || '-',
    },
    {
        id: 'actions',
        cell: ({ row }) => {
            const candidate = row.original;

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
                        <Link href={`/candidates/${candidate.id}`}>
                            <DropdownMenuItem>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                            </DropdownMenuItem>
                        </Link>
                        <DropdownMenuItem
                            onClick={async () => {
                                const result = await deleteCandidate(candidate.id);
                                if (result.success) {
                                    toast.success('Candidate deleted');
                                } else {
                                    toast.error('Failed to delete candidate');
                                }
                            }}
                            className="text-red-600"
                        >
                            <Trash className="mr-2 h-4 w-4" />
                            Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            );
        },
    },
];
