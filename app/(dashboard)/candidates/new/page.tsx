import { CandidateForm } from '@/components/candidates/candidate-form';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function NewCandidatePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link href="/candidates">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">New Candidate</h2>
          <p className="text-muted-foreground">
            Add a new candidate to your pool.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Candidate Details</CardTitle>
          <CardDescription>
            Enter the candidate's personal and professional information.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CandidateForm />
        </CardContent>
      </Card>
    </div>
  );
}
