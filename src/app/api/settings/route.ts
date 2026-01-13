import { NextResponse } from "next/server";
import { z } from "zod";
import { supabase } from "@/lib/db";
import { auth } from "@/lib/auth";

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
    let { data: settings, error } = await supabase
      .from("site_settings")
      .select("*")
      .limit(1)
      .single();

    if (error || !settings) {
      // Create default settings
      const { data: newSettings, error: insertError } = await supabase
        .from("site_settings")
        .insert({
          teacher_name: null,
          teacher_bio: null,
          teacher_photo: null,
          pricing: null,
          contact_info: null,
        })
        .select()
        .single();

      if (insertError) throw insertError;
      settings = newSettings;
    }

    // Map to camelCase for frontend compatibility
    return NextResponse.json({
      id: settings.id,
      teacherName: settings.teacher_name,
      teacherBio: settings.teacher_bio,
      teacherPhoto: settings.teacher_photo,
      pricing: settings.pricing,
      contactInfo: settings.contact_info,
    });
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
    let { data: settings } = await supabase
      .from("site_settings")
      .select("id")
      .limit(1)
      .single();

    if (!settings) {
      const { data: newSettings, error: insertError } = await supabase
        .from("site_settings")
        .insert({
          teacher_name: null,
          teacher_bio: null,
          teacher_photo: null,
          pricing: null,
          contact_info: null,
        })
        .select("id")
        .single();

      if (insertError) throw insertError;
      settings = newSettings;
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {};
    
    if (result.data.teacherName !== undefined) {
      updateData.teacher_name = result.data.teacherName;
    }
    if (result.data.teacherBio !== undefined) {
      updateData.teacher_bio = result.data.teacherBio;
    }
    if (result.data.teacherPhoto !== undefined) {
      updateData.teacher_photo = result.data.teacherPhoto === "" ? null : result.data.teacherPhoto;
    }
    if (result.data.pricing !== undefined) {
      updateData.pricing = result.data.pricing;
    }
    if (result.data.contactInfo !== undefined) {
      updateData.contact_info = result.data.contactInfo;
    }

    const { data: updatedSettings, error } = await supabase
      .from("site_settings")
      .update(updateData)
      .eq("id", settings.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      id: updatedSettings.id,
      teacherName: updatedSettings.teacher_name,
      teacherBio: updatedSettings.teacher_bio,
      teacherPhoto: updatedSettings.teacher_photo,
      pricing: updatedSettings.pricing,
      contactInfo: updatedSettings.contact_info,
    });
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
