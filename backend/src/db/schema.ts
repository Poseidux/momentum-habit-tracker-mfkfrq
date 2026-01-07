import { pgTable, text, timestamp, uuid, boolean, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Groups table
export const groups = pgTable('groups', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  creatorId: text('creator_id').notNull(),
  inviteCode: text('invite_code').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Group members table
export const groupMembers = pgTable('group_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  groupId: uuid('group_id').notNull().references(() => groups.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull(),
  userName: text('user_name').notNull(),
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
});

// Group completions table for tracking habit completions
export const groupCompletions = pgTable('group_completions', {
  id: uuid('id').primaryKey().defaultRandom(),
  groupId: uuid('group_id').notNull().references(() => groups.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull(),
  habitName: text('habit_name').notNull(),
  date: text('date').notNull(), // ISO date format (YYYY-MM-DD)
  completed: boolean('completed').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const groupsRelations = relations(groups, ({ many }) => ({
  members: many(groupMembers),
  completions: many(groupCompletions),
}));

export const groupMembersRelations = relations(groupMembers, ({ one }) => ({
  group: one(groups, {
    fields: [groupMembers.groupId],
    references: [groups.id],
  }),
}));

export const groupCompletionsRelations = relations(groupCompletions, ({ one }) => ({
  group: one(groups, {
    fields: [groupCompletions.groupId],
    references: [groups.id],
  }),
}));
