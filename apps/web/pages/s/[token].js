import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { api } from '../../lib/api';

export default function StatusPage() {
  const router = useRouter();
  const { token } = router.query;
  const [app, setApp] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (token) {
      api(`/public/applications/${token}`)
        .then(setApp)
        .catch(err => {
          setError('Could not find application. Please check your link.');
          console.error(err);
        });
    }
  }, [token]);

  if (error) {
    return (
      <div className="container text-center my-5">
        <div className="alert alert-danger">{error}</div>
      </div>
    );
  }

  if (!app) {
    return <div className="container text-center my-5">Loading...</div>;
  }

  return (
    <div className="container my-5" style={{ maxWidth: '800px' }}>
      <header className="text-center mb-5">
        <h1 className="display-4">Application Status</h1>
        <p className="lead">For {app.client.name}</p>
      </header>

      <div className="card mb-4">
        <div className="card-body">
          <h5 className="card-title">Overview</h5>
          <p><strong>Candidate:</strong> {app.candidate.firstName} {app.candidate.lastName} ({app.candidate.nationality})</p>
          <p><strong>Current Status:</strong> <span className="fw-bold text-primary">{app.status.replace(/_/g, ' ')}</span></p>
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-body">
          <h5 className="card-title">Document Checklist</h5>
          <ul className="list-group list-group-flush">
            {app.documentChecklist.map(doc => (
              <li key={doc.id} className="list-group-item d-flex justify-content-between align-items-center">
                {doc.documentName}
                <span className={`badge ${doc.status === 'received' ? 'bg-success' : 'bg-secondary'}`}>{doc.status}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <h5 className="card-title">Payment History</h5>
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th className="text-end">Amount</th>
              </tr>
            </thead>
            <tbody>
              {app.payments.map(p => (
                <tr key={p.id}>
                  <td>{new Date(p.paymentDate).toLocaleDateString()}</td>
                  <td className="text-end">${p.amount.toFixed(2)}</td>
                </tr>
              ))}
              <tr className="table-light fw-bold">
                <td>Total Paid</td>
                <td className="text-end">${app.payments.reduce((s, p) => s + p.amount, 0).toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

StatusPage.noLayout = true;
