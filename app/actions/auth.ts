'use server';

import { db } from '@/lib/db';
import { companies, users } from '@/lib/db/schema';
import { hash } from 'bcryptjs';
import { eq } from 'drizzle-orm';
import type { RegisterInput } from '@/lib/validations/auth';

export async function registerUser(data: RegisterInput) {
  try {
    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, data.email),
    });

    if (existingUser) {
      return { error: 'A user with this email already exists' };
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

    // Create user as SUPER_ADMIN
    const [user] = await db
      .insert(users)
      .values({
        name: data.name,
        email: data.email,
        passwordHash,
        role: 'SUPER_ADMIN',
        companyId: company.id,
      })
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        companyId: users.companyId,
      });

    return { success: true, user };
  } catch (error) {
    console.error('Registration error:', error);
    return { error: 'Failed to create account. Please try again.' };
  }
}
