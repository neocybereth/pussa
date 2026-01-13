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

    // Fetch teacher user record with bio and video_url
    const { data: teacher, error: teacherError } = await supabase
      .from("users")
      .select("id, name, bio, video_url")
      .eq("role", "TEACHER")
      .limit(1)
      .maybeSingle();

    if (teacherError) {
      console.error("Error fetching teacher:", teacherError);
      return NextResponse.json({ error: "Failed to fetch teacher" }, { status: 500 });
    }

    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: teacher.id,
      name: teacher.name,
      bio: teacher.bio || null,
      videoUrl: teacher.video_url || null,
    });
  } catch (error) {
    console.error("Error fetching teacher profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch teacher profile" },
      { status: 500 }
    );
  }
}
