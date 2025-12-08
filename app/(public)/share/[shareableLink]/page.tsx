import { db } from '@/lib/db';
import { applications, documentChecklistItems } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { formatDate } from '@/lib/utils';
import { CheckCircle2, Clock, FileText } from 'lucide-react';

interface ShareableApplicationPageProps {
  params: {
    shareableLink: string;
  };
}

export default async function ShareableApplicationPage({ params }: ShareableApplicationPageProps) {
  // Fetch application by shareable link
  const application = await db.query.applications.findFirst({
    where: eq(applications.shareableLink, params.shareableLink),
    with: {
      candidate: true,
      client: true,
    },
  });

  if (!application) {
    notFound();
  }

  // Fetch client documents checklist (requiredFrom = 'client')
  const clientDocuments = await db.query.documentChecklistItems.findMany({
    where: eq(documentChecklistItems.applicationId, application.id),
  });

  const clientChecklist = clientDocuments.filter(doc => doc.requiredFrom === 'client');

  const formatStatus = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING_MOL: 'bg-yellow-500',
      MOL_AUTH_RECEIVED: 'bg-blue-500',
      VISA_PROCESSING: 'bg-indigo-500',
      VISA_RECEIVED: 'bg-green-500',
      WORKER_ARRIVED: 'bg-teal-500',
      ACTIVE_EMPLOYMENT: 'bg-emerald-500',
      CONTRACT_ENDED: 'bg-gray-500',
    };
    return colors[status] || 'bg-gray-500';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900">Application Status</h1>
          <p className="mt-2 text-gray-600">Track your application progress in real-time</p>
        </div>

        {/* Application Details */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">
                  {application.candidate?.firstName} {application.candidate?.lastName}
                </CardTitle>
                <CardDescription className="mt-1">
                  Reference: {application.id.slice(0, 8).toUpperCase()}
                </CardDescription>
              </div>
              <Badge className={getStatusColor(application.status)}>
                {formatStatus(application.status)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-gray-500">Client</p>
                <p className="mt-1 text-lg">{application.client?.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Application Type</p>
                <p className="mt-1 text-lg">{formatStatus(application.type)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Created Date</p>
                <p className="mt-1 text-lg">{formatDate(application.createdAt)}</p>
              </div>
              {application.exactArrivalDate && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Expected Arrival</p>
                  <p className="mt-1 text-lg">{formatDate(application.exactArrivalDate)}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Timeline/Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Application Progress
            </CardTitle>
            <CardDescription>Current stage and timeline</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { status: 'PENDING_MOL', label: 'Pending MOL Authorization' },
                { status: 'MOL_AUTH_RECEIVED', label: 'MOL Authorization Received' },
                { status: 'VISA_PROCESSING', label: 'Visa Processing' },
                { status: 'VISA_RECEIVED', label: 'Visa Received' },
                { status: 'WORKER_ARRIVED', label: 'Worker Arrived' },
                { status: 'LABOUR_PERMIT_PROCESSING', label: 'Labor Permit Processing' },
                { status: 'RESIDENCY_PERMIT_PROCESSING', label: 'Residency Permit Processing' },
                { status: 'ACTIVE_EMPLOYMENT', label: 'Active Employment' },
              ].map((stage, index) => {
                const isCompleted = index <= getStatusIndex(application.status);
                const isCurrent = stage.status === application.status;

                return (
                  <div key={stage.status} className="flex items-center gap-3">
                    {isCompleted ? (
                      <CheckCircle2 className="h-6 w-6 text-green-500" />
                    ) : (
                      <div className="h-6 w-6 rounded-full border-2 border-gray-300" />
                    )}
                    <div className="flex-1">
                      <p
                        className={`text-sm font-medium ${
                          isCurrent ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-400'
                        }`}
                      >
                        {stage.label}
                        {isCurrent && (
                          <Badge className="ml-2 bg-blue-500">Current Stage</Badge>
                        )}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Client Document Checklist */}
        {clientChecklist.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Your Document Checklist
              </CardTitle>
              <CardDescription>
                Documents we need you to provide for this application
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {clientChecklist.map((doc) => (
                  <div key={doc.id} className="flex items-center gap-3 rounded-lg border p-3">
                    <Checkbox
                      checked={doc.status === 'RECEIVED'}
                      disabled
                      className="h-5 w-5"
                    />
                    <div className="flex-1">
                      <p className="font-medium">{doc.documentName}</p>
                      {doc.required && (
                        <Badge variant="outline" className="mt-1 text-xs">
                          Required
                        </Badge>
                      )}
                    </div>
                    {doc.status === 'RECEIVED' && (
                      <Badge className="bg-green-500">Received</Badge>
                    )}
                  </div>
                ))}
              </div>
              <p className="mt-4 text-sm text-gray-600">
                Please provide these documents to your recruitment consultant as soon as possible.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          <p>For questions or assistance, please contact your recruitment consultant.</p>
          <p className="mt-2">This link is private and confidential.</p>
        </div>
      </div>
    </div>
  );
}

// Helper function to determine stage index
function getStatusIndex(status: string): number {
  const statuses = [
    'PENDING_MOL',
    'MOL_AUTH_RECEIVED',
    'VISA_PROCESSING',
    'VISA_RECEIVED',
    'WORKER_ARRIVED',
    'LABOUR_PERMIT_PROCESSING',
    'RESIDENCY_PERMIT_PROCESSING',
    'ACTIVE_EMPLOYMENT',
  ];
  return statuses.indexOf(status);
}
