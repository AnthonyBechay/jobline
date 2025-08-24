
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export function getToken() {
  return typeof window !== 'undefined' ? localStorage.getItem('token') : null;
}

export async function api(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
    credentials: 'include',
    ...options
  });
  if (!res.ok) {
    let msg = 'Request failed';
    try { const j = await res.json(); msg = j.error || msg; } catch {}
    throw new Error(msg);
  }
  return res.json();
}
