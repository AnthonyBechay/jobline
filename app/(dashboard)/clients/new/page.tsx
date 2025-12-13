'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { clientSchema, type ClientInput } from '@/lib/validations/client';
import { createClient, getClients } from '@/app/actions/clients';
import { Button } from '@/components/ui/button';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface Client {
    id: string;
    name: string;
}

export default function NewClientPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [clients, setClients] = useState<Client[]>([]);

    const form = useForm<ClientInput>({
        resolver: zodResolver(clientSchema),
        defaultValues: {
            name: '',
            phone: '',
            address: '',
            notes: '',
            referredByClient: '',
        },
    });

    useEffect(() => {
        async function loadClients() {
            try {
                const result = await getClients();
                if (result.success) {
                    setClients(result.data as Client[]);
                }
            } catch (error) {
                console.error('Failed to load clients:', error);
            }
        }
        loadClients();
    }, []);

    async function onSubmit(data: ClientInput) {
        try {
            setIsLoading(true);
            const formData = new FormData();

            // Append text fields
            Object.entries(data).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    formData.append(key, String(value));
                }
            });

            // Append files
            const identityDocInput = document.querySelector('input[name="identityDocument"]') as HTMLInputElement;
            const document1Input = document.querySelector('input[name="document1"]') as HTMLInputElement;
            const document2Input = document.querySelector('input[name="document2"]') as HTMLInputElement;

            if (identityDocInput?.files?.[0]) formData.append('identityDocument', identityDocInput.files[0]);
            if (document1Input?.files?.[0]) formData.append('document1', document1Input.files[0]);
            if (document2Input?.files?.[0]) formData.append('document2', document2Input.files[0]);

            const result = await createClient(formData);

            if (result.error) {
                toast.error(result.error);
                return;
            }

            toast.success('Client created successfully');
            router.push('/clients');
            router.refresh();
        } catch (error) {
            toast.error('Something went wrong');
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/clients">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">New Client</h1>
                    <p className="text-muted-foreground">Add a new recruitment client</p>
                </div>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Client name" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Phone</FormLabel>
                                    <FormControl>
                                        <Input placeholder="+961 1 234567" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Address</FormLabel>
                                <FormControl>
                                    <Input placeholder="Client address" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="referredByClient"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Referred By Client (Optional)</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value || undefined}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="None" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {clients.map((client) => (
                                            <SelectItem key={client.id} value={client.id}>
                                                {client.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormDescription>
                                    Select a client who referred this new client (leave empty if none)
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Notes</FormLabel>
                                <FormControl>
                                    <Textarea
                                        placeholder="Any additional notes about this client..."
                                        className="resize-none"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Documents</h3>

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div className="space-y-4">
                                <FormItem>
                                    <FormLabel>Identity Document</FormLabel>
                                    <FormControl>
                                        <Input type="file" name="identityDocument" accept="image/*,.pdf" />
                                    </FormControl>
                                    <FormDescription>Upload ID, passport, or other identification</FormDescription>
                                </FormItem>

                                <FormField
                                    control={form.control}
                                    name="identityDocumentTag"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Identity Document Tag</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g., Passport, National ID" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="space-y-4">
                                <FormItem>
                                    <FormLabel>Additional Document 1</FormLabel>
                                    <FormControl>
                                        <Input type="file" name="document1" accept="image/*,.pdf" />
                                    </FormControl>
                                    <FormDescription>Upload additional paperwork</FormDescription>
                                </FormItem>

                                <FormField
                                    control={form.control}
                                    name="document1Tag"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Document 1 Tag</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g., Work Permit, Contract" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div className="space-y-4">
                                <FormItem>
                                    <FormLabel>Additional Document 2</FormLabel>
                                    <FormControl>
                                        <Input type="file" name="document2" accept="image/*,.pdf" />
                                    </FormControl>
                                    <FormDescription>Upload additional paperwork</FormDescription>
                                </FormItem>

                                <FormField
                                    control={form.control}
                                    name="document2Tag"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Document 2 Tag</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g., License, Certificate" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>
                    </div>

                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? 'Creating...' : 'Create Client'}
                    </Button>
                </form>
            </Form>
        </div>
    );
}
