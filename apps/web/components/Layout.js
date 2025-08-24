
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';

export default function Layout({ children }){
  const { user, logout } = useAuth();

  return (
    <div className="container my-4">
      <header className="d-flex justify-content-between align-items-center mb-4">
        <nav>
          <Link href="/" className="me-3">Dashboard</Link>
          <Link href="/candidates" className="me-3">Candidates</Link>
          <Link href="/clients" className="me-3">Clients</Link>
          <Link href="/applications" className="me-3">Applications</Link>
        </nav>
        {user && (
          <div>
            <span className="me-3">Welcome, {user.name}</span>
            <button className="btn btn-sm btn-outline-secondary" onClick={logout}>Logout</button>
          </div>
        )}
      </header>
      <main>
        {children}
      </main>
    </div>
  );
}
