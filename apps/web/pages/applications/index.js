
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../lib/api';

export default function ApplicationsPage() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      api('/api/applications').then(setItems).catch(console.error);
    }
  }, [isAuthenticated]);

  if (loading || !isAuthenticated) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Applications</h1>
        <Link href="/applications/new" className="btn btn-primary">Create Application</Link>
      </div>

      <div className="card">
        <table className="table table-hover mb-0">
          <thead>
            <tr>
              <th>Client</th>
              <th>Candidate</th>
              <th>Status</th>
              <th>Type</th>
              <th>Public Link</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map(x => (
              <tr key={x.id}>
                <td>{x.client?.name}</td>
                <td>{x.candidate?.firstName} {x.candidate?.lastName}</td>
                <td><span className="badge bg-info">{x.status.replace(/_/g, ' ')}</span></td>
                <td>{x.type.replace(/_/g, ' ')}</td>
                <td><a href={`/s/${x.clientAccessLink}`} target="_blank" rel="noreferrer">View</a></td>
                <td className="text-end">
                  <Link href={`/applications/${x.id}`} className="btn btn-sm btn-outline-secondary">View / Edit</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
