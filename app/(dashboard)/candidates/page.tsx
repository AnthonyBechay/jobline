import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';

export default function CandidatesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Candidates</h2>
          <p className="text-muted-foreground">
            Manage your candidate pool.
          </p>
        </div>
        <Link href="/dashboard/candidates/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Candidate
          </Button>
        </Link>
      </div>

      <div className="rounded-md border p-8 text-center text-muted-foreground">
        Candidate list will be implemented here.
      </div>
    </div>
  );
}
