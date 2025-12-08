'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { documentTemplateSchema, type DocumentTemplateInput } from '@/lib/validations/settings';
import { createDocumentTemplate } from '@/app/actions/settings';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const stages = [
    'PENDING_MOL',
    'MOL_AUTH_RECEIVED',
    'VISA_PROCESSING',
    'VISA_RECEIVED',
    'WORKER_ARRIVED',
    'LABOUR_PERMIT_PROCESSING',
    'RESIDENCY_PERMIT_PROCESSING',
    'ACTIVE_EMPLOYMENT',
    'CONTRACT_ENDED',
    'RENEWAL_PENDING',
    'CANCELLED_PRE_ARRIVAL',
    'CANCELLED_POST_ARRIVAL',
    'CANCELLED_CANDIDATE',
];

export default function NewDocumentTemplatePage() {
    const router = useRouter();
    const pathname = usePathname();
    const [isLoading, setIsLoading] = useState(false);

    const isOffice = pathname.includes('office-documents');
    const requiredFrom = isOffice ? 'office' : 'client';

    const form = useForm<DocumentTemplateInput>({
        resolver: zodResolver(documentTemplateSchema),
        defaultValues: {
            name: '',
            description: '',
            stage: 'PENDING_MOL',
            required: true,
            requiredFrom: requiredFrom,
        },
    });

    async function onSubmit(data: DocumentTemplateInput) {
        try {
            setIsLoading(true);
            const result = await createDocumentTemplate(data);

            if (result.error) {
                toast.error(result.error);
                return;
            }

            toast.success('Document requirement created successfully');
            router.push(`/dashboard/settings/${requiredFrom}-documents`);
            router.refresh();
        } catch (error) {
            toast.error('Something went wrong');
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center space-x-4">
                <Link href={`/dashboard/settings/${requiredFrom}-documents`}>
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">
                        New {isOffice ? 'Office' : 'Client'} Document Requirement
                    </h2>
                    <p className="text-muted-foreground">
                        Define a document that needs to be {isOffice ? 'secured by the office' : 'provided by the client'}.
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Document Details</CardTitle>
                    <CardDescription>
                        Configure when this document is required.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Document Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. Work Permit" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="stage"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Required at Stage</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a stage" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {stages.map((stage) => (
                                                    <SelectItem key={stage} value={stage}>
                                                        {stage.replace(/_/g, ' ')}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormDescription>
                                            The application stage where this document becomes relevant.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="required"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                        <div className="space-y-1 leading-none">
                                            <FormLabel>Mandatory</FormLabel>
                                            <FormDescription>
                                                Is this document strictly required to proceed?
                                            </FormDescription>
                                        </div>
                                    </FormItem>
                                )}
                            />

                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? 'Creating...' : 'Create Requirement'}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
