import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../lib/api';
import CandidateForm from '../../components/CandidateForm';

export default function NewCandidatePage() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

  const handleSubmit = async (candidateData) => {
    setIsSaving(true);
    setError('');
    try {
      // Convert dob to ISO string if it's not already
      const payload = {
        ...candidateData,
        dob: new Date(candidateData.dob).toISOString(),
      };
      await api('/api/candidates', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      router.push('/candidates');
    } catch (err) {
      setError(err.message);
      setIsSaving(false);
    }
  };

  if (loading || !isAuthenticated) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div className="mb-4">
        <Link href="/candidates">← Back to Candidates</Link>
      </div>
      <h1>New Candidate</h1>
      {error && <div className="alert alert-danger">{error}</div>}
      <CandidateForm onSubmit={handleSubmit} isSaving={isSaving} />
    </div>
  );
}
