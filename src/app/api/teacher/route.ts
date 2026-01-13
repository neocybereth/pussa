import { NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { auth } from "@/lib/auth";

// GET /api/teacher - Get teacher's public profile (for students)
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Try to fetch with video_url first, fall back to without it if column doesn't exist
    let teacher = null;
    
    const { data, error } = await supabase
      .from("users")
      .select("id, name, bio, video_url")
      .eq("role", "TEACHER")
      .limit(1)
      .maybeSingle();

    if (error && error.message?.includes("video_url")) {
      // video_url column doesn't exist, fetch without it
      const { data: fallbackData } = await supabase
        .from("users")
        .select("id, name, bio")
        .eq("role", "TEACHER")
        .limit(1)
        .maybeSingle();
      
      teacher = fallbackData ? { ...fallbackData, video_url: null } : null;
    } else {
      teacher = data;
    }

    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: teacher.id,
      name: teacher.name,
      bio: teacher.bio,
      videoUrl: teacher.video_url,
    });
  } catch (error) {
    console.error("Error fetching teacher profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch teacher profile" },
      { status: 500 }
    );
  }
}
