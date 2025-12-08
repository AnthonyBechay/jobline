'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertTriangle, Calendar, Clock } from 'lucide-react';
import { formatDistanceToNow, isAfter, isBefore, addDays } from 'date-fns';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface Application {
    id: string;
    permitExpiryDate: Date | string | null;
    candidate: {
        firstName: string;
        lastName: string;
    } | null;
    client: {
        name: string;
    } | null;
    status: string;
}

interface SmartRemindersProps {
    applications: Application[];
}

export function SmartReminders({ applications }: SmartRemindersProps) {
    const now = new Date();
    const thirtyDaysFromNow = addDays(now, 30);

    const expiringPermits = applications.filter((app) => {
        if (!app.permitExpiryDate) return false;
        const expiryDate = new Date(app.permitExpiryDate);
        return isAfter(expiryDate, now) && isBefore(expiryDate, thirtyDaysFromNow);
    });

    const expiredPermits = applications.filter((app) => {
        if (!app.permitExpiryDate) return false;
        const expiryDate = new Date(app.permitExpiryDate);
        return isBefore(expiryDate, now);
    });

    if (expiringPermits.length === 0 && expiredPermits.length === 0) {
        return null;
    }

    return (
        <Card className="col-span-full border-l-4 border-l-amber-500">
            <CardHeader>
                <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                    <CardTitle>Smart Reminders</CardTitle>
                </div>
                <CardDescription>
                    Attention needed for upcoming expirations and deadlines.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {expiredPermits.map((app) => (
                        <div
                            key={app.id}
                            className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-900/20"
                        >
                            <div className="flex items-center space-x-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-200">
                                    <Clock className="h-4 w-4" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-red-900 dark:text-red-200">
                                        Permit Expired: {app.candidate?.firstName} {app.candidate?.lastName}
                                    </p>
                                    <p className="text-xs text-red-700 dark:text-red-300">
                                        Expired {formatDistanceToNow(new Date(app.permitExpiryDate!))} ago
                                    </p>
                                </div>
                            </div>
                            <Link href={`/dashboard/applications/${app.id}`}>
                                <Button variant="outline" size="sm" className="border-red-200 hover:bg-red-100 hover:text-red-900 dark:border-red-800 dark:hover:bg-red-900">
                                    View
                                </Button>
                            </Link>
                        </div>
                    ))}

                    {expiringPermits.map((app) => (
                        <div
                            key={app.id}
                            className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-900/20"
                        >
                            <div className="flex items-center space-x-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-200">
                                    <Calendar className="h-4 w-4" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
                                        Permit Expiring Soon: {app.candidate?.firstName} {app.candidate?.lastName}
                                    </p>
                                    <p className="text-xs text-amber-700 dark:text-amber-300">
                                        Expires in {formatDistanceToNow(new Date(app.permitExpiryDate!))}
                                    </p>
                                </div>
                            </div>
                            <Link href={`/dashboard/applications/${app.id}`}>
                                <Button variant="outline" size="sm" className="border-amber-200 hover:bg-amber-100 hover:text-amber-900 dark:border-amber-800 dark:hover:bg-amber-900">
                                    View
                                </Button>
                            </Link>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
