
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const ownerPass = await bcrypt.hash('admin123', 10);
  const adminPass = await bcrypt.hash('admin123', 10);

  // Users
  await prisma.user.upsert({
    where: { email: 'owner@jobline.local' },
    update: {},
    create: {
      email: 'owner@jobline.local',
      name: 'Owner',
      role: 'super_admin',
      passwordHash: ownerPass
    }
  });
  await prisma.user.upsert({
    where: { email: 'admin@jobline.local' },
    update: {},
    create: {
      email: 'admin@jobline.local',
      name: 'Admin',
      role: 'admin',
      passwordHash: adminPass
    }
  });

  // Agents & Brokers
  const agent = await prisma.agent.create({
    data: { name: 'Global Recruiter', contactDetails: 'agent@example.com' }
  });
  const broker = await prisma.broker.create({
    data: { name: 'Beirut Arrival Services', contactDetails: 'broker@example.com' }
  });

  // Candidate
  const candidate = await prisma.candidate.create({
    data: {
      firstName: 'Maria',
      lastName: 'Santos',
      dob: new Date('1995-06-15'),
      nationality: 'Philippines',
      education: 'High School',
      skills: JSON.stringify(['cooking', 'childcare']),
      experienceSummary: '3 years experience',
      status: 'Available_Abroad',
      agentId: agent.id
    }
  });

  // Client
  const client = await prisma.client.create({
    data: {
      name: 'Ahmad Karim',
      phone: '+96170000000',
      address: 'Beirut, Lebanon',
      notes: 'Prefers English',
    }
  });

  // Application
  const app = await prisma.application.create({
    data: {
      type: 'New_Candidate',
      status: 'Pending_MoL',
      clientId: client.id,
      candidateId: candidate.id,
      brokerId: broker.id
    }
  });

  // Checklist items
  await prisma.documentChecklistItem.createMany({
    data: [
      { applicationId: app.id, documentName: 'Passport Copy', status: 'pending' },
      { applicationId: app.id, documentName: 'Client ID Copy', status: 'pending' }
    ]
  });

  // Payment
  await prisma.payment.create({
    data: {
      applicationId: app.id,
      amount: 500,
      currency: 'USD',
      paymentDate: new Date(),
      notes: 'Down payment'
    }
  });

  console.log('Seed complete.');
}

main().then(()=>prisma.$disconnect()).catch(e=>{
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
