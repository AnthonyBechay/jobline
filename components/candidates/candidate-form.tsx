'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { candidateSchema, type CandidateInput } from '@/lib/validations/candidates';
import { createCandidate } from '@/app/actions/candidates';
import { Button } from '@/components/ui/button';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { candidateStatusEnum } from '@/lib/db/schema'; // We might need to manually define this if importing from schema fails in client

const STATUS_OPTIONS = [
    'AVAILABLE_ABROAD',
    'AVAILABLE_IN_LEBANON',
    'RESERVED',
    'IN_PROCESS',
    'PLACED',
];

export function CandidateForm() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<CandidateInput>({
        resolver: zodResolver(candidateSchema),
        defaultValues: {
            firstName: '',
            lastName: '',
            nationality: '',
            status: 'AVAILABLE_ABROAD',
            education: '',
            experienceSummary: '',
            height: '',
            weight: '',
        },
    });

    async function onSubmit(data: CandidateInput) {
        try {
            setIsLoading(true);
            const formData = new FormData();

            // Append text fields
            Object.entries(data).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    if (value instanceof Date) {
                        formData.append(key, value.toISOString());
                    } else {
                        formData.append(key, String(value));
                    }
                }
            });

            // Append files
            const photoInput = document.querySelector('input[name="photo"]') as HTMLInputElement;
            const facePhotoInput = document.querySelector('input[name="facePhoto"]') as HTMLInputElement;
            const fullBodyPhotoInput = document.querySelector('input[name="fullBodyPhoto"]') as HTMLInputElement;

            if (photoInput?.files?.[0]) formData.append('photo', photoInput.files[0]);
            if (facePhotoInput?.files?.[0]) formData.append('facePhoto', facePhotoInput.files[0]);
            if (fullBodyPhotoInput?.files?.[0]) formData.append('fullBodyPhoto', fullBodyPhotoInput.files[0]);

            const result = await createCandidate(formData);

            if (result.error) {
                toast.error(result.error);
                return;
            }

            toast.success('Candidate created successfully');
            router.push('/dashboard/candidates');
            router.refresh();
        } catch (error) {
            toast.error('Something went wrong');
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>First Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="Jane" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Last Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="Doe" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="nationality"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Nationality</FormLabel>
                                <FormControl>
                                    <Input placeholder="Ethiopian" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="dateOfBirth"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Date of Birth</FormLabel>
                                <FormControl>
                                    <Input type="date" {...field} value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''} onChange={(e) => field.onChange(e.target.value)} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Status</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {STATUS_OPTIONS.map((status) => (
                                            <SelectItem key={status} value={status}>
                                                {status.replace(/_/g, ' ')}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <FormItem>
                        <FormLabel>Profile Photo</FormLabel>
                        <FormControl>
                            <Input type="file" name="photo" accept="image/*" />
                        </FormControl>
                        <FormDescription>Main profile picture</FormDescription>
                    </FormItem>

                    <FormItem>
                        <FormLabel>Face Photo</FormLabel>
                        <FormControl>
                            <Input type="file" name="facePhoto" accept="image/*" />
                        </FormControl>
                        <FormDescription>Close-up face shot</FormDescription>
                    </FormItem>

                    <FormItem>
                        <FormLabel>Full Body Photo</FormLabel>
                        <FormControl>
                            <Input type="file" name="fullBodyPhoto" accept="image/*" />
                        </FormControl>
                        <FormDescription>Full body shot</FormDescription>
                    </FormItem>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <FormField
                        control={form.control}
                        name="height"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Height</FormLabel>
                                <FormControl>
                                    <Input placeholder="165 cm" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="weight"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Weight</FormLabel>
                                <FormControl>
                                    <Input placeholder="60 kg" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="education"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Education</FormLabel>
                            <FormControl>
                                <Input placeholder="High School" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="experienceSummary"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Experience Summary</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Brief summary of work experience..."
                                    className="resize-none"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Creating...' : 'Create Candidate'}
                </Button>
            </form>
        </Form>
    );
}
