import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../lib/api';

function ManagementSection({ title, items, onAdd, onDelete, onUpdate }) {
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');

  const handleAdd = (e) => {
    e.preventDefault();
    onAdd({ name, contactDetails: contact }, () => {
      setName('');
      setContact('');
    });
  };

  return (
    <div className="card">
      <div className="card-header"><h4 className="mb-0">{title}</h4></div>
      <div className="card-body">
        <form className="row g-2 mb-3" onSubmit={handleAdd}>
          <div className="col-md-5"><input className="form-control" placeholder="Name" value={name} onChange={e => setName(e.target.value)} required /></div>
          <div className="col-md-5"><input className="form-control" placeholder="Contact Details" value={contact} onChange={e => setContact(e.target.value)} /></div>
          <div className="col-md-2"><button className="btn btn-primary w-100">Add</button></div>
        </form>
        <ul className="list-group">
          {items.map(item => (
            <li key={item.id} className="list-group-item d-flex justify-content-between align-items-center">
              <div>
                <strong>{item.name}</strong>
                {item.contactDetails && <small className="d-block text-muted">{item.contactDetails}</small>}
              </div>
              <button className="btn btn-sm btn-outline-danger" onClick={() => onDelete(item.id)}>Delete</button>
            </li>
          ))}
          {items.length === 0 && <li className="list-group-item">No items yet.</li>}
        </ul>
      </div>
    </div>
  );
}

export default function ThirdPartiesPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  const [agents, setAgents] = useState([]);
  const [brokers, setBrokers] = useState([]);
  const [error, setError] = useState('');

  const fetchData = () => {
    api('/api/agents').then(setAgents).catch(console.error);
    api('/api/brokers').then(setBrokers).catch(console.error);
  };

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      router.push('/login');
    } else if (user.role !== 'super_admin') {
      setError('You are not authorized to view this page.');
      // Optionally redirect
      // router.push('/');
    } else {
      fetchData();
    }
  }, [loading, isAuthenticated, user, router]);

  const handleAdd = (endpoint) => async (data, callback) => {
    try {
      await api(endpoint, { method: 'POST', body: JSON.stringify(data) });
      fetchData();
      if (callback) callback();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleDelete = (endpoint) => async (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await api(`${endpoint}/${id}`, { method: 'DELETE' });
        fetchData();
      } catch (err) {
        alert(`Error: ${err.message}`);
      }
    }
  };

  if (loading || !isAuthenticated) return <div>Loading...</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;
  if (user.role !== 'super_admin') return null; // Or show error message

  return (
    <div>
      <h1>Third-Party Management</h1>
      <p>Manage sourcing agents and arrival brokers.</p>

      <div className="vstack gap-4">
        <ManagementSection
          title="Sourcing Agents"
          items={agents}
          onAdd={handleAdd('/api/agents')}
          onDelete={handleDelete('/api/agents')}
        />
        <ManagementSection
          title="Arrival Brokers"
          items={brokers}
          onAdd={handleAdd('/api/brokers')}
          onDelete={handleDelete('/api/brokers')}
        />
      </div>
    </div>
  );
}
