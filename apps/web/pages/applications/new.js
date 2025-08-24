import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../lib/api';

const APPLICATION_TYPES = ['New_Candidate', 'Guarantor_Change'];
const INITIAL_STATUS_NEW = 'Pending_MoL';
const INITIAL_STATUS_GUARANTOR = 'Pending_Guarantor_Change';

export default function NewApplicationPage() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  const [clients, setClients] = useState([]);
  const [candidates, setCandidates] = useState([]);

  const [clientId, setClientId] = useState('');
  const [candidateId, setCandidateId] = useState('');
  const [type, setType] = useState(APPLICATION_TYPES[0]);

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      api('/api/clients').then(setClients).catch(console.error);
      const availableStatuses = 'Available_Abroad,Available_In_Lebanon';
      api(`/api/candidates?status=${availableStatuses}`).then(setCandidates).catch(console.error);
    }
  }, [isAuthenticated]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!clientId || !candidateId || !type) {
      setError('All fields are required.');
      return;
    }
    setIsSaving(true);
    setError('');
    try {
      const payload = {
        clientId,
        candidateId,
        type,
        status: type === 'New_Candidate' ? INITIAL_STATUS_NEW : INITIAL_STATUS_GUARANTOR,
      };
      const newApp = await api('/api/applications', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      // Also update the candidate's status to In_Process
      await api(`/api/candidates/${candidateId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'In_Process' }),
      });
      router.push(`/applications/${newApp.id}`);
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
        <Link href="/applications">← Back to Applications</Link>
      </div>
      <h1>New Application</h1>
      {error && <div className="alert alert-danger">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="row g-3">
          <div className="col-12">
            <label className="form-label">Client</label>
            <select value={clientId} onChange={e => setClientId(e.target.value)} className="form-select" required>
              <option value="" disabled>Select a client</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="col-12">
            <label className="form-label">Candidate</label>
            <select value={candidateId} onChange={e => setCandidateId(e.target.value)} className="form-select" required>
              <option value="" disabled>Select an available candidate</option>
              {candidates.map(c => <option key={c.id} value={c.id}>{c.firstName} {c.lastName} ({c.nationality})</option>)}
            </select>
          </div>
          <div className="col-12">
            <label className="form-label">Application Type</label>
            <div>
              {APPLICATION_TYPES.map(t => (
                <div className="form-check form-check-inline" key={t}>
                  <input className="form-check-input" type="radio" name="appType" id={t} value={t} checked={type === t} onChange={() => setType(t)} />
                  <label className="form-check-label" htmlFor={t}>{t.replace(/_/g, ' ')}</label>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-4">
          <button type="submit" className="btn btn-primary" disabled={isSaving}>
            {isSaving ? 'Creating...' : 'Create Application'}
          </button>
        </div>
      </form>
    </div>
  );
}
