import { prisma } from '../lib/prisma';

export async function getDeveloperTaskIds(userId: string): Promise<string[]> {
  const tasks = await prisma.task.findMany({
    where: { assignedDeveloperId: userId },
    select: { id: true },
  });
  return tasks.map(t => t.id);
}

export async function getManagerProjectIds(userId: string): Promise<string[]> {
  const projects = await prisma.project.findMany({
    where: { createdById: userId },
    select: { id: true },
  });
  return projects.map(p => p.id);
}