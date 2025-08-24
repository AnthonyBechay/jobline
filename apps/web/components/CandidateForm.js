import { useState, useEffect } from 'react';
import { CANDIDATE_STATUSES } from '../pages/candidates'; // Assuming you export it

const emptyCandidate = {
  firstName: '',
  lastName: '',
  dob: '',
  nationality: '',
  education: '',
  skills: '',
  experienceSummary: '',
  status: 'Available_Abroad',
};

export default function CandidateForm({ candidate: initialCandidate, onSubmit, isSaving }) {
  const [candidate, setCandidate] = useState(emptyCandidate);

  useEffect(() => {
    if (initialCandidate) {
      const skills = initialCandidate.skills ? JSON.parse(initialCandidate.skills).join(', ') : '';
      const dob = initialCandidate.dob ? new Date(initialCandidate.dob).toISOString().split('T')[0] : '';
      setCandidate({ ...initialCandidate, skills, dob });
    } else {
      setCandidate(emptyCandidate);
    }
  }, [initialCandidate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCandidate(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(candidate);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="row g-3">
        <div className="col-md-6">
          <label className="form-label">First Name</label>
          <input name="firstName" value={candidate.firstName} onChange={handleChange} className="form-control" required />
        </div>
        <div className="col-md-6">
          <label className="form-label">Last Name</label>
          <input name="lastName" value={candidate.lastName} onChange={handleChange} className="form-control" required />
        </div>
        <div className="col-md-6">
          <label className="form-label">Date of Birth</label>
          <input name="dob" type="date" value={candidate.dob} onChange={handleChange} className="form-control" required />
        </div>
        <div className="col-md-6">
          <label className="form-label">Nationality</label>
          <input name="nationality" value={candidate.nationality} onChange={handleChange} className="form-control" required />
        </div>
        <div className="col-md-6">
          <label className="form-label">Status</label>
          <select name="status" value={candidate.status} onChange={handleChange} className="form-select" required>
            {CANDIDATE_STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
          </select>
        </div>
        <div className="col-md-6">
          <label className="form-label">Skills (comma-separated)</label>
          <input name="skills" value={candidate.skills} onChange={handleChange} className="form-control" />
        </div>
        <div className="col-12">
          <label className="form-label">Education</label>
          <textarea name="education" value={candidate.education} onChange={handleChange} className="form-control" />
        </div>
        <div className="col-12">
          <label className="form-label">Experience Summary</label>
          <textarea name="experienceSummary" value={candidate.experienceSummary} onChange={handleChange} className="form-control" />
        </div>
      </div>
      <div className="mt-4">
        <button type="submit" className="btn btn-primary" disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Candidate'}
        </button>
      </div>
    </form>
  );
}
