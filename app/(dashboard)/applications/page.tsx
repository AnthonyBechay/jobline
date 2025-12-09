import { getApplications } from '@/app/actions/applications';
import { DataTable } from '@/components/tables/data-table';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { columns } from './columns';

export const dynamic = 'force-dynamic';

export default async function ApplicationsPage() {
  const result = await getApplications();
  const applications = result.success ? result.data : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Applications</h1>
          <p className="text-muted-foreground">Manage job applications and track their status</p>
        </div>
        <Link href="/applications/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Application
          </Button>
        </Link>
      </div>

      <DataTable
        columns={columns}
        data={applications}
        searchKey="candidate"
        searchPlaceholder="Search applications..."
      />
    </div>
  );
}
