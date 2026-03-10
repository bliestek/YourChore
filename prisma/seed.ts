import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const prisma = new PrismaClient();

function generateInviteCode(): string {
  return crypto.randomBytes(4).toString("hex").toUpperCase();
}

async function main() {
  console.log("Seeding database...");

  // Create demo family
  const family = await prisma.family.upsert({
    where: { id: "demo-family" },
    update: {},
    create: {
      id: "demo-family",
      name: "Demo Family",
      inviteCode: generateInviteCode(),
    },
  });

  console.log(`Created family: ${family.name} (invite: ${family.inviteCode})`);

  // Create demo parent
  const passwordHash = await bcrypt.hash("demo1234", 12);
  const parent = await prisma.user.upsert({
    where: { email: "parent@demo.com" },
    update: {},
    create: {
      email: "parent@demo.com",
      name: "Demo Parent",
      passwordHash,
    },
  });

  // Create family membership
  await prisma.familyMember.upsert({
    where: {
      userId_familyId: {
        userId: parent.id,
        familyId: family.id,
      },
    },
    update: {},
    create: {
      userId: parent.id,
      familyId: family.id,
      role: "admin",
    },
  });

  console.log(`Created parent: ${parent.email}`);

  // Create demo children
  const emma = await prisma.child.upsert({
    where: { id: "demo-child-emma" },
    update: {},
    create: {
      id: "demo-child-emma",
      name: "Emma",
      avatar: "unicorn",
      pin: "1234",
      starBalance: 12,
      parentId: parent.id,
      familyId: family.id,
    },
  });

  const jack = await prisma.child.upsert({
    where: { id: "demo-child-jack" },
    update: {},
    create: {
      id: "demo-child-jack",
      name: "Jack",
      avatar: "dragon",
      pin: null,
      starBalance: 7,
      parentId: parent.id,
      familyId: family.id,
    },
  });

  console.log(`Created children: ${emma.name}, ${jack.name}`);

  // Create demo chores
  const chores = await Promise.all([
    prisma.chore.upsert({
      where: { id: "demo-chore-bed" },
      update: {},
      create: {
        id: "demo-chore-bed",
        title: "Make Your Bed",
        description: "Straighten sheets and pillows",
        icon: "bed",
        starValue: 1,
        recurringType: "daily",
        parentId: parent.id,
        familyId: family.id,
      },
    }),
    prisma.chore.upsert({
      where: { id: "demo-chore-teeth" },
      update: {},
      create: {
        id: "demo-chore-teeth",
        title: "Brush Teeth",
        description: "Morning and night!",
        icon: "tooth",
        starValue: 1,
        recurringType: "daily",
        parentId: parent.id,
        familyId: family.id,
      },
    }),
    prisma.chore.upsert({
      where: { id: "demo-chore-tidy" },
      update: {},
      create: {
        id: "demo-chore-tidy",
        title: "Tidy Your Room",
        description: "Put toys and clothes away",
        icon: "tidy",
        starValue: 2,
        recurringType: "daily",
        parentId: parent.id,
        familyId: family.id,
      },
    }),
    prisma.chore.upsert({
      where: { id: "demo-chore-dishes" },
      update: {},
      create: {
        id: "demo-chore-dishes",
        title: "Help With Dishes",
        description: "Clear the table after dinner",
        icon: "dishes",
        starValue: 2,
        recurringType: "weekly",
        recurringDays: "mon,wed,fri",
        parentId: parent.id,
        familyId: family.id,
      },
    }),
    prisma.chore.upsert({
      where: { id: "demo-chore-homework" },
      update: {},
      create: {
        id: "demo-chore-homework",
        title: "Do Homework",
        description: "Finish all homework before play",
        icon: "homework",
        starValue: 3,
        recurringType: "weekly",
        recurringDays: "mon,tue,wed,thu",
        parentId: parent.id,
        familyId: family.id,
      },
    }),
  ]);

  console.log(`Created ${chores.length} chores`);

  // Create demo rewards
  const rewards = await Promise.all([
    prisma.reward.upsert({
      where: { id: "demo-reward-icecream" },
      update: {},
      create: {
        id: "demo-reward-icecream",
        title: "Ice Cream",
        description: "Pick any flavour!",
        icon: "icecream",
        starCost: 10,
        parentId: parent.id,
        familyId: family.id,
      },
    }),
    prisma.reward.upsert({
      where: { id: "demo-reward-movie" },
      update: {},
      create: {
        id: "demo-reward-movie",
        title: "Movie Night",
        description: "Choose a movie for family night",
        icon: "movie",
        starCost: 15,
        parentId: parent.id,
        familyId: family.id,
      },
    }),
    prisma.reward.upsert({
      where: { id: "demo-reward-game" },
      update: {},
      create: {
        id: "demo-reward-game",
        title: "30min Extra Game Time",
        description: "Extra time on your favourite game",
        icon: "game",
        starCost: 20,
        parentId: parent.id,
        familyId: family.id,
      },
    }),
    prisma.reward.upsert({
      where: { id: "demo-reward-park" },
      update: {},
      create: {
        id: "demo-reward-park",
        title: "Trip to the Park",
        description: "Go to the park with a friend",
        icon: "park",
        starCost: 25,
        parentId: parent.id,
        familyId: family.id,
      },
    }),
  ]);

  console.log(`Created ${rewards.length} rewards`);

  // Create today's assignments
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const child of [emma, jack]) {
    for (const chore of chores.slice(0, 3)) {
      await prisma.choreAssignment.upsert({
        where: {
          id: `demo-assign-${child.id}-${chore.id}`,
        },
        update: {},
        create: {
          id: `demo-assign-${child.id}-${chore.id}`,
          choreId: chore.id,
          childId: child.id,
          dueDate: today,
          status: "pending",
        },
      });
    }
  }

  console.log("Created today's assignments");
  console.log("\n--- Demo Credentials ---");
  console.log("Parent: parent@demo.com / demo1234");
  console.log(`Family invite code: ${family.inviteCode}`);
  console.log("Child Emma: PIN 1234");
  console.log("Child Jack: No PIN");
  console.log("------------------------\n");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
