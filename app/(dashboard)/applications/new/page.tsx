'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { applicationSchema, type ApplicationInput } from '@/lib/validations/application';
import { createApplication } from '@/app/actions/applications';
import { getCandidates } from '@/app/actions/candidates';
import { getClients } from '@/app/actions/clients';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { DatePicker } from '@/components/forms/date-picker';

export default function NewApplicationPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const form = useForm<ApplicationInput>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      status: 'PENDING_MOL',
      type: 'NEW_CANDIDATE',
      lawyerServiceRequested: false,
      clientId: '',
      candidateId: '',
      fromClientId: '',
      brokerId: '',
      feeTemplateId: '',
    },
  });

  useEffect(() => {
    async function loadData() {
      try {
        const [candidatesResult, clientsResult] = await Promise.all([
          getCandidates(),
          getClients(),
        ]);

        if (candidatesResult.success) {
          setCandidates(candidatesResult.data);
        }
        if (clientsResult.success) {
          setClients(clientsResult.data);
        }
      } catch (error) {
        toast.error('Failed to load data');
      } finally {
        setLoadingData(false);
      }
    }

    loadData();
  }, []);

  const onSubmit = async (data: ApplicationInput) => {
    try {
      setIsLoading(true);
      const result = await createApplication(data);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success('Application created successfully');
      router.push('/applications');
      router.refresh();
    } catch (error) {
      toast.error('Failed to create application');
    } finally {
      setIsLoading(false);
    }
  };

  if (loadingData) {
    return <div className="flex items-center justify-center h-96">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/applications">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Applications
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create New Application</CardTitle>
          <CardDescription>
            Create a new job application for a candidate
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="candidateId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Candidate *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={isLoading}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select candidate" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {candidates.map((candidate) => (
                            <SelectItem key={candidate.id} value={candidate.id}>
                              {candidate.firstName} {candidate.lastName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="clientId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={isLoading}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select client" />
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
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Application Type *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={isLoading}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="NEW_CANDIDATE">New Candidate</SelectItem>
                          <SelectItem value="GUARANTOR_CHANGE">Guarantor Change</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={isLoading}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="PENDING_MOL">Pending MOL</SelectItem>
                          <SelectItem value="MOL_AUTH_RECEIVED">MOL Auth Received</SelectItem>
                          <SelectItem value="VISA_PROCESSING">Visa Processing</SelectItem>
                          <SelectItem value="VISA_RECEIVED">Visa Received</SelectItem>
                          <SelectItem value="WORKER_ARRIVED">Worker Arrived</SelectItem>
                          <SelectItem value="LABOUR_PERMIT_PROCESSING">
                            Labour Permit Processing
                          </SelectItem>
                          <SelectItem value="RESIDENCY_PERMIT_PROCESSING">
                            Residency Permit Processing
                          </SelectItem>
                          <SelectItem value="ACTIVE_EMPLOYMENT">Active Employment</SelectItem>
                          <SelectItem value="CONTRACT_ENDED">Contract Ended</SelectItem>
                          <SelectItem value="RENEWAL_PENDING">Renewal Pending</SelectItem>
                          <SelectItem value="CANCELLED_PRE_ARRIVAL">
                            Cancelled (Pre-Arrival)
                          </SelectItem>
                          <SelectItem value="CANCELLED_POST_ARRIVAL">
                            Cancelled (Post-Arrival)
                          </SelectItem>
                          <SelectItem value="CANCELLED_CANDIDATE">
                            Cancelled (Candidate)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="exactArrivalDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Arrival Date</FormLabel>
                      <DatePicker
                        date={field.value}
                        onSelect={field.onChange}
                        disabled={isLoading}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="permitExpiryDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Permit Expiry Date</FormLabel>
                      <DatePicker
                        date={field.value}
                        onSelect={field.onChange}
                        disabled={isLoading}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="laborPermitDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Labor Permit Date</FormLabel>
                      <DatePicker
                        date={field.value}
                        onSelect={field.onChange}
                        disabled={isLoading}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="residencyPermitDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Residency Permit Date</FormLabel>
                      <DatePicker
                        date={field.value}
                        onSelect={field.onChange}
                        disabled={isLoading}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="finalFeeAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Final Fee Amount</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value || undefined)}
                        value={field.value || ''}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormDescription>Enter the final fee amount in USD</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="lawyerServiceRequested"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Lawyer Service Requested</FormLabel>
                        <FormDescription>
                          Check if legal services are required for this application
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                {form.watch('lawyerServiceRequested') && (
                  <div className="grid grid-cols-2 gap-4 ml-6">
                    <FormField
                      control={form.control}
                      name="lawyerFeeCost"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Lawyer Fee Cost</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value || undefined)}
                              value={field.value || ''}
                              disabled={isLoading}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="lawyerFeeCharge"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Lawyer Fee Charge</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value || undefined)}
                              value={field.value || ''}
                              disabled={isLoading}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-4">
                <Link href="/applications">
                  <Button type="button" variant="outline" disabled={isLoading}>
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Creating...' : 'Create Application'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
