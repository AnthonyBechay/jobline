
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';

export default function Dashboard(){
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      api('/api/dashboard/summary').then(setData).catch(console.error);
    }
  }, [isAuthenticated]);

  if (loading || !data) return <div>Loading…</div>;
  return (
    <div>
      <h1>Dashboard</h1>
      <div className="row g-3">
        <div className="col-md-3"><div className="card p-3"><h5>Applications</h5><div className="fs-3">{data.appsCount}</div></div></div>
        <div className="col-md-3"><div className="card p-3"><h5>Pending Docs</h5><div className="fs-3">{data.pendingDocs}</div></div></div>
        <div className="col-md-3"><div className="card p-3"><h5>Renewals ≤60d</h5><div className="fs-3">{data.renewalsDue}</div></div></div>
        {data.financial && (
          <div className="col-md-3">
            <div className="card p-3">
              <h5>Financial (This DB)</h5>
              <div>Revenue: ${data.financial.revenue.toFixed(2)}</div>
              <div>Costs: ${data.financial.costs.toFixed(2)}</div>
              <div>Profit: ${data.financial.profit.toFixed(2)}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
