import { getCandidates } from '@/app/actions/candidates';
import { CandidatesClient } from '@/components/candidates/client';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';

export default async function CandidatesPage() {
  const result = await getCandidates();
  const candidates = result.success ? result.data : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Candidates</h2>
          <p className="text-muted-foreground">
            Manage your candidate pool, view status, and filter by category.
          </p>
        </div>
        <Link href="/dashboard/candidates/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Candidate
          </Button>
        </Link>
      </div>

      <CandidatesClient data={candidates} />
    </div>
  );
}
