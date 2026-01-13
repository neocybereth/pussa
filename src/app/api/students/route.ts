import { NextResponse } from "next/server";
import { z } from "zod";
import { supabase } from "@/lib/db";
import { auth } from "@/lib/auth";
import { createAuthUser } from "@/lib/supabase-auth";

const createStudentSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

// GET /api/students - List all students (teacher only)
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: students, error } = await supabase
      .from("users")
      .select("id, name, email, created_at")
      .eq("role", "STUDENT")
      .order("name", { ascending: true });

    if (error) throw error;

    // Get counts for each student
    const studentsWithCounts = await Promise.all(
      (students || []).map(async (student) => {
        const [exercisesResult, classesResult] = await Promise.all([
          supabase
            .from("student_exercises")
            .select("*", { count: "exact", head: true })
            .eq("student_id", student.id),
          supabase
            .from("scheduled_classes")
            .select("*", { count: "exact", head: true })
            .eq("student_id", student.id),
        ]);

        return {
          id: student.id,
          name: student.name,
          email: student.email,
          createdAt: student.created_at,
          _count: {
            assignedExercises: exercisesResult.count || 0,
            scheduledClasses: classesResult.count || 0,
          },
        };
      })
    );

    return NextResponse.json(studentsWithCounts);
  } catch (error) {
    console.error("Error fetching students:", error);
    return NextResponse.json(
      { error: "Failed to fetch students" },
      { status: 500 }
    );
  }
}

// POST /api/students - Create a new student (teacher only)
export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const result = createStudentSchema.safeParse(body);

    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      const firstError = Object.values(errors)[0]?.[0] || "Validation failed";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { name, email, password } = result.data;

    // Create user in Supabase Auth with metadata
    let authUser;
    try {
      authUser = await createAuthUser(email, password, {
        name,
        role: "STUDENT",
      });
    } catch (authError: unknown) {
      const error = authError as { message?: string };
      if (error.message?.includes("already been registered")) {
        return NextResponse.json(
          { error: "A student with this email already exists" },
          { status: 400 }
        );
      }
      throw authError;
    }

    // Fetch the created student data
    const { data: student, error: fetchError } = await supabase
      .from("users")
      .select("id, name, email, created_at")
      .eq("id", authUser.id)
      .single();

    if (fetchError) {
      console.error("Error fetching created student:", fetchError);
      // Return minimal data if fetch fails
      return NextResponse.json(
        {
          id: authUser.id,
          name,
          email,
          createdAt: new Date().toISOString(),
          _count: {
            assignedExercises: 0,
            scheduledClasses: 0,
          },
        },
        { status: 201 }
      );
    }

    return NextResponse.json(
      {
        id: student.id,
        name: student.name,
        email: student.email,
        createdAt: student.created_at,
        _count: {
          assignedExercises: 0,
          scheduledClasses: 0,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating student:", error);
    return NextResponse.json(
      { error: "Failed to create student" },
      { status: 500 }
    );
  }
}
