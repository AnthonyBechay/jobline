import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const secretKey = process.env.BETTER_AUTH_SECRET || 'secret-key-min-32-chars-long';
const key = new TextEncoder().encode(secretKey);

export interface Session {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    companyId: string;
  };
  expires: Date;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  companyId: string;
}

export async function encrypt(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(key);
}

export async function decrypt(input: string): Promise<any> {
  try {
    const { payload } = await jwtVerify(input, key, {
      algorithms: ['HS256'],
    });
    return payload;
  } catch (error) {
    return null;
  }
}

export async function login(userData: User) {
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  const session = await encrypt({ user: userData, expires });

  const cookieStore = await cookies();
  // Only set secure flag if using HTTPS (check if NEXT_PUBLIC_APP_URL starts with https)
  const isSecure = process.env.NEXT_PUBLIC_APP_URL?.startsWith('https://') ?? false;

  cookieStore.set('session', session, {
    httpOnly: true,
    secure: isSecure,
    expires,
    sameSite: 'lax',
    path: '/',
  });
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete('session');
}

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get('session')?.value;
  if (!session) return null;
  return await decrypt(session);
}

export async function updateSession(request: any) {
  const session = request.cookies.get('session')?.value;
  if (!session) return;

  // Refresh the session so it doesn't expire
  const parsed = await decrypt(session);
  parsed.expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const res = await encrypt(parsed);

  // Only set secure flag if using HTTPS
  const isSecure = process.env.NEXT_PUBLIC_APP_URL?.startsWith('https://') ?? false;

  request.cookies.set({
    name: 'session',
    value: res,
    httpOnly: true,
    secure: isSecure,
    expires: parsed.expires,
    sameSite: 'lax',
    path: '/',
  });
  return res;
}
