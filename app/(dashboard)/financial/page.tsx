import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, TrendingDown, FileText, FileDown } from 'lucide-react';
import Link from 'next/link';

export default async function FinancialPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financial Management</h1>
          <p className="text-muted-foreground">
            Manage payments, costs, and fee templates
          </p>
        </div>
        <Link href="/api/pdf/financial-report" target="_blank">
          <Button>
            <FileDown className="mr-2 h-4 w-4" />
            Download Financial Report
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payments</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Track Payments</div>
            <p className="text-xs text-muted-foreground mt-1">
              Record and monitor client payments
            </p>
            <Link href="/dashboard/financial/payments">
              <Button className="mt-4 w-full" variant="outline">
                View Payments
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Costs</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Manage Costs</div>
            <p className="text-xs text-muted-foreground mt-1">
              Track application-related expenses
            </p>
            <Link href="/dashboard/financial/costs">
              <Button className="mt-4 w-full" variant="outline">
                View Costs
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fee Templates</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Configure Fees</div>
            <p className="text-xs text-muted-foreground mt-1">
              Set up pricing templates
            </p>
            <Link href="/dashboard/financial/fee-templates">
              <Button className="mt-4 w-full" variant="outline">
                View Templates
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
