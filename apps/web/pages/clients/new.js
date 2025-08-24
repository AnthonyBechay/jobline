import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../lib/api';
import ClientForm from '../../components/ClientForm';

export default function NewClientPage() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

  const handleSubmit = async (clientData) => {
    setIsSaving(true);
    setError('');
    try {
      await api('/api/clients', {
        method: 'POST',
        body: JSON.stringify(clientData),
      });
      router.push('/clients');
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
        <Link href="/clients">← Back to Clients</Link>
      </div>
      <h1>New Client</h1>
      {error && <div className="alert alert-danger">{error}</div>}
      <ClientForm onSubmit={handleSubmit} isSaving={isSaving} />
    </div>
  );
}
