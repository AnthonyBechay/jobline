
import { useEffect, useState } from 'react';
import { api } from '../lib/api';

export default function Clients(){
  const [items,setItems]=useState([]);
  const [form,setForm]=useState({ name:'', phone:'' });
  useEffect(()=>{
    const u = localStorage.getItem('user');
    if(!u){ window.location.href='/login'; return; }
    load();
  },[]);

  async function load(){
    setItems(await api('/api/clients'));
  }
  async function create(e){
    e.preventDefault();
    await api('/api/clients',{ method:'POST', body: JSON.stringify(form) });
    setForm({ name:'', phone:'' }); load();
  }

  return (
    <div>
      <h1>Clients</h1>
      <form className="row g-2 mb-3" onSubmit={create}>
        <div className="col-md-4"><input className="form-control" placeholder="Name" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} /></div>
        <div className="col-md-3"><input className="form-control" placeholder="Phone" value={form.phone} onChange={e=>setForm({...form, phone:e.target.value})} /></div>
        <div className="col-md-2"><button className="btn btn-primary w-100">Add</button></div>
      </form>
      <table className="table">
        <thead><tr><th>Name</th><th>Phone</th></tr></thead>
        <tbody>{items.map(x=>(<tr key={x.id}><td>{x.name}</td><td>{x.phone}</td></tr>))}</tbody>
      </table>
    </div>
  );
}
