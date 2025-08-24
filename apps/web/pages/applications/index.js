
import { useEffect, useState } from 'react';
import { api } from '../../lib/api';

export default function Applications(){
  const [items,setItems]=useState([]);
  useEffect(()=>{
    const u = localStorage.getItem('user');
    if(!u){ window.location.href='/login'; return; }
    api('/api/applications').then(setItems);
  },[]);

  return (
    <div>
      <h1>Applications</h1>
      <table className="table">
        <thead><tr><th>Client</th><th>Candidate</th><th>Status</th><th>Type</th><th>Link</th></tr></thead>
        <tbody>
          {items.map(x=>(
            <tr key={x.id}>
              <td>{x.client?.name}</td>
              <td>{x.candidate?.firstName} {x.candidate?.lastName}</td>
              <td>{x.status}</td>
              <td>{x.type}</td>
              <td><a target="_blank" href={`/s/${x.clientAccessLink}`}>Public Page</a></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
