import { NextResponse } from "next/server";
import { z } from "zod";
import { createAuthUser } from "@/lib/supabase-auth";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = registerSchema.safeParse(body);

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
          { error: "An account with this email already exists" },
          { status: 400 }
        );
      }
      throw authError;
    }

    return NextResponse.json(
      { message: "Account created successfully", userId: authUser.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
