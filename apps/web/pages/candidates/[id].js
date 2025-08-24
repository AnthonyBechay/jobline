import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../lib/api';
import CandidateForm from '../../components/CandidateForm';

export default function EditCandidatePage() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const { id } = router.query;
  const [candidate, setCandidate] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    if (id) {
      api(`/api/candidates/${id}`).then(setCandidate).catch(err => {
        setError('Failed to load candidate data.');
        console.error(err);
      });
    }
  }, [id]);

  const handleSubmit = async (candidateData) => {
    setIsSaving(true);
    setError('');
    try {
      const payload = {
        ...candidateData,
        dob: new Date(candidateData.dob).toISOString(),
      };
      await api(`/api/candidates/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      router.push('/candidates');
    } catch (err) {
      setError(err.message);
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this candidate?')) {
      try {
        await api(`/api/candidates/${id}`, { method: 'DELETE' });
        router.push('/candidates');
      } catch (err) {
        setError(err.message);
      }
    }
  };

  if (loading || !isAuthenticated || !candidate) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <Link href="/candidates">← Back to Candidates</Link>
          <h1 className="mt-2">Edit Candidate</h1>
        </div>
        <button className="btn btn-danger" onClick={handleDelete}>Delete Candidate</button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      <CandidateForm candidate={candidate} onSubmit={handleSubmit} isSaving={isSaving} />
    </div>
  );
}
