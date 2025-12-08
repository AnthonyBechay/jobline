import { getDocumentTemplates } from '@/app/actions/settings';
import { columns } from '../office-documents/columns'; // Reuse columns
import { DataTable } from '@/components/tables/data-table';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';

export default async function ClientDocumentsPage() {
    const templates = await getDocumentTemplates('client');

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Client Documents</h2>
                    <p className="text-muted-foreground">
                        Manage the list of documents the client needs to provide.
                    </p>
                </div>
                <Link href="/dashboard/settings/client-documents/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        New Document Requirement
                    </Button>
                </Link>
            </div>
            <DataTable columns={columns} data={templates} searchKey="name" />
        </div>
    );
}
