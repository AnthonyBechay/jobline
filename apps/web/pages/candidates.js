
import { useEffect, useState } from 'react';
import { api } from '../lib/api';

export default function Candidates(){
  const [items,setItems]=useState([]);
  const [q,setQ]=useState('');
  const [status,setStatus]=useState('');
  useEffect(()=>{
    const u = localStorage.getItem('user');
    if(!u){ window.location.href='/login'; return; }
    load();
  },[]);

  async function load(){
    const qs = new URLSearchParams({ q, status }).toString();
    const data = await api(`/api/candidates?${qs}`);
    setItems(data);
  }

  return (
    <div>
      <h1>Candidates</h1>
      <div className="row g-2 mb-3">
        <div className="col-md-4"><input className="form-control" placeholder="Search name…" value={q} onChange={e=>setQ(e.target.value)} /></div>
        <div className="col-md-3">
          <select className="form-select" value={status} onChange={e=>setStatus(e.target.value)}>
            <option value="">All statuses</option>
            <option>Available_Abroad</option>
            <option>Available_In_Lebanon</option>
            <option>Reserved</option>
            <option>In_Process</option>
            <option>Placed</option>
          </select>
        </div>
        <div className="col-md-2"><button className="btn btn-secondary w-100" onClick={load}>Filter</button></div>
      </div>
      <table className="table">
        <thead><tr><th>Name</th><th>Nationality</th><th>Status</th></tr></thead>
        <tbody>
          {items.map(x=>(
            <tr key={x.id}><td>{x.firstName} {x.lastName}</td><td>{x.nationality}</td><td>{x.status}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
