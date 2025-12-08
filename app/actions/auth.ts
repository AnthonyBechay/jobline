'use server';

import { db } from '@/lib/db';
import { users, companies } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { hash, compare } from 'bcryptjs';
import { login as authLogin, logout as authLogout, getSession } from '@/lib/auth';
import { LoginInput, RegisterInput } from '@/lib/validations/auth';
import { redirect } from 'next/navigation';

export async function registerUser(data: RegisterInput) {
  try {
    // Check if email already exists within the company context (though for new company, it's global check effectively if we want unique emails)
    // But here we are creating a NEW company.
    // We should probably check if user exists globally to avoid confusion, or just proceed.
    // Given the schema `emailCompanyUnique`, we can have same email in different companies.
    // But for registration of a NEW company, we don't have a company ID yet.
    // So we just create it.

    // Hash password
    const hashedPassword = await hash(data.password, 10);

    // Create company
    const [company] = await db
      .insert(companies)
      .values({
        name: data.companyName,
      })
      .returning();

    // Create user (Super Admin)
    const [user] = await db
      .insert(users)
      .values({
        name: data.name,
        email: data.email,
        displayEmail: data.email,
        passwordHash: hashedPassword,
        role: 'SUPER_ADMIN',
        companyId: company.id,
      })
      .returning();

    // Create session
    await authLogin({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      companyId: user.companyId,
    });

    return { success: true };
  } catch (error) {
    console.error('Registration error:', error);
    return { error: 'Failed to create account' };
  }
}

export async function loginUser(data: LoginInput) {
  try {
    // Find company first
    const company = await db.query.companies.findFirst({
      where: eq(companies.name, data.companyName),
    });

    if (!company) {
      return { error: 'Invalid company name' };
    }

    // Find user by email AND companyId
    const user = await db.query.users.findFirst({
      where: and(
        eq(users.email, data.email),
        eq(users.companyId, company.id)
      ),
    });

    if (!user || !user.passwordHash) {
      return { error: 'Invalid email or password' };
    }

    // Verify password
    const isValid = await compare(data.password, user.passwordHash);

    if (!isValid) {
      return { error: 'Invalid email or password' };
    }

    // Create session
    await authLogin({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      companyId: user.companyId,
    });

    return { success: true };
  } catch (error) {
    console.error('Login error:', error);
    return { error: 'Failed to login' };
  }
}

export async function logoutUser() {
  await authLogout();
  redirect('/login');
}

export async function resolveCompanyId(companyName: string) {
  // Kept for compatibility if needed, but loginUser handles it now.
  const company = await db.query.companies.findFirst({
    where: eq(companies.name, companyName),
  });

  if (!company) {
    return { error: 'Company not found' };
  }

  return { companyId: company.id };
}

export async function getClientSession() {
  const session = await getSession();
  return { data: session };
}
