import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@nomoo.ai" },
    update: {},
    create: { name: "Nomoo Admin", email: "admin@nomoo.ai", passwordHash, role: "ADMIN" },
  });

  const member = await prisma.user.upsert({
    where: { email: "member@nomoo.ai" },
    update: {},
    create: { name: "Test Member", email: "member@nomoo.ai", passwordHash, role: "MEMBER" },
  });

  await prisma.communityPost.create({
    data: {
      authorId: admin.id,
      body: "Welcome to the NOMOO community! Introduce yourself 👋",
    },
  });

  const course = await prisma.course.create({
    data: {
      title: "AI Foundations for Professionals",
      description: "A practical introduction to using AI tools at work.",
      lessons: {
        create: [
          {
            title: "Why AI, Why Now",
            order: 0,
            script:
              "Welcome to NOMOO! In this lesson we'll cover why AI matters for your career today, " +
              "and how you can start using it practically, right away.",
          },
        ],
      },
    },
  });

  console.log({ admin: admin.email, member: member.email, course: course.title });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
