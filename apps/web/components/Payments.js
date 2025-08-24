import { useState } from 'react';
import { api } from '../lib/api';

export default function Payments({ applicationId, items, onUpdate, totalCost }) {
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const totalPaid = items.reduce((sum, p) => sum + p.amount, 0);
  const balance = totalCost - totalPaid;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const newPayment = {
        amount: parseFloat(amount),
        notes,
        paymentDate: new Date().toISOString(),
      };
      await api(`/api/applications/${applicationId}/payments`, {
        method: 'POST',
        body: JSON.stringify(newPayment),
      });
      setAmount('');
      setNotes('');
      onUpdate(); // Trigger a refresh of the application data
    } catch (error) {
      console.error("Failed to add payment", error);
      alert("Error: could not add payment.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="card">
      <div className="card-header"><h4 className="mb-0">Client Payments</h4></div>
      <div className="card-body">
        <h5>Payment History</h5>
        <ul className="list-group mb-3">
          {items.map(p => (
            <li key={p.id} className="list-group-item">
              ${p.amount.toFixed(2)} on {new Date(p.paymentDate).toLocaleDateString()}
              {p.notes && <small className="d-block text-muted">{p.notes}</small>}
            </li>
          ))}
          {items.length === 0 && <li className="list-group-item">No payments recorded.</li>}
        </ul>

        <h5>Summary</h5>
        <p>Total Billed: ${totalCost.toFixed(2)}</p>
        <p>Total Paid: ${totalPaid.toFixed(2)}</p>
        <p className="fw-bold">Balance Due: ${balance.toFixed(2)}</p>

        <hr/>

        <h5>Add New Payment</h5>
        <form onSubmit={handleSubmit}>
          <div className="row g-2">
            <div className="col-md-6">
              <label className="form-label">Amount (USD)</label>
              <input type="number" step="0.01" className="form-control" value={amount} onChange={e => setAmount(e.target.value)} required />
            </div>
            <div className="col-md-6">
              <label className="form-label">Notes</label>
              <input className="form-control" value={notes} onChange={e => setNotes(e.target.value)} />
            </div>
          </div>
          <button className="btn btn-sm btn-success mt-2" type="submit" disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Add Payment'}
          </button>
        </form>
      </div>
    </div>
  );
}
