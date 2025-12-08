import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Building, FileText, Settings as SettingsIcon } from 'lucide-react';
import { getAgents } from '@/app/actions/agents';
import { getBrokers } from '@/app/actions/brokers';
import { DataTable } from '@/components/tables/data-table';
import { agentColumns } from './agents-columns';
import { brokerColumns } from './brokers-columns';
import Link from 'next/link';

export default async function SettingsPage() {
  const [agentsResult, brokersResult] = await Promise.all([
    getAgents(),
    getBrokers(),
  ]);

  const agents = agentsResult.success ? agentsResult.data : [] as any;
  const brokers = brokersResult.success ? brokersResult.data : [] as any;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your company settings and configurations
        </p>
      </div>

      <Tabs defaultValue="agents" className="space-y-4">
        <TabsList>
          <TabsTrigger value="agents">
            <Users className="mr-2 h-4 w-4" />
            Agents
          </TabsTrigger>
          <TabsTrigger value="brokers">
            <Building className="mr-2 h-4 w-4" />
            Brokers
          </TabsTrigger>
          <TabsTrigger value="templates">
            <FileText className="mr-2 h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="company">
            <SettingsIcon className="mr-2 h-4 w-4" />
            Company
          </TabsTrigger>
        </TabsList>

        <TabsContent value="agents" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Agents</h2>
              <p className="text-muted-foreground">
                Manage recruitment agents and their contact information
              </p>
            </div>
            <Link href="/dashboard/settings/agents/new">
              <Button>Add Agent</Button>
            </Link>
          </div>
          <Card>
            <CardContent className="pt-6">
              <DataTable
                columns={agentColumns}
                data={agents}
                searchKey="name"
                searchPlaceholder="Search agents..."
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="brokers" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Brokers</h2>
              <p className="text-muted-foreground">
                Manage broker companies and their contact details
              </p>
            </div>
            <Link href="/dashboard/settings/brokers/new">
              <Button>Add Broker</Button>
            </Link>
          </div>
          <Card>
            <CardContent className="pt-6">
              <DataTable
                columns={brokerColumns}
                data={brokers}
                searchKey="name"
                searchPlaceholder="Search brokers..."
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Document Templates</CardTitle>
              <CardDescription>
                Manage document templates for different application stages
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Template management coming soon...
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="company" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Company Settings</CardTitle>
              <CardDescription>
                Manage your company profile and preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Company settings coming soon...
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
