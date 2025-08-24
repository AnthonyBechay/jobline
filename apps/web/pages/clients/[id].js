import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../lib/api';
import ClientForm from '../../components/ClientForm';

function Lifeline({ applications }) {
  if (!applications || applications.length === 0) {
    return <p>No application history for this client.</p>;
  }
  return (
    <div className="card">
      <div className="card-header">
        <h4 className="mb-0">Hiring Lifeline</h4>
      </div>
      <ul className="list-group list-group-flush">
        {applications.map(app => (
          <li key={app.id} className="list-group-item d-flex justify-content-between align-items-center">
            <div>
              <strong>{app.candidate.firstName} {app.candidate.lastName}</strong> ({app.type.replace(/_/g, ' ')})
              <small className="d-block text-muted">Started: {new Date(app.createdAt).toLocaleDateString()}</small>
            </div>
            <span className={`badge bg-info`}>{app.status.replace(/_/g, ' ')}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function EditClientPage() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const { id } = router.query;
  const [client, setClient] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    if (id) {
      api(`/api/clients/${id}`).then(setClient).catch(err => {
        setError('Failed to load client data.');
        console.error(err);
      });
    }
  }, [id]);

  const handleSubmit = async (clientData) => {
    setIsSaving(true);
    setError('');
    try {
      await api(`/api/clients/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(clientData),
      });
      router.push('/clients');
    } catch (err) {
      setError(err.message);
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this client? This will also delete all associated applications.')) {
      try {
        await api(`/api/clients/${id}`, { method: 'DELETE' });
        router.push('/clients');
      } catch (err) {
        setError(err.message);
      }
    }
  };

  if (loading || !isAuthenticated || !client) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <Link href="/clients">← Back to Clients</Link>
          <h1 className="mt-2">Edit Client</h1>
        </div>
        <button className="btn btn-danger" onClick={handleDelete}>Delete Client</button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="row g-5">
        <div className="col-md-6">
          <h4>Client Profile</h4>
          <ClientForm client={client} onSubmit={handleSubmit} isSaving={isSaving} />
        </div>
        <div className="col-md-6">
          <Lifeline applications={client.applications} />
        </div>
      </div>
    </div>
  );
}
