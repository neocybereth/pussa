import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import * as bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // Create teacher account
  const teacherEmail = "teacher@example.com";
  const teacherPassword = "password123"; // Change this in production!

  const existingTeacher = await prisma.user.findUnique({
    where: { email: teacherEmail },
  });

  if (!existingTeacher) {
    const hashedPassword = await bcrypt.hash(teacherPassword, 12);

    const teacher = await prisma.user.create({
      data: {
        email: teacherEmail,
        password: hashedPassword,
        name: "Music Teacher",
        role: "TEACHER",
      },
    });

    console.log(`Created teacher account: ${teacher.email}`);
  } else {
    console.log(`Teacher account already exists: ${teacherEmail}`);
  }

  // Create default site settings
  const existingSettings = await prisma.siteSettings.findFirst();

  if (!existingSettings) {
    await prisma.siteSettings.create({
      data: {
        teacherName: "Music Teacher",
        teacherBio:
          "Welcome to my music studio! I am a passionate music teacher with years of experience helping students of all ages discover the joy of music.",
        pricing: {
          lessons: [
            { duration: "30 minutes", price: "$40" },
            { duration: "45 minutes", price: "$55" },
            { duration: "60 minutes", price: "$70" },
          ],
        },
        contactInfo: {
          email: "teacher@example.com",
          phone: "(555) 123-4567",
        },
      },
    });

    console.log("Created default site settings");
  } else {
    console.log("Site settings already exist");
  }

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
