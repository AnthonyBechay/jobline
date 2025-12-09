'use server';

import { db } from '@/lib/db';
import { agents } from '@/lib/db/schema';
import { agentSchema, type AgentInput } from '@/lib/validations/agent';
import { requireAuth } from '@/lib/auth-utils';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function createAgent(data: AgentInput) {
  try {
    const { user } = await requireAuth();
    const validated = agentSchema.parse(data);

    const [agent] = await db
      .insert(agents)
      .values({
        ...validated,
        companyId: user.companyId,
      })
      .returning();

    revalidatePath('/agents');
    return { success: true, data: agent };
  } catch (error) {
    console.error('Create agent error:', error);
    return { error: 'Failed to create agent' };
  }
}

export async function updateAgent(id: string, data: AgentInput) {
  try {
    const { user } = await requireAuth();
    const validated = agentSchema.parse(data);

    const [agent] = await db
      .update(agents)
      .set({
        ...validated,
        updatedAt: new Date(),
      })
      .where(and(eq(agents.id, id), eq(agents.companyId, user.companyId)))
      .returning();

    if (!agent) {
      return { error: 'Agent not found' };
    }

    revalidatePath('/agents');
    return { success: true, data: agent };
  } catch (error) {
    console.error('Update agent error:', error);
    return { error: 'Failed to update agent' };
  }
}

export async function deleteAgent(id: string) {
  try {
    const { user } = await requireAuth();

    await db
      .delete(agents)
      .where(and(eq(agents.id, id), eq(agents.companyId, user.companyId)));

    revalidatePath('/agents');
    return { success: true };
  } catch (error) {
    console.error('Delete agent error:', error);
    return { error: 'Failed to delete agent' };
  }
}

export async function getAgents() {
  try {
    const { user } = await requireAuth();

    const allAgents = await db.query.agents.findMany({
      where: eq(agents.companyId, user.companyId),
      orderBy: (agents, { desc }) => [desc(agents.createdAt)],
    });

    return { success: true, data: allAgents };
  } catch (error) {
    console.error('Get agents error:', error);
    return { error: 'Failed to fetch agents' };
  }
}

export async function getAgent(id: string) {
  try {
    const { user } = await requireAuth();

    const agent = await db.query.agents.findFirst({
      where: and(eq(agents.id, id), eq(agents.companyId, user.companyId)),
    });

    if (!agent) {
      return { error: 'Agent not found' };
    }

    return { success: true, data: agent };
  } catch (error) {
    console.error('Get agent error:', error);
    return { error: 'Failed to fetch agent' };
  }
}
