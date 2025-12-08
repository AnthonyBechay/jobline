'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createClientDocument } from '@/app/actions/documents';
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
import { toast } from 'sonner';
import { ArrowLeft, Upload } from 'lucide-react';
import Link from 'next/link';

const uploadFormSchema = z.object({
  clientId: z.string().uuid('Please select a client'),
  documentName: z.string().min(1, 'Document name is required'),
  file: z.custom<File>((file) => file instanceof File, 'Please select a file'),
});

type UploadFormValues = z.infer<typeof uploadFormSchema>;

export default function UploadDocumentPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const form = useForm<UploadFormValues>({
    resolver: zodResolver(uploadFormSchema),
    defaultValues: {
      clientId: '',
      documentName: '',
    },
  });

  useEffect(() => {
    async function loadData() {
      try {
        const clientsResult = await getClients();

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

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      form.setValue('file', file);
      // Auto-fill document name if empty
      if (!form.getValues('documentName')) {
        form.setValue('documentName', file.name.split('.')[0]);
      }
    }
  };

  const onSubmit = async (data: UploadFormValues) => {
    try {
      setIsLoading(true);

      // Upload file to R2
      const formData = new FormData();
      formData.append('file', data.file);

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file');
      }

      const uploadResult = await uploadResponse.json();

      // Save document metadata to database
      const result = await createClientDocument({
        clientId: data.clientId,
        documentName: data.documentName,
        fileName: data.file.name,
        url: uploadResult.url,
        mimeType: data.file.type,
        size: data.file.size,
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success('Document uploaded successfully');
      router.push('/dashboard/documents');
      router.refresh();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload document');
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
        <Link href="/dashboard/documents">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Documents
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload Document</CardTitle>
          <CardDescription>
            Upload a document for a client
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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

              <FormField
                control={form.control}
                name="documentName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Document Name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Passport, ID Card, Contract"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormDescription>
                      A descriptive name for this document
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="file"
                render={({ field: { value, onChange, ...field } }) => (
                  <FormItem>
                    <FormLabel>File *</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-4">
                        <Input
                          type="file"
                          onChange={onFileChange}
                          disabled={isLoading}
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
                          {...field}
                        />
                        {selectedFile && (
                          <div className="text-sm text-muted-foreground">
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                          </div>
                        )}
                      </div>
                    </FormControl>
                    <FormDescription>
                      Supported formats: PDF, Word, Images (max 10MB)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-4">
                <Link href="/dashboard/documents">
                  <Button type="button" variant="outline" disabled={isLoading}>
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" disabled={isLoading}>
                  <Upload className="mr-2 h-4 w-4" />
                  {isLoading ? 'Uploading...' : 'Upload Document'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
