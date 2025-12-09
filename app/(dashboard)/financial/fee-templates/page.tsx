import { getFeeTemplates } from '@/app/actions/fee-templates';
import { DataTable } from '@/components/tables/data-table';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { columns } from './columns';

export default async function FeeTemplatesPage() {
  const result = await getFeeTemplates();
  const templates = result.success && result.data ? result.data : [];

  // Calculate summary statistics
  const avgDefaultPrice =
    templates.length > 0
      ? templates.reduce((sum, t) => sum + parseFloat(t.defaultPrice), 0) / templates.length
      : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fee Templates</h1>
          <p className="text-muted-foreground">Manage pricing templates for different services</p>
        </div>
        <Link href="/financial/fee-templates/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Template
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border p-4">
          <div className="text-sm font-medium text-muted-foreground">Total Templates</div>
          <div className="text-2xl font-bold">{templates.length}</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-sm font-medium text-muted-foreground">Avg. Default Price</div>
          <div className="text-2xl font-bold">${avgDefaultPrice.toFixed(2)}</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-sm font-medium text-muted-foreground">Currencies</div>
          <div className="text-2xl font-bold">
            {[...new Set(templates.map((t) => t.currency))].length || 1}
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={templates}
        searchKey="name"
        searchPlaceholder="Search templates..."
      />
    </div>
  );
}
