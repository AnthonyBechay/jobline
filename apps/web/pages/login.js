
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';

export default function Login(){
  const { login, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('owner@jobline.local');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, loading, router]);

  async function submit(e){
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      router.push('/');
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
