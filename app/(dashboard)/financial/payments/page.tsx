import { getPayments } from '@/app/actions/payments';
import { DataTable } from '@/components/tables/data-table';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { columns } from './columns';

export const dynamic = 'force-dynamic';

export default async function PaymentsPage() {
  const result = await getPayments();
  const payments = result.success ? result.data : [];

  // Calculate summary statistics
  const totalAmount = payments.reduce(
    (sum, payment) => sum + parseFloat(payment.amount),
    0
  );
  const refundableAmount = payments
    .filter((p) => p.isRefundable)
    .reduce((sum, payment) => sum + parseFloat(payment.amount), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
          <p className="text-muted-foreground">Track and manage payment transactions</p>
        </div>
        <Link href="/dashboard/financial/payments/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Record Payment
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border p-4">
          <div className="text-sm font-medium text-muted-foreground">Total Payments</div>
          <div className="text-2xl font-bold">{payments.length}</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-sm font-medium text-muted-foreground">Total Amount</div>
          <div className="text-2xl font-bold">${totalAmount.toFixed(2)}</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-sm font-medium text-muted-foreground">Refundable Amount</div>
          <div className="text-2xl font-bold">${refundableAmount.toFixed(2)}</div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={payments}
        searchKey="client"
        searchPlaceholder="Search payments..."
      />
    </div>
  );
}
