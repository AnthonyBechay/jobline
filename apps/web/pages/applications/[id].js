import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../lib/api';
import DocumentChecklist from '../../components/DocumentChecklist';
import Payments from '../../components/Payments';
import Costs from '../../components/Costs';

// This would come from a settings module in a real app
const MOCK_OFFICE_FEE = 2000;

const STATUS_WORKFLOW = [
  "Pending_MoL",
  "MoL_Auth_Received",
  "Visa_Application",
  "Visa_Received",
  "Worker_Arrived",
  "Labour_Permit_Done",
  "Residency_Permit_Done",
  "Active_Employment",
  "Contract_Ended",
];

export default function ApplicationDetailPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const { id } = router.query;

  const [app, setApp] = useState(null);
  const [error, setError] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [brokers, setBrokers] = useState([]);
  const [brokerId, setBrokerId] = useState('');

  const fetchData = () => {
    if (id) {
      api(`/api/applications/${id}`)
        .then(data => {
          setApp(data);
          setNewStatus(data.status);
          setBrokerId(data.brokerId || '');
        })
        .catch(err => {
          setError('Failed to load application data.');
          console.error(err);
        });
    }
  };

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
    if (isAuthenticated) {
      api('/api/brokers').then(setBrokers).catch(console.error);
    }
  }, [loading, isAuthenticated, router]);

  useEffect(fetchData, [id]);

  const handleBrokerSave = async () => {
    try {
      await api(`/api/applications/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ brokerId: brokerId === '' ? null : brokerId }),
      });
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleStatusSave = async () => {
    try {
      await api(`/api/applications/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      fetchData(); // Refresh data to show changes
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDocUpdate = (updatedDoc) => {
    setApp(prev => ({
      ...prev,
      documentChecklist: prev.documentChecklist.map(d => d.id === updatedDoc.id ? updatedDoc : d),
    }));
  };

  const totalCost = (app?.costs?.reduce((sum, c) => sum + c.amount, 0) || 0) + MOCK_OFFICE_FEE;

  if (loading || !isAuthenticated || !app) {
    return <div>Loading...</div>;
  }

  const isSuperAdmin = user.role === 'super_admin';

  return (
    <div>
      <div className="mb-4">
        <Link href="/applications">← Back to Applications</Link>
      </div>

      <div className="d-flex justify-content-between align-items-start">
        <div>
          <h1>Application for {app.client.name}</h1>
          <p className="lead">Hiring {app.candidate.firstName} {app.candidate.lastName} ({app.candidate.nationality})</p>
        </div>
        <div className="text-end">
          <span className={`badge fs-5 bg-primary mb-2 d-block`}>{app.status.replace(/_/g, ' ')}</span>
          <div className="input-group input-group-sm">
            <select className="form-select" value={newStatus} onChange={e => setNewStatus(e.target.value)}>
              {STATUS_WORKFLOW.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
            </select>
            <button className="btn btn-secondary" onClick={handleStatusSave} disabled={newStatus === app.status}>Update Status</button>
          </div>
        </div>
      </div>

      <hr className="my-4" />

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="row g-5">
        <div className="col-md-7">
          <div className="vstack gap-4">
            <DocumentChecklist items={app.documentChecklist} onUpdate={handleDocUpdate} />
            <Payments applicationId={app.id} items={app.payments} onUpdate={fetchData} totalCost={totalCost} />
          </div>
        </div>
        <div className="col-md-5">
          {isSuperAdmin && (
            <div className="vstack gap-4">
              <Costs applicationId={app.id} items={app.costs} onUpdate={fetchData} />

              <div className="card border-warning">
                <div className="card-header bg-warning"><h4 className="mb-0">Profitability</h4></div>
                <div className="card-body">
                  <p>Total Revenue: ${app.payments.reduce((s,p)=>s+p.amount,0).toFixed(2)}</p>
                  <p>Total Costs: ${app.costs.reduce((s,c)=>s+c.amount,0).toFixed(2)}</p>
                  <hr/>
                  <p className="fw-bold">Profit: ${(app.payments.reduce((s,p)=>s+p.amount,0) - app.costs.reduce((s,c)=>s+c.amount,0)).toFixed(2)}</p>
                </div>
              </div>

              <div className="card">
                <div className="card-header"><h4 className="mb-0">Assign Broker</h4></div>
                <div className="card-body">
                  <div className="input-group">
                    <select className="form-select" value={brokerId} onChange={e => setBrokerId(e.target.value)}>
                      <option value="">No Broker</option>
                      {brokers.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                    <button className="btn btn-secondary" onClick={handleBrokerSave} disabled={brokerId === (app.brokerId || '')}>Save</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
