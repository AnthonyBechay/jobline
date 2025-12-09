'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { lawyerFeeSchema, type LawyerFeeInput } from '@/lib/validations/settings';
import { getLawyerFees, updateLawyerFees } from '@/app/actions/settings';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function LawyerFeesPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);

    const form = useForm<LawyerFeeInput>({
        resolver: zodResolver(lawyerFeeSchema),
        defaultValues: {
            lawyerFeeCost: 0,
            lawyerFeeCharge: 0,
            description: '',
            active: true,
        },
    });

    useEffect(() => {
        async function fetchSettings() {
            try {
                const settings = await getLawyerFees();
                if (settings) {
                    form.reset({
                        lawyerFeeCost: Number(settings.lawyerFeeCost),
                        lawyerFeeCharge: Number(settings.lawyerFeeCharge),
                        description: settings.description || '',
                        active: settings.active,
                    });
                }
            } catch (error) {
                console.error('Failed to fetch lawyer fees:', error);
                toast.error('Failed to load settings');
            } finally {
                setIsFetching(false);
            }
        }

        fetchSettings();
    }, [form]);

    async function onSubmit(data: LawyerFeeInput) {
        try {
            setIsLoading(true);
            const result = await updateLawyerFees(data);

            if (result.error) {
                toast.error(result.error);
                return;
            }

            toast.success('Lawyer fees updated successfully');
            router.refresh();
        } catch (error) {
            toast.error('Something went wrong');
        } finally {
            setIsLoading(false);
        }
    }

    if (isFetching) {
        return <div>Loading...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center space-x-4">
                <Link href="/settings">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Lawyer Fees</h2>
                    <p className="text-muted-foreground">
                        Configure the internal cost and client price for lawyer services.
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Fee Configuration</CardTitle>
                    <CardDescription>
                        Set the cost (what you pay) and charge (what the client pays).
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <FormField
                                    control={form.control}
                                    name="lawyerFeeCost"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Internal Cost</FormLabel>
                                            <FormControl>
                                                <Input type="number" {...field} />
                                            </FormControl>
                                            <FormDescription>
                                                The amount you pay to the lawyer.
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="lawyerFeeCharge"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Client Charge</FormLabel>
                                            <FormControl>
                                                <Input type="number" {...field} />
                                            </FormControl>
                                            <FormDescription>
                                                The amount you charge the client.
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Description</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Optional notes..." {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="active"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                        <div className="space-y-1 leading-none">
                                            <FormLabel>Active Service</FormLabel>
                                            <FormDescription>
                                                Is this service currently offered?
                                            </FormDescription>
                                        </div>
                                    </FormItem>
                                )}
                            />

                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
