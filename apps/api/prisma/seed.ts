import { PrismaClient, Role, TaskStatus, TaskPriority } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const daysFromNow = (days: number) => new Date(Date.now() + days * 24 * 60 * 60 * 1000);

interface TaskSeed {
  title: string;
  description: string;
  devIndex: number;
  status: TaskStatus;
  priority: TaskPriority;
  dueInDays: number;
}

type ProjectSeed = {
  name: string;
  description: string;
  clientName: string;
  clientEmail: string;
  pmIndex: number;
  tasks: TaskSeed[];
};

async function main() {
  // Idempotent: wipe everything so re-running the seed gives a clean, known state.
  await prisma.refreshToken.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  await prisma.client.deleteMany();
  await prisma.user.deleteMany();

  const users = {
    admin: await prisma.user.create({
      data: {
        name: 'Ravi Mehta',
        email: 'admin@agency.com',
        passwordHash: bcrypt.hashSync('admin123', 12),
        role: Role.ADMIN,
      },
    }),
    managers: [] as { id: string }[],
    developers: [] as { id: string; name: string }[],
  };

  const managerSeeds = [
    { name: 'Sarah Chen', email: 'manager1@agency.com' },
    { name: 'Mike Okafor', email: 'manager2@agency.com' },
  ];
  const developerSeeds = [
    { name: 'Priya Sharma', email: 'dev1@agency.com' },
    { name: 'Tom Becker', email: 'dev2@agency.com' },
    { name: 'Lena Kowalski', email: 'dev3@agency.com' },
    { name: 'Mark Ruiz', email: 'dev4@agency.com' },
  ];

  for (const pm of managerSeeds) {
    users.managers.push(
      await prisma.user.create({
        data: {
          name: pm.name,
          email: pm.email,
          passwordHash: bcrypt.hashSync('manager123', 12),
          role: Role.PROJECT_MANAGER,
        },
      }),
    );
  }

  for (const dev of developerSeeds) {
    users.developers.push(
      await prisma.user.create({
        data: {
          name: dev.name,
          email: dev.email,
          passwordHash: bcrypt.hashSync('dev123', 12),
          role: Role.DEVELOPER,
        },
      }),
    );
  }

  const projects: ProjectSeed[] = [
    {
      name: 'Checkout rebuild',
      description: 'Rewrite the checkout flow with a one-page payment experience and Braintree integration.',
      clientName: 'Brightline Retail',
      clientEmail: 'contact@brightline.example.com',
      pmIndex: 0,
      tasks: [
        { title: 'Wire up one-page checkout', description: 'Replace the multi-step cart flow with a single page.', devIndex: 0, status: TaskStatus.DONE, priority: TaskPriority.HIGH, dueInDays: -6 },
        { title: 'Braintree tokenization endpoint', description: 'Server-side tokenization for saved cards.', devIndex: 1, status: TaskStatus.DONE, priority: TaskPriority.CRITICAL, dueInDays: -3 },
        { title: 'Order confirmation emails', description: 'Transactional emails for placing and shipping.', devIndex: 2, status: TaskStatus.IN_PROGRESS, priority: TaskPriority.MEDIUM, dueInDays: 2 },
        { title: 'Fraud scoring integration', description: 'Hook into Sift for manual review queue.', devIndex: 3, status: TaskStatus.IN_REVIEW, priority: TaskPriority.CRITICAL, dueInDays: 3 },
        { title: 'Guest checkout support', description: 'Allow purchasing without an account.', devIndex: 0, status: TaskStatus.TODO, priority: TaskPriority.HIGH, dueInDays: 6 },
        { title: 'Promo code engine', description: 'Percentage and fixed amount codes with limits.', devIndex: 1, status: TaskStatus.TODO, priority: TaskPriority.MEDIUM, dueInDays: 9 },
        { title: 'Accessibility pass on checkout', description: 'Keyboard + screen reader review of the new flow.', devIndex: 2, status: TaskStatus.TODO, priority: TaskPriority.LOW, dueInDays: 12 },
      ],
    },
    {
      name: 'CRM data migration',
      description: 'Move 400k customer records from the legacy CRM into the new platform without downtime.',
      clientName: 'Northwind Health',
      clientEmail: 'data@northwind.example.com',
      pmIndex: 0,
      tasks: [
        { title: 'Field mapping spreadsheet', description: 'Agree on the source-to-target mapping with the client.', devIndex: 2, status: TaskStatus.DONE, priority: TaskPriority.HIGH, dueInDays: -4 },
        { title: 'Reconciliation scripts', description: 'Diff source vs target counts and values.', devIndex: 3, status: TaskStatus.IN_PROGRESS, priority: TaskPriority.CRITICAL, dueInDays: -2 },
        { title: 'Phone number normalization', description: 'E.164 normalization for US and EU numbers.', devIndex: 0, status: TaskStatus.IN_PROGRESS, priority: TaskPriority.HIGH, dueInDays: 1 },
        { title: 'Duplicate account merge', description: 'Deterministic merge rules for duplicate patients.', devIndex: 1, status: TaskStatus.IN_REVIEW, priority: TaskPriority.MEDIUM, dueInDays: 4 },
        { title: 'Dry-run report review', description: 'Review the pre-go-live migration report with stakeholders.', devIndex: 2, status: TaskStatus.TODO, priority: TaskPriority.LOW, dueInDays: 7 },
      ],
    },
    {
      name: 'Delivery tracking app',
      description: 'Consumer app showing live courier position and delivery windows.',
      clientName: 'Fetch & Co',
      clientEmail: 'hello@fetchco.example.com',
      pmIndex: 1,
      tasks: [
        { title: 'Live map with courier pins', description: 'Mapbox layer updated from the courier feed.', devIndex: 3, status: TaskStatus.IN_PROGRESS, priority: TaskPriority.CRITICAL, dueInDays: -1 },
        { title: 'Pickup scan API', description: 'Scan + timestamp endpoint for couriers.', devIndex: 0, status: TaskStatus.IN_PROGRESS, priority: TaskPriority.HIGH, dueInDays: 2 },
        { title: 'Delivery window estimation', description: 'ETA from historical route data.', devIndex: 1, status: TaskStatus.IN_REVIEW, priority: TaskPriority.MEDIUM, dueInDays: 3 },
        { title: 'Push notification on arrival', description: 'Geofence-triggered notifications.', devIndex: 2, status: TaskStatus.TODO, priority: TaskPriority.HIGH, dueInDays: 5 },
        { title: 'App store screenshots', description: 'Screenshots and copy for both stores.', devIndex: 4, status: TaskStatus.TODO, priority: TaskPriority.LOW, dueInDays: 10 },
      ],
    },
  ];

  const createdProjects = new Map<string, { id: string; pmId: string }>();
  const createdTasks = new Map<string, { id: string; title: string; status: TaskStatus; projectId: string; pmId: string }>();

  for (const [pIdx, seed] of projects.entries()) {
    const client = await prisma.client.create({
      data: { name: seed.clientName, email: seed.clientEmail },
    });
    const pm = users.managers[seed.pmIndex];
    const project = await prisma.project.create({
      data: {
        name: seed.name,
        description: seed.description,
        clientId: client.id,
        createdById: pm.id,
      },
    });
    createdProjects.set(seed.name, { id: project.id, pmId: pm.id });

    await prisma.activityLog.create({
      data: { projectId: project.id, userId: pm.id, action: 'PROJECT_CREATED' },
    });

    for (const [tIdx, t] of seed.tasks.entries()) {
      const dev = users.developers[t.devIndex % users.developers.length];
      const isOverdue = t.dueInDays < 0 && t.status !== TaskStatus.DONE;
      const task = await prisma.task.create({
        data: {
          title: t.title,
          description: t.description,
          projectId: project.id,
          assignedDeveloperId: dev.id,
          status: t.status,
          priority: t.priority,
          dueDate: daysFromNow(t.dueInDays),
          isOverdue,
        },
      });
      createdTasks.set(`${seed.name}:${t.title}`, {
        id: task.id,
        title: task.title,
        status: task.status,
        projectId: project.id,
        pmId: pm.id,
      });

      await prisma.activityLog.create({
        data: { projectId: project.id, taskId: task.id, userId: pm.id, action: 'TASK_CREATED', newStatus: TaskStatus.TODO },
      });
      // Only seed a couple of extra transitions so the feed is realistic but small.
      if (t.status === TaskStatus.IN_PROGRESS || t.status === TaskStatus.IN_REVIEW || t.status === TaskStatus.DONE) {
        await prisma.activityLog.create({
          data: {
            projectId: project.id,
            taskId: task.id,
            userId: dev.id,
            action: 'TASK_STATUS_CHANGED',
            previousStatus: TaskStatus.TODO,
            newStatus: t.status,
          },
        });
      }
    }
  }

  // Notifications that feel like a real day at the agency.
  const notificationData = [
    {
      user: users.developers[0],
      type: 'TASK_ASSIGNED',
      title: 'New task assigned',
      message: 'You have been assigned "Phone number normalization" in project "CRM data migration"',
    },
    {
      user: users.developers[3],
      type: 'TASK_ASSIGNED',
      title: 'New task assigned',
      message: 'You have been assigned "Live map with courier pins" in project "Delivery tracking app"',
    },
    {
      user: users.developers[2],
      type: 'TASK_ASSIGNED',
      title: 'New task assigned',
      message: 'You have been assigned "Push notification on arrival" in project "Delivery tracking app"',
    },
    {
      user: users.managers[0],
      type: 'TASK_MOVED_TO_REVIEW',
      title: 'Task ready for review',
      message: '"Duplicate account merge" in project "CRM data migration" was moved to In Review',
    },
    {
      user: users.managers[1],
      type: 'TASK_MOVED_TO_REVIEW',
      title: 'Task ready for review',
      message: '"Delivery window estimation" in project "Delivery tracking app" was moved to In Review',
    },
  ] as const;

  const taskByTitle = (title: string) =>
    [...createdTasks.values()].find(t => t.title === title);

  for (const n of notificationData) {
    const task = taskByTitle((n.message.match(/"([^"]+)"/) ?? [])[1] ?? '');
    await prisma.notification.create({
      data: {
        userId: n.user.id,
        type: n.type,
        title: n.title,
        message: n.message,
        taskId: task?.id ?? null,
      },
    });
  }

  const counts = {
    users: await prisma.user.count(),
    clients: await prisma.client.count(),
    projects: await prisma.project.count(),
    tasks: await prisma.task.count(),
    activities: await prisma.activityLog.count(),
    notifications: await prisma.notification.count(),
  };

  console.log('Seed completed:', counts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });