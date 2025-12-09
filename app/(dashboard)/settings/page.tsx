import Link from 'next/link';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { FileText, Users, DollarSign, Globe, Scale } from 'lucide-react';

const settingsItems = [
  {
    title: 'Fee Templates',
    description: 'Manage fee structures, prices, and ranges.',
    href: '/settings/fee-templates',
    icon: DollarSign,
  },
  {
    title: 'Office Documents',
    description: 'Manage required documents for the office.',
    href: '/settings/office-documents',
    icon: FileText,
  },
  {
    title: 'Client Documents',
    description: 'Manage required documents for clients.',
    href: '/settings/client-documents',
    icon: Users,
  },
  {
    title: 'Nationalities',
    description: 'Manage active nationalities.',
    href: '/settings/nationalities',
    icon: Globe,
  },
  {
    title: 'Lawyer Fees',
    description: 'Configure internal costs and client prices.',
    href: '/settings/lawyer-fees',
    icon: Scale,
  },
];

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Manage your agency configuration and preferences.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {settingsItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <Card className="h-full hover:bg-muted/50 transition-colors cursor-pointer">
              <CardHeader>
                <item.icon className="h-8 w-8 mb-2 text-primary" />
                <CardTitle>{item.title}</CardTitle>
                <CardDescription>{item.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
