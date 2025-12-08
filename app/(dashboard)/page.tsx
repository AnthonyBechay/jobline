import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Briefcase, Building2, DollarSign } from 'lucide-react';
import Link from 'next/link';
import { getApplications } from '@/app/actions/applications';
import { getCandidates } from '@/app/actions/candidates';
import { getClients } from '@/app/actions/clients';
import { getPayments } from '@/app/actions/payments';
import { formatCurrency } from '@/lib/utils';
import { RevenueChart } from '@/components/charts/revenue-chart';
import { ApplicationStatusChart } from '@/components/charts/application-status-chart';

export default async function DashboardPage() {
  // Fetch data for dashboard
  const [applicationsResult, candidatesResult, clientsResult, paymentsResult] = await Promise.all([
    getApplications(),
    getCandidates(),
    getClients(),
    getPayments(),
  ]);

  const applications = applicationsResult.success ? applicationsResult.data : [];
  const candidates = candidatesResult.success ? candidatesResult.data : [];
  const clients = clientsResult.success ? clientsResult.data : [];
  const payments = paymentsResult.success ? paymentsResult.data : [];

  // Calculate statistics
  const activeApplications = applications.filter(
    (app) => !['CONTRACT_ENDED', 'CANCELLED_PRE_ARRIVAL', 'CANCELLED_POST_ARRIVAL', 'CANCELLED_CANDIDATE'].includes(app.status)
  ).length;

  // Get current month
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const monthlyRevenue = payments
    .filter((payment) => {
      const paymentDate = new Date(payment.paymentDate);
      return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear;
    })
    .reduce((sum, payment) => sum + parseFloat(payment.amount), 0);

  // Get recent applications
  const recentApplications = applications.slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to your recruitment management platform
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeApplications}</div>
            <p className="text-xs text-muted-foreground">Active recruitment processes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Candidates</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{candidates.length}</div>
            <p className="text-xs text-muted-foreground">Registered candidates</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clients</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clients.length}</div>
            <p className="text-xs text-muted-foreground">Active clients</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(monthlyRevenue)}</div>
            <p className="text-xs text-muted-foreground">Total this month</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <RevenueChart payments={payments} />
        <ApplicationStatusChart applications={applications} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Applications</CardTitle>
            <CardDescription>Latest recruitment applications in your system</CardDescription>
          </CardHeader>
          <CardContent>
            {recentApplications.length === 0 ? (
              <p className="text-sm text-muted-foreground">No applications yet</p>
            ) : (
              <div className="space-y-4">
                {recentApplications.map((app) => (
                  <div key={app.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">
                        {app.candidate?.firstName} {app.candidate?.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {app.client?.name} • {app.status.replace(/_/g, ' ')}
                      </p>
                    </div>
                    <Link href={`/dashboard/applications/${app.id}`}>
                      <Button variant="ghost" size="sm">View</Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/dashboard/candidates/new">
              <Button variant="outline" className="w-full justify-start">
                Add new candidate
              </Button>
            </Link>
            <Link href="/dashboard/applications/new">
              <Button variant="outline" className="w-full justify-start">
                Create application
              </Button>
            </Link>
            <Link href="/dashboard/clients">
              <Button variant="outline" className="w-full justify-start">
                Manage clients
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
