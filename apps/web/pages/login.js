
import { useState } from 'react';
import { api } from '../lib/api';

export default function Login(){
  const [email,setEmail]=useState('owner@jobline.local');
  const [password,setPassword]=useState('admin123');
  const [error,setError]=useState('');

  async function submit(e){
    e.preventDefault();
    setError('');
    try {
      const data = await api('/auth/login', { method:'POST', body: JSON.stringify({ email, password }) });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      window.location.href='/';
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div className="row justify-content-center">
      <div className="col-12 col-md-6">
        <h1>Login</h1>
        <form onSubmit={submit}>
          <div className="mb-3">
            <label>Email</label>
            <input className="form-control" value={email} onChange={e=>setEmail(e.target.value)} />
          </div>
          <div className="mb-3">
            <label>Password</label>
            <input type="password" className="form-control" value={password} onChange={e=>setPassword(e.target.value)} />
          </div>
          {error && <div className="alert alert-danger">{error}</div>}
          <button className="btn btn-primary">Sign in</button>
        </form>
      </div>
    </div>
  );
}
