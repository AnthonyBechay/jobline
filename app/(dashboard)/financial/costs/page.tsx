import { getCosts } from '@/app/actions/costs';
import { DataTable } from '@/components/tables/data-table';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { columns } from './columns';

export default async function CostsPage() {
  const result = await getCosts();
  const costs = result.success ? result.data : [];

  // Calculate summary statistics
  const totalAmount = costs.reduce(
    (sum, cost) => sum + parseFloat(cost.amount),
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Costs</h1>
          <p className="text-muted-foreground">Track application-related expenses</p>
        </div>
        <Link href="/dashboard/financial/costs/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Record Cost
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border p-4">
          <div className="text-sm font-medium text-muted-foreground">Total Costs</div>
          <div className="text-2xl font-bold">{costs.length}</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-sm font-medium text-muted-foreground">Total Amount</div>
          <div className="text-2xl font-bold">${totalAmount.toFixed(2)}</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-sm font-medium text-muted-foreground">Average Cost</div>
          <div className="text-2xl font-bold">
            ${costs.length > 0 ? (totalAmount / costs.length).toFixed(2) : '0.00'}
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={costs as any}
        searchKey="costType"
        searchPlaceholder="Search costs..."
      />
    </div>
  );
}
