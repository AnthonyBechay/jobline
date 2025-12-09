import { getFeeTemplates } from '@/app/actions/settings';
import { columns } from './columns';
import { DataTable } from '@/components/tables/data-table';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';

export default async function FeeTemplatesPage() {
    const templates = await getFeeTemplates();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Fee Templates</h2>
                    <p className="text-muted-foreground">
                        Manage your standard fee structures for applications.
                    </p>
                </div>
                <Link href="/settings/fee-templates/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        New Template
                    </Button>
                </Link>
            </div>
            <DataTable columns={columns} data={templates} searchKey="name" />
        </div>
    );
}
