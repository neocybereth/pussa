import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Admin client for server-side auth operations (uses service role key)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Helper to create a user with Supabase Auth
export async function createAuthUser(
  email: string,
  password: string,
  metadata?: { name?: string; role?: string }
) {
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // Auto-confirm email (set to false if you want email verification)
    user_metadata: metadata,
  });

  if (error) {
    throw error;
  }

  return data.user;
}

// Helper to get user by ID from Supabase Auth
export async function getAuthUser(userId: string) {
  const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId);

  if (error) {
    return null;
  }

  return data.user;
}

// Helper to verify a user's password with Supabase Auth
export async function verifyUserPassword(email: string, password: string) {
  // Use signInWithPassword to verify credentials
  // This doesn't actually create a session since we're using the admin client
  const { data, error } = await supabaseAdmin.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return null;
  }

  return data.user;
}

// Helper to delete an auth user (useful for cleanup if profile creation fails)
export async function deleteAuthUser(userId: string) {
  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
  if (error) {
    console.error("Failed to delete auth user:", error);
  }
}

// Helper to update user password
export async function updateUserPassword(userId: string, newPassword: string) {
  const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    password: newPassword,
  });

  if (error) {
    throw error;
  }
}

// Helper to send password reset email
export async function sendPasswordResetEmail(email: string) {
  const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
  });

  if (error) {
    throw error;
  }
}
