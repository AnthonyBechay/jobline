import { useState } from 'react';
import { api } from '../lib/api';

export default function Costs({ applicationId, items, onUpdate }) {
  const [amount, setAmount] = useState('');
  const [costType, setCostType] = useState('');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const newCost = {
        amount: parseFloat(amount),
        costType,
        description,
        costDate: new Date().toISOString(),
      };
      await api(`/api/applications/${applicationId}/costs`, {
        method: 'POST',
        body: JSON.stringify(newCost),
      });
      setAmount('');
      setCostType('');
      setDescription('');
      onUpdate(); // Trigger a refresh of the application data
    } catch (error) {
      console.error("Failed to add cost", error);
      alert("Error: could not add cost.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="card border-danger">
      <div className="card-header bg-danger text-white"><h4 className="mb-0">Costs (Super Admin)</h4></div>
      <div className="card-body">
        <h5>Cost History</h5>
        <ul className="list-group mb-3">
          {items.map(c => (
            <li key={c.id} className="list-group-item">
              ${c.amount.toFixed(2)} for "{c.costType}" on {new Date(c.costDate).toLocaleDateString()}
              {c.description && <small className="d-block text-muted">{c.description}</small>}
            </li>
          ))}
          {items.length === 0 && <li className="list-group-item">No costs recorded.</li>}
        </ul>

        <hr/>

        <h5>Add New Cost</h5>
        <form onSubmit={handleSubmit}>
          <div className="row g-2">
            <div className="col-md-4">
              <label className="form-label">Amount (USD)</label>
              <input type="number" step="0.01" className="form-control" value={amount} onChange={e => setAmount(e.target.value)} required />
            </div>
            <div className="col-md-4">
              <label className="form-label">Cost Type</label>
              <input className="form-control" value={costType} onChange={e => setCostType(e.target.value)} placeholder="e.g. ticket, gov_fee" required/>
            </div>
            <div className="col-md-4">
              <label className="form-label">Description</label>
              <input className="form-control" value={description} onChange={e => setDescription(e.target.value)} />
            </div>
          </div>
          <button className="btn btn-sm btn-danger mt-2" type="submit" disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Add Cost'}
          </button>
        </form>
      </div>
    </div>
  );
}
