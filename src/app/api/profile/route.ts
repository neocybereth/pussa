import { NextResponse } from "next/server";
import { z } from "zod";
import { supabase } from "@/lib/db";
import { auth } from "@/lib/auth";

const updateProfileSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long").optional(),
  bio: z.string().max(2000, "Bio is too long").optional().nullable(),
  videoUrl: z.string().url("Invalid URL").max(500, "URL is too long").optional().nullable().or(z.literal("")),
});

// GET /api/profile - Get current user's profile
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Try with all columns first, then fall back if columns don't exist
    let user = null;
    
    // Try full query with all optional columns
    const { data, error } = await supabase
      .from("users")
      .select("id, name, email, bio, video_url, role, created_at")
      .eq("id", session.user.id)
      .single();

    if (error) {
      // If error mentions missing columns, try simpler query
      if (error.message?.includes("bio") || error.message?.includes("video_url")) {
        const { data: basicData, error: basicError } = await supabase
          .from("users")
          .select("id, name, email, role, created_at")
          .eq("id", session.user.id)
          .single();
        
        if (basicError || !basicData) {
          return NextResponse.json({ error: "User not found" }, { status: 404 });
        }
        
        user = { ...basicData, bio: null, video_url: null };
      } else {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
    } else {
      user = data;
    }

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      bio: user.bio ?? null,
      videoUrl: user.video_url ?? null,
      role: user.role,
      createdAt: user.created_at,
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

// PUT /api/profile - Update current user's profile
export async function PUT(request: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const result = updateProfileSchema.safeParse(body);

    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      const firstError = Object.values(errors)[0]?.[0] || "Validation failed";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    // Build update data - only include name by default
    const updateData: Record<string, unknown> = {};

    if (result.data.name !== undefined) {
      updateData.name = result.data.name;
    }

    // Try to update with all fields first
    if (result.data.bio !== undefined) {
      updateData.bio = result.data.bio;
    }
    if (result.data.videoUrl !== undefined) {
      updateData.video_url = result.data.videoUrl || null;
    }

    // Attempt update
    const { data: updatedUser, error } = await supabase
      .from("users")
      .update(updateData)
      .eq("id", session.user.id)
      .select("id, name, email, role, created_at")
      .single();

    if (error) {
      // If error is about missing columns, retry with just name
      if (error.message?.includes("bio") || error.message?.includes("video_url")) {
        const basicUpdate: Record<string, unknown> = {};
        if (result.data.name !== undefined) {
          basicUpdate.name = result.data.name;
        }
        
        if (Object.keys(basicUpdate).length === 0) {
          // Nothing to update that the DB supports
          return NextResponse.json({ 
            error: "Database migration required. Please run: ALTER TABLE users ADD COLUMN bio TEXT; ALTER TABLE users ADD COLUMN video_url TEXT;" 
          }, { status: 500 });
        }

        const { data: basicUser, error: basicError } = await supabase
          .from("users")
          .update(basicUpdate)
          .eq("id", session.user.id)
          .select("id, name, email, role, created_at")
          .single();

        if (basicError) throw basicError;

        return NextResponse.json({
          id: basicUser.id,
          name: basicUser.name,
          email: basicUser.email,
          bio: null,
          videoUrl: null,
          role: basicUser.role,
          createdAt: basicUser.created_at,
          warning: "Bio and video features require database migration",
        });
      }
      throw error;
    }

    return NextResponse.json({
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      bio: result.data.bio ?? null,
      videoUrl: result.data.videoUrl ?? null,
      role: updatedUser.role,
      createdAt: updatedUser.created_at,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
