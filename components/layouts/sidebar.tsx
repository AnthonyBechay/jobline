'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  FileText,
  DollarSign,
  Settings,
  Building2,
  UserCircle,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Applications', href: '/applications', icon: Briefcase },
  { name: 'Candidates', href: '/candidates', icon: Users },
  { name: 'Clients', href: '/clients', icon: Building2 },
  { name: 'Documents', href: '/documents', icon: FileText },
  { name: 'Financial', href: '/financial', icon: DollarSign },
  { name: 'Settings', href: '/settings', icon: Settings },
];

interface SidebarProps {
  user: {
    name: string;
    email: string;
    role: string;
  };
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col border-r bg-card">
      <div className="flex h-16 items-center border-b px-6">
        <h1 className="text-xl font-bold">Jobline</h1>
      </div>
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {navigation.map((item) => {
            // RBAC: Hide Financial and Settings for non-SUPER_ADMIN
            if (
              (item.name === 'Financial' || item.name === 'Settings') &&
              user.role !== 'SUPER_ADMIN'
            ) {
              return null;
            }

            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link key={item.name} href={item.href}>
                <Button
                  variant={isActive ? 'secondary' : 'ghost'}
                  className={cn(
                    'w-full justify-start',
                    isActive && 'bg-secondary font-medium'
                  )}
                >
                  <item.icon className="mr-3 h-4 w-4" />
                  {item.name}
                </Button>
              </Link>
            );
          })}
        </nav>
      </ScrollArea>
      <Separator />
      <div className="p-4">
        <div className="flex items-center space-x-3 rounded-lg bg-muted p-3">
          <UserCircle className="h-8 w-8 text-muted-foreground" />
          <div className="flex-1 space-y-1">
            <p className="text-sm font-medium leading-none">{user.name}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
        </div>
        <Button variant="ghost" className="mt-2 w-full justify-start text-destructive">
          <LogOut className="mr-3 h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );
}
