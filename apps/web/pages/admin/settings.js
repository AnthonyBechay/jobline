import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../lib/api';

export default function SettingsPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  const [docs, setDocs] = useState([]);
  const [error, setError] = useState('');
  const [stage, setStage] = useState('');
  const [docName, setDocName] = useState('');

  const fetchData = () => {
    api('/api/settings/documents').then(setDocs).catch(console.error);
  };

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      router.push('/login');
    } else if (user.role !== 'super_admin') {
      setError('You are not authorized to view this page.');
    } else {
      fetchData();
    }
  }, [loading, isAuthenticated, user, router]);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await api('/api/settings/documents', {
        method: 'POST',
        body: JSON.stringify({ stage, documentName: docName }),
      });
      fetchData();
      setDocName('');
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this required document?')) {
      try {
        await api(`/api/settings/documents/${id}`, { method: 'DELETE' });
        fetchData();
      } catch (err) {
        alert(`Error: ${err.message}`);
      }
    }
  };

  const groupedDocs = useMemo(() => {
    return docs.reduce((acc, doc) => {
      (acc[doc.stage] = acc[doc.stage] || []).push(doc);
      return acc;
    }, {});
  }, [docs]);

  if (loading || !isAuthenticated) return <div>Loading...</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;
  if (user.role !== 'super_admin') return null;

  return (
    <div>
      <h1>Settings</h1>
      <p>Manage system-wide settings.</p>

      <div className="card">
        <div className="card-header"><h4 className="mb-0">Required Documents per Stage</h4></div>
        <div className="card-body">
          <form className="row g-2 mb-4" onSubmit={handleAdd}>
            <div className="col-md-5"><input className="form-control" placeholder="Stage (e.g. Pending_MoL)" value={stage} onChange={e => setStage(e.target.value)} required /></div>
            <div className="col-md-5"><input className="form-control" placeholder="Document Name" value={docName} onChange={e => setDocName(e.target.value)} required /></div>
            <div className="col-md-2"><button className="btn btn-primary w-100">Add</button></div>
          </form>

          {Object.entries(groupedDocs).map(([stageName, stageDocs]) => (
            <div key={stageName} className="mb-3">
              <h5>{stageName.replace(/_/g, ' ')}</h5>
              <ul className="list-group">
                {stageDocs.map(doc => (
                  <li key={doc.id} className="list-group-item d-flex justify-content-between align-items-center">
                    {doc.documentName}
                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(doc.id)}>Delete</button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
