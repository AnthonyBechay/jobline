
export default function Layout({ children }){
  return (
    <div className="container my-4">
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet"/>
      <nav className="mb-4">
        <a href="/" className="me-3">Dashboard</a>
        <a href="/candidates" className="me-3">Candidates</a>
        <a href="/clients" className="me-3">Clients</a>
        <a href="/applications" className="me-3">Applications</a>
      </nav>
      {children}
    </div>
  );
}
