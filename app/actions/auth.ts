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
    // Check if company name already exists
    const existingCompany = await db.query.companies.findFirst({
      where: eq(companies.name, data.companyName),
    });

    if (existingCompany) {
      return { error: 'Company name already exists. Please choose a different name.' };
    }

    // Hash password
    const hashedPassword = await hash(data.password, 10);

    // Create company
    const [company] = await db
      .insert(companies)
      .values({
        name: data.companyName,
      })
      .returning();

    if (!company) {
      console.error('Failed to create company');
      return { error: 'Failed to create company. Please try again.' };
    }

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

    if (!user) {
      console.error('Failed to create user');
      return { error: 'Failed to create user account. Please try again.' };
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
  } catch (error: any) {
    console.error('Registration error:', error);

    // Provide more specific error messages
    if (error?.code === 'ECONNREFUSED') {
      return { error: 'Database connection failed. Please try again later.' };
    }

    if (error?.code === '23505') {
      return { error: 'An account with this email or company name already exists.' };
    }

    if (error?.message) {
      console.error('Error message:', error.message);
    }

    return { error: 'Failed to create account. Please try again.' };
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
