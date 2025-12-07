import { getCandidates } from '@/app/actions/candidates';
import { DataTable } from '@/components/tables/data-table';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { columns } from './columns';

export default async function CandidatesPage() {
  const result = await getCandidates();
  const candidates = result.success ? result.data : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Candidates</h1>
          <p className="text-muted-foreground">Manage your recruitment candidates</p>
        </div>
        <Link href="/dashboard/candidates/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Candidate
          </Button>
        </Link>
      </div>

      <DataTable
        columns={columns}
        data={candidates}
        searchKey="firstName"
        searchPlaceholder="Search candidates..."
      />
    </div>
  );
}
