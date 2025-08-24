
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';

export const CANDIDATE_STATUSES = [
  'Available_Abroad',
  'Available_In_Lebanon',
  'Reserved',
  'In_Process',
  'Placed'
];

function calculateAge(dob) {
  const diff = Date.now() - new Date(dob).getTime();
  const age = new Date(diff);
  return Math.abs(age.getUTCFullYear() - 1970);
}

export default function CandidatesPage(){
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [nationality, setNationality] = useState('');
  const [importMessage, setImportMessage] = useState('');

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setImportMessage('Importing...');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/candidates/import`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Import failed');
      setImportMessage(data.message);
      // Refresh the list
      const params = new URLSearchParams({ q, status, nationality }).toString();
      api(`/api/candidates?${params}`).then(setItems).catch(console.error);
    } catch (err) {
      setImportMessage(`Error: ${err.message}`);
    } finally {
      // Clear the file input
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
      const params = new URLSearchParams({ q, status, nationality }).toString();
      api(`/api/candidates?${params}`).then(setItems).catch(console.error);
    }
  }, [q, status, nationality, isAuthenticated]);

  if (loading || !isAuthenticated) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Candidates</h1>
        <div className="d-flex gap-2">
          <a href={`${process.env.NEXT_PUBLIC_API_URL}/api/candidates/export`} className="btn btn-secondary" download>Export to CSV</a>
          <button className="btn btn-secondary" onClick={() => document.getElementById('csv-import').click()}>Import from CSV</button>
          <Link href="/candidates/new" className="btn btn-primary">Create Candidate</Link>
          <input type="file" id="csv-import" style={{ display: 'none' }} accept=".csv" onChange={handleImport} />
        </div>
      </div>

      {importMessage && <div className="alert alert-info">{importMessage}</div>}

      <div className="row g-3 mb-3">
        <div className="col-md-4">
          <input className="form-control" placeholder="Search name…" value={q} onChange={e => setQ(e.target.value)} />
        </div>
        <div className="col-md-3">
          <select className="form-select" value={status} onChange={e => setStatus(e.target.value)}>
            <option value="">All Statuses</option>
            {CANDIDATE_STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
          </select>
        </div>
        <div className="col-md-3">
          <input className="form-control" placeholder="Filter by nationality…" value={nationality} onChange={e => setNationality(e.target.value)} />
        </div>
      </div>

      <div className="card">
        <table className="table table-hover mb-0">
          <thead>
            <tr>
              <th>Name</th>
              <th>Nationality</th>
              <th>Status</th>
              <th>Age</th>
              <th>Skills</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map(x => (
              <tr key={x.id}>
                <td>{x.firstName} {x.lastName}</td>
                <td>{x.nationality}</td>
                <td><span className={`badge bg-secondary`}>{x.status.replace(/_/g, ' ')}</span></td>
                <td>{calculateAge(x.dob)}</td>
                <td>{x.skills ? JSON.parse(x.skills).join(', ') : ''}</td>
                <td className="text-end">
                  <Link href={`/candidates/${x.id}`} className="btn btn-sm btn-outline-secondary">Edit</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
