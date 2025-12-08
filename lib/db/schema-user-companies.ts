import { pgTable, uuid, index, unique, timestamp, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users, companies, userRoleEnum } from './schema';

/**
 * Junction table for multi-company user support
 * Allows users to belong to multiple companies with different roles
 */
export const userCompanyMemberships = pgTable(
  'user_company_memberships',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id, { onDelete: 'cascade' }),
    role: userRoleEnum('role').notNull(),
    isDefault: boolean('is_default').notNull().default(false),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('user_company_memberships_user_id_idx').on(table.userId),
    companyIdIdx: index('user_company_memberships_company_id_idx').on(table.companyId),
    userCompanyUnique: unique('user_company_memberships_user_company_unique').on(
      table.userId,
      table.companyId
    ),
  })
);

// Relations
export const userCompanyMembershipsRelations = relations(
  userCompanyMemberships,
  ({ one }) => ({
    user: one(users, {
      fields: [userCompanyMemberships.userId],
      references: [users.id],
    }),
    company: one(companies, {
      fields: [userCompanyMemberships.companyId],
      references: [companies.id],
    }),
  })
);

// Update users relations to include memberships
export const usersRelationsExtended = relations(users, ({ many }) => ({
  companyMemberships: many(userCompanyMemberships),
}));

// Update companies relations to include memberships
export const companiesRelationsExtended = relations(companies, ({ many }) => ({
  userMemberships: many(userCompanyMemberships),
}));

// Types
export type UserCompanyMembership = typeof userCompanyMemberships.$inferSelect;
export type NewUserCompanyMembership = typeof userCompanyMemberships.$inferInsert;
