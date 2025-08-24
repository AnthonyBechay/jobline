
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';

export default function ClientsPage() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [q, setQ] = useState('');
  const [importMessage, setImportMessage] = useState('');

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    setImportMessage('Importing...');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/import`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Import failed');
      setImportMessage(data.message);
      api(`/api/clients?q=${q}`).then(setItems).catch(console.error);
    } catch (err) {
      setImportMessage(`Error: ${err.message}`);
    } finally {
      e.target.value = null;
    }
  };

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      // We'll need to add search to the client API endpoint
      api(`/api/clients?q=${q}`).then(setItems).catch(console.error);
    }
  }, [q, isAuthenticated]);

  if (loading || !isAuthenticated) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Clients</h1>
        <div className="d-flex gap-2">
          <a href={`${process.env.NEXT_PUBLIC_API_URL}/api/clients/export`} className="btn btn-secondary" download>Export to CSV</a>
          <button className="btn btn-secondary" onClick={() => document.getElementById('csv-import').click()}>Import from CSV</button>
          <Link href="/clients/new" className="btn btn-primary">Create Client</Link>
          <input type="file" id="csv-import" style={{ display: 'none' }} accept=".csv" onChange={handleImport} />
        </div>
      </div>

      {importMessage && <div className="alert alert-info">{importMessage}</div>}

      <div className="row g-3 mb-3">
        <div className="col-md-4">
          <input className="form-control" placeholder="Search name…" value={q} onChange={e => setQ(e.target.value)} />
        </div>
      </div>

      <div className="card">
        <table className="table table-hover mb-0">
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Address</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map(x => (
              <tr key={x.id}>
                <td>{x.name}</td>
                <td>{x.phone}</td>
                <td>{x.address}</td>
                <td className="text-end">
                  <Link href={`/clients/${x.id}`} className="btn btn-sm btn-outline-secondary">View / Edit</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
