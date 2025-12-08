'use server';

import { db } from '@/lib/db';
import { companies, users } from '@/lib/db/schema';
import { hash } from 'bcryptjs';
import { eq } from 'drizzle-orm';
import type { RegisterInput } from '@/lib/validations/auth';

export async function registerUser(data: RegisterInput) {
  try {
    // Check if user already exists
    // Check if user already exists in this company (we need to check company name first, but for registration we create a new company)
    // Actually, for registration, we are creating a NEW company, so the user definitely doesn't exist in THIS new company.
    // But we should check if the email is already used globally? No, user can have multiple accounts.
    // But if we create a new company, we need to ensure the company name is unique if we rely on it for login.

    const existingCompany = await db.query.companies.findFirst({
      where: eq(companies.name, data.companyName),
    });

    if (existingCompany) {
      return { error: 'A company with this name already exists' };
    }

    // Hash password
    const passwordHash = await hash(data.password, 10);

    // Create company first
    const [company] = await db
      .insert(companies)
      .values({
        name: data.companyName,
      })
      .returning();

    // Create user as SUPER_ADMIN with mangled email
    const compositeEmail = `${data.email}#${company.id}`;

    const [user] = await db
      .insert(users)
      .values({
        name: data.name,
        email: compositeEmail,
        displayEmail: data.email,
        passwordHash,
        role: 'SUPER_ADMIN',
        companyId: company.id,
      })
      .returning({
        id: users.id,
        name: users.name,
        email: users.displayEmail, // Return display email
        role: users.role,
        companyId: users.companyId,
      });

    return { success: true, user };
  } catch (error) {
    console.error('Registration error:', error);
    return { error: 'Failed to create account. Please try again.' };
  }
}

export async function resolveCompanyId(companyName: string) {
  try {
    const company = await db.query.companies.findFirst({
      where: eq(companies.name, companyName),
    });

    if (!company) {
      return { error: 'Company not found' };
    }

    return { success: true, companyId: company.id };
  } catch (error) {
    console.error('Resolve company error:', error);
    return { error: 'Failed to resolve company' };
  }
}
