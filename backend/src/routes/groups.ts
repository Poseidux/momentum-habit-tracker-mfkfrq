import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { eq, and, or, desc, isNull } from "drizzle-orm";
import * as schema from "../db/schema.js";
import type { App } from "../index.js";

// Helper function to generate invite code
function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Helper function to get today's date in ISO format
function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

// Helper function to get start of this week (Monday)
function getWeekStart(): string {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  return monday.toISOString().split('T')[0];
}

export function register(app: App, fastify: FastifyInstance) {
  const requireAuth = app.requireAuth();

  // CREATE GROUP
  fastify.post<{ Body: { name: string } }>(
    "/api/groups",
    {
      schema: {
        description: "Create a new social group",
        tags: ["groups"],
        body: {
          type: "object",
          required: ["name"],
          properties: {
            name: { type: "string" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              id: { type: "string" },
              name: { type: "string" },
              creatorId: { type: "string" },
              inviteCode: { type: "string" },
              createdAt: { type: "string" },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Body: { name: string } }>, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { name } = request.body as { name: string };
      const inviteCode = generateInviteCode();

      const [group] = await app.db
        .insert(schema.groups)
        .values({
          name,
          creatorId: session.user.id,
          inviteCode,
        })
        .returning();

      // Add creator as the first member
      await app.db.insert(schema.groupMembers).values({
        groupId: group.id,
        userId: session.user.id,
        userName: session.user.name || "Unknown",
      });

      return group;
    }
  );

  // GET USER'S GROUPS
  fastify.get(
    "/api/groups",
    {
      schema: {
        description: "Get all groups the user is a member of",
        tags: ["groups"],
        response: {
          200: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                name: { type: "string" },
                creatorId: { type: "string" },
                inviteCode: { type: "string" },
                createdAt: { type: "string" },
                memberCount: { type: "number" },
              },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      // Get groups where user is a member
      const userGroups = await app.db.query.groupMembers.findMany({
        where: eq(schema.groupMembers.userId, session.user.id),
        with: {
          group: true,
        },
      });

      // Get member counts for each group
      const groupsWithCounts = await Promise.all(
        userGroups.map(async (membership) => {
          const memberCount = await app.db
            .select()
            .from(schema.groupMembers)
            .where(eq(schema.groupMembers.groupId, membership.group.id));
          return {
            ...membership.group,
            memberCount: memberCount.length,
          };
        })
      );

      return groupsWithCounts;
    }
  );

  // GET GROUP DETAILS
  fastify.get<{ Params: { groupId: string } }>(
    "/api/groups/:groupId",
    {
      schema: {
        description: "Get group details including members",
        tags: ["groups"],
        params: {
          type: "object",
          required: ["groupId"],
          properties: {
            groupId: { type: "string" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              id: { type: "string" },
              name: { type: "string" },
              creatorId: { type: "string" },
              inviteCode: { type: "string" },
              createdAt: { type: "string" },
              members: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    userId: { type: "string" },
                    userName: { type: "string" },
                    joinedAt: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Params: { groupId: string } }>, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { groupId } = request.params as { groupId: string };

      // Check if user is member of this group
      const membership = await app.db
        .select()
        .from(schema.groupMembers)
        .where(
          and(
            eq(schema.groupMembers.groupId, groupId as any),
            eq(schema.groupMembers.userId, session.user.id)
          )
        );

      if (membership.length === 0) {
        return reply.code(403).send({ error: "Access denied" });
      }

      const group = await app.db.query.groups.findFirst({
        where: eq(schema.groups.id, groupId as any),
        with: {
          members: true,
        },
      });

      if (!group) {
        return reply.code(404).send({ error: "Group not found" });
      }

      return group;
    }
  );

  // JOIN GROUP BY INVITE CODE
  fastify.post<{ Body: { inviteCode: string } }>(
    "/api/groups/join",
    {
      schema: {
        description: "Join a group using invite code",
        tags: ["groups"],
        body: {
          type: "object",
          required: ["inviteCode"],
          properties: {
            inviteCode: { type: "string" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              message: { type: "string" },
              group: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  name: { type: "string" },
                },
              },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Body: { inviteCode: string } }>, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { inviteCode } = request.body as { inviteCode: string };

      // Find group with this invite code
      const group = await app.db
        .select()
        .from(schema.groups)
        .where(eq(schema.groups.inviteCode, inviteCode));

      if (group.length === 0) {
        return reply.code(404).send({ error: "Invalid invite code" });
      }

      const targetGroup = group[0];

      // Check if user is already a member
      const existingMembership = await app.db
        .select()
        .from(schema.groupMembers)
        .where(
          and(
            eq(schema.groupMembers.groupId, targetGroup.id),
            eq(schema.groupMembers.userId, session.user.id)
          )
        );

      if (existingMembership.length > 0) {
        return reply.code(400).send({ error: "Already a member of this group" });
      }

      // Check group size (max 10 members)
      const memberCount = await app.db
        .select()
        .from(schema.groupMembers)
        .where(eq(schema.groupMembers.groupId, targetGroup.id));

      if (memberCount.length >= 10) {
        return reply.code(400).send({ error: "Group is full (max 10 members)" });
      }

      // Add user to group
      await app.db.insert(schema.groupMembers).values({
        groupId: targetGroup.id,
        userId: session.user.id,
        userName: session.user.name || "Unknown",
      });

      return {
        message: "Successfully joined group",
        group: {
          id: targetGroup.id,
          name: targetGroup.name,
        },
      };
    }
  );

  // REMOVE MEMBER FROM GROUP
  fastify.delete<{ Params: { groupId: string; memberId: string } }>(
    "/api/groups/:groupId/members/:memberId",
    {
      schema: {
        description: "Remove a member from group (only creator can remove)",
        tags: ["groups"],
        params: {
          type: "object",
          required: ["groupId", "memberId"],
          properties: {
            groupId: { type: "string" },
            memberId: { type: "string" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              message: { type: "string" },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Params: { groupId: string; memberId: string } }>, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { groupId, memberId } = request.params as { groupId: string; memberId: string };

      // Check if user is the group creator
      const group = await app.db
        .select()
        .from(schema.groups)
        .where(eq(schema.groups.id, groupId as any));

      if (group.length === 0) {
        return reply.code(404).send({ error: "Group not found" });
      }

      if (group[0].creatorId !== session.user.id) {
        return reply.code(403).send({ error: "Only creator can remove members" });
      }

      // Remove member
      await app.db
        .delete(schema.groupMembers)
        .where(eq(schema.groupMembers.id, memberId as any));

      return { message: "Member removed successfully" };
    }
  );

  // LEAVE GROUP
  fastify.post<{ Params: { groupId: string } }>(
    "/api/groups/:groupId/leave",
    {
      schema: {
        description: "Leave a group",
        tags: ["groups"],
        params: {
          type: "object",
          required: ["groupId"],
          properties: {
            groupId: { type: "string" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              message: { type: "string" },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Params: { groupId: string } }>, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { groupId } = request.params as { groupId: string };

      // Remove user from group
      const result = await app.db
        .delete(schema.groupMembers)
        .where(
          and(
            eq(schema.groupMembers.groupId, groupId as any),
            eq(schema.groupMembers.userId, session.user.id)
          )
        )
        .returning();

      if (result.length === 0) {
        return reply.code(404).send({ error: "Not a member of this group" });
      }

      return { message: "Left group successfully" };
    }
  );

  // RECORD HABIT COMPLETION
  fastify.post<{ Params: { groupId: string }; Body: { habitName: string; completed: boolean; date?: string } }>(
    "/api/groups/:groupId/completions",
    {
      schema: {
        description: "Record a habit completion for today or specific date",
        tags: ["groups"],
        params: {
          type: "object",
          required: ["groupId"],
          properties: {
            groupId: { type: "string" },
          },
        },
        body: {
          type: "object",
          required: ["habitName", "completed"],
          properties: {
            habitName: { type: "string" },
            completed: { type: "boolean" },
            date: { type: "string" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              id: { type: "string" },
              groupId: { type: "string" },
              userId: { type: "string" },
              habitName: { type: "string" },
              date: { type: "string" },
              completed: { type: "boolean" },
              createdAt: { type: "string" },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Params: { groupId: string }; Body: { habitName: string; completed: boolean; date?: string } }>, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { groupId } = request.params as { groupId: string };
      const { habitName, completed, date } = request.body as { habitName: string; completed: boolean; date?: string };
      const recordDate = date || getToday();

      // Check if user is member of group
      const membership = await app.db
        .select()
        .from(schema.groupMembers)
        .where(
          and(
            eq(schema.groupMembers.groupId, groupId as any),
            eq(schema.groupMembers.userId, session.user.id)
          )
        );

      if (membership.length === 0) {
        return reply.code(403).send({ error: "Not a member of this group" });
      }

      // Check if completion record already exists for this date/habit
      const existingRecord = await app.db
        .select()
        .from(schema.groupCompletions)
        .where(
          and(
            eq(schema.groupCompletions.groupId, groupId as any),
            eq(schema.groupCompletions.userId, session.user.id),
            eq(schema.groupCompletions.habitName, habitName),
            eq(schema.groupCompletions.date, recordDate)
          )
        );

      if (existingRecord.length > 0) {
        // Update existing record
        const [updated] = await app.db
          .update(schema.groupCompletions)
          .set({ completed })
          .where(eq(schema.groupCompletions.id, existingRecord[0].id))
          .returning();
        return updated;
      }

      // Create new record
      const [record] = await app.db
        .insert(schema.groupCompletions)
        .values({
          groupId: groupId as any,
          userId: session.user.id,
          habitName,
          date: recordDate,
          completed,
        })
        .returning();

      return record;
    }
  );

  // GET TODAY'S COMPLETIONS FOR GROUP
  fastify.get<{ Params: { groupId: string } }>(
    "/api/groups/:groupId/completions/today",
    {
      schema: {
        description: "Get today's habit completions for all group members",
        tags: ["groups"],
        params: {
          type: "object",
          required: ["groupId"],
          properties: {
            groupId: { type: "string" },
          },
        },
        response: {
          200: {
            type: "array",
            items: {
              type: "object",
              properties: {
                userId: { type: "string" },
                userName: { type: "string" },
                habits: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      habitName: { type: "string" },
                      completed: { type: "boolean" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Params: { groupId: string } }>, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { groupId } = request.params as { groupId: string };

      // Check if user is member of group
      const membership = await app.db
        .select()
        .from(schema.groupMembers)
        .where(
          and(
            eq(schema.groupMembers.groupId, groupId as any),
            eq(schema.groupMembers.userId, session.user.id)
          )
        );

      if (membership.length === 0) {
        return reply.code(403).send({ error: "Not a member of this group" });
      }

      const today = getToday();

      // Get all members and their today's completions
      const members = await app.db
        .select()
        .from(schema.groupMembers)
        .where(eq(schema.groupMembers.groupId, groupId as any));

      const result = await Promise.all(
        members.map(async (member) => {
          const completions = await app.db
            .select()
            .from(schema.groupCompletions)
            .where(
              and(
                eq(schema.groupCompletions.groupId, groupId as any),
                eq(schema.groupCompletions.userId, member.userId),
                eq(schema.groupCompletions.date, today)
              )
            );

          return {
            userId: member.userId,
            userName: member.userName,
            habits: completions.map((c) => ({
              habitName: c.habitName,
              completed: c.completed,
            })),
          };
        })
      );

      return result;
    }
  );

  // GET WEEKLY COMPLETIONS FOR GROUP
  fastify.get<{ Params: { groupId: string } }>(
    "/api/groups/:groupId/completions/weekly",
    {
      schema: {
        description: "Get weekly habit completions for all group members (this week)",
        tags: ["groups"],
        params: {
          type: "object",
          required: ["groupId"],
          properties: {
            groupId: { type: "string" },
          },
        },
        response: {
          200: {
            type: "array",
            items: {
              type: "object",
              properties: {
                userId: { type: "string" },
                userName: { type: "string" },
                habits: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      habitName: { type: "string" },
                      completedDays: { type: "number" },
                      totalDays: { type: "number" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Params: { groupId: string } }>, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { groupId } = request.params as { groupId: string };

      // Check if user is member of group
      const membership = await app.db
        .select()
        .from(schema.groupMembers)
        .where(
          and(
            eq(schema.groupMembers.groupId, groupId as any),
            eq(schema.groupMembers.userId, session.user.id)
          )
        );

      if (membership.length === 0) {
        return reply.code(403).send({ error: "Not a member of this group" });
      }

      const weekStart = getWeekStart();

      // Get all members
      const members = await app.db
        .select()
        .from(schema.groupMembers)
        .where(eq(schema.groupMembers.groupId, groupId as any));

      const result = await Promise.all(
        members.map(async (member) => {
          // Get all completions for this member this week
          const completions = await app.db
            .select()
            .from(schema.groupCompletions)
            .where(
              and(
                eq(schema.groupCompletions.groupId, groupId as any),
                eq(schema.groupCompletions.userId, member.userId),
                // Date >= weekStart (assumes ISO date strings are comparable)
              )
            );

          // Filter for this week and group by habit
          const weekCompletions = completions.filter(
            (c) => c.date >= weekStart
          );

          // Get unique habits and calculate completion stats
          const habitMap = new Map<
            string,
            { completedDays: number; totalDays: number }
          >();

          weekCompletions.forEach((completion) => {
            if (!habitMap.has(completion.habitName)) {
              habitMap.set(completion.habitName, {
                completedDays: 0,
                totalDays: 0,
              });
            }
            const stats = habitMap.get(completion.habitName)!;
            stats.totalDays += 1;
            if (completion.completed) {
              stats.completedDays += 1;
            }
          });

          return {
            userId: member.userId,
            userName: member.userName,
            habits: Array.from(habitMap.entries()).map(([habitName, stats]) => ({
              habitName,
              ...stats,
            })),
          };
        })
      );

      return result;
    }
  );

  // REGENERATE INVITE CODE
  fastify.post<{ Params: { groupId: string } }>(
    "/api/groups/:groupId/invite-code",
    {
      schema: {
        description: "Generate a new invite code (only creator can do this)",
        tags: ["groups"],
        params: {
          type: "object",
          required: ["groupId"],
          properties: {
            groupId: { type: "string" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              inviteCode: { type: "string" },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Params: { groupId: string } }>, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { groupId } = request.params as { groupId: string };

      // Check if user is the group creator
      const group = await app.db
        .select()
        .from(schema.groups)
        .where(eq(schema.groups.id, groupId as any));

      if (group.length === 0) {
        return reply.code(404).send({ error: "Group not found" });
      }

      if (group[0].creatorId !== session.user.id) {
        return reply.code(403).send({ error: "Only creator can regenerate invite code" });
      }

      const newInviteCode = generateInviteCode();

      const [updated] = await app.db
        .update(schema.groups)
        .set({ inviteCode: newInviteCode })
        .where(eq(schema.groups.id, groupId as any))
        .returning();

      return { inviteCode: updated.inviteCode };
    }
  );
}
