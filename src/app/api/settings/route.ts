import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { Prisma } from "@/generated/prisma/client";

const pricingItemSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  price: z.string().min(1, "Price is required").max(50, "Price is too long"),
  description: z.string().max(500, "Description is too long").optional(),
});

const contactInfoSchema = z.object({
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().max(50, "Phone is too long").optional(),
  location: z.string().max(200, "Location is too long").optional(),
});

const updateSettingsSchema = z.object({
  teacherName: z
    .string()
    .max(100, "Name is too long")
    .optional()
    .nullable(),
  teacherBio: z
    .string()
    .max(5000, "Bio is too long")
    .optional()
    .nullable(),
  teacherPhoto: z
    .string()
    .url("Invalid photo URL")
    .optional()
    .nullable()
    .or(z.literal("")),
  pricing: z.array(pricingItemSchema).optional().nullable(),
  contactInfo: contactInfoSchema.optional().nullable(),
});

// GET /api/settings - Get site settings (public)
export async function GET() {
  try {
    // Get the first (and only) settings record, or create one if it doesn't exist
    let settings = await prisma.siteSettings.findFirst();

    if (!settings) {
      settings = await prisma.siteSettings.create({
        data: {
          teacherName: null,
          teacherBio: null,
          teacherPhoto: null,
          pricing: Prisma.NullableJsonNullValueInput.DbNull,
          contactInfo: Prisma.NullableJsonNullValueInput.DbNull,
        },
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

// PUT /api/settings - Update site settings (teacher only)
export async function PUT(request: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const result = updateSettingsSchema.safeParse(body);

    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      const firstError = Object.values(errors)[0]?.[0] || "Validation failed";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    // Get existing settings or create new
    let settings = await prisma.siteSettings.findFirst();

    if (!settings) {
      settings = await prisma.siteSettings.create({
        data: {
          teacherName: null,
          teacherBio: null,
          teacherPhoto: null,
          pricing: Prisma.NullableJsonNullValueInput.DbNull,
          contactInfo: Prisma.NullableJsonNullValueInput.DbNull,
        },
      });
    }

    // Prepare update data
    const { teacherPhoto, ...restData } = result.data;
    const updateData: Record<string, unknown> = { ...restData };

    // Handle empty string for teacherPhoto (should be null)
    if (teacherPhoto !== undefined) {
      updateData.teacherPhoto = teacherPhoto === "" ? null : teacherPhoto;
    }

    const updatedSettings = await prisma.siteSettings.update({
      where: { id: settings.id },
      data: updateData,
    });

    return NextResponse.json(updatedSettings);
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
