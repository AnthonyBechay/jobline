
import { useEffect, useState } from 'react';
import { api } from '../lib/api';

export default function Dashboard(){
  const [data,setData]=useState(null);
  const [user,setUser]=useState(null);
  useEffect(()=>{
    const u = localStorage.getItem('user');
    if(!u){ window.location.href='/login'; return; }
    setUser(JSON.parse(u));
    api('/api/dashboard/summary').then(setData).catch(err=>{
      if(err.message==='Unauthorized') window.location.href='/login';
    });
  },[]);

  if(!data) return <div>Loading…</div>;
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
