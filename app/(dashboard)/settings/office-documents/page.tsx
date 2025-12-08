import { getDocumentTemplates } from '@/app/actions/settings';
import { columns } from './columns';
import { DataTable } from '@/components/tables/data-table';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';

export default async function OfficeDocumentsPage() {
    const templates = await getDocumentTemplates('office');

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Office Documents</h2>
                    <p className="text-muted-foreground">
                        Manage the list of documents the office needs to secure.
                    </p>
                </div>
                <Link href="/dashboard/settings/office-documents/new">
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
