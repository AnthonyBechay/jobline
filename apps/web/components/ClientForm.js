import { useState, useEffect } from 'react';

const emptyClient = {
  name: '',
  phone: '',
  address: '',
  notes: '',
};

export default function ClientForm({ client: initialClient, onSubmit, isSaving }) {
  const [client, setClient] = useState(emptyClient);

  useEffect(() => {
    if (initialClient) {
      setClient(initialClient);
    } else {
      setClient(emptyClient);
    }
  }, [initialClient]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setClient(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(client);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="row g-3">
        <div className="col-md-6">
          <label className="form-label">Name</label>
          <input name="name" value={client.name} onChange={handleChange} className="form-control" required />
        </div>
        <div className="col-md-6">
          <label className="form-label">Phone</label>
          <input name="phone" value={client.phone} onChange={handleChange} className="form-control" required />
        </div>
        <div className="col-12">
          <label className="form-label">Address</label>
          <input name="address" value={client.address} onChange={handleChange} className="form-control" />
        </div>
        <div className="col-12">
          <label className="form-label">Notes</label>
          <textarea name="notes" value={client.notes} onChange={handleChange} className="form-control" />
        </div>
      </div>
      <div className="mt-4">
        <button type="submit" className="btn btn-primary" disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Client'}
        </button>
      </div>
    </form>
  );
}
