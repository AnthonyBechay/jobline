import { getNationalities } from '@/app/actions/settings';
import { columns } from './columns';
import { DataTable } from '@/components/tables/data-table';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';

export default async function NationalitiesPage() {
    const items = await getNationalities();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Nationalities</h2>
                    <p className="text-muted-foreground">
                        Manage active nationalities for candidates.
                    </p>
                </div>
                <Link href="/dashboard/settings/nationalities/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        New Nationality
                    </Button>
                </Link>
            </div>
            <DataTable columns={columns} data={items} searchKey="name" />
        </div>
    );
}
