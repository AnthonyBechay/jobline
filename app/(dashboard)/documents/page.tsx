import { getClientDocuments } from '@/app/actions/documents';
import { DataTable } from '@/components/tables/data-table';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { columns } from './columns';

export default async function DocumentsPage() {
  const result = await getClientDocuments();
  const documents = result.success ? result.data : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
          <p className="text-muted-foreground">Manage client documents and files</p>
        </div>
        <Link href="/dashboard/documents/upload">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Upload Document
          </Button>
        </Link>
      </div>

      <DataTable
        columns={columns}
        data={documents}
        searchKey="documentName"
        searchPlaceholder="Search documents..."
      />
    </div>
  );
}
