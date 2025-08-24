import { api } from '../lib/api';

const DOCUMENT_STATUSES = ['pending', 'received', 'submitted'];

export default function DocumentChecklist({ items, onUpdate }) {

  const handleStatusChange = async (docId, newStatus) => {
    try {
      const updatedDoc = await api(`/api/documents/${docId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      onUpdate(updatedDoc);
    } catch (error) {
      console.error("Failed to update document status", error);
      alert("Error: Could not update document status.");
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <h4 className="mb-0">Document Checklist</h4>
      </div>
      <ul className="list-group list-group-flush">
        {items.length === 0 && <li className="list-group-item">No documents required for this stage yet.</li>}
        {items.map(item => (
          <li key={item.id} className="list-group-item d-flex justify-content-between align-items-center">
            <span>{item.documentName}</span>
            <select
              className="form-select form-select-sm w-auto"
              value={item.status}
              onChange={(e) => handleStatusChange(item.id, e.target.value)}
            >
              {DOCUMENT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </li>
        ))}
      </ul>
    </div>
  );
}
