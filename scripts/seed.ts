import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in your .env file."
  );
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function main() {
  console.log("Seeding database...");

  // Create teacher account
  const teacherEmail = "teacher@example.com";
  const teacherPassword = "password123"; // Change this in production!

  // Check if teacher already exists in users table
  const { data: existingTeacher } = await supabase
    .from("users")
    .select("id")
    .eq("email", teacherEmail)
    .single();

  if (!existingTeacher) {
    // Create user in Supabase Auth first
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: teacherEmail,
      password: teacherPassword,
      email_confirm: true,
    });

    if (authError) {
      // If user already exists in auth but not in users table, try to get their ID
      if (authError.message?.includes("already been registered")) {
        console.log("Auth user exists, checking for profile...");
        const { data: { users } } = await supabase.auth.admin.listUsers();
        const existingAuthUser = users.find(u => u.email === teacherEmail);
        
        if (existingAuthUser) {
          // Create profile for existing auth user
          const { error: profileError } = await supabase
            .from("users")
            .insert({
              id: existingAuthUser.id,
              email: teacherEmail,
              password: "",
              name: "Music Teacher",
              role: "TEACHER",
            });

          if (profileError) {
            console.error("Error creating teacher profile:", profileError);
          } else {
            console.log(`Created teacher profile for existing auth user: ${teacherEmail}`);
          }
        }
      } else {
        console.error("Error creating auth user:", authError);
      }
    } else if (authData.user) {
      // Create teacher profile in users table
      const { error: profileError } = await supabase
        .from("users")
        .insert({
          id: authData.user.id,
          email: teacherEmail,
          password: "",
          name: "Music Teacher",
          role: "TEACHER",
        });

      if (profileError) {
        console.error("Error creating teacher profile:", profileError);
        // Clean up auth user if profile creation fails
        await supabase.auth.admin.deleteUser(authData.user.id);
      } else {
        console.log(`Created teacher account: ${teacherEmail}`);
      }
    }
  } else {
    console.log(`Teacher account already exists: ${teacherEmail}`);
  }

  // Create default site settings
  const { data: existingSettings } = await supabase
    .from("site_settings")
    .select("id")
    .limit(1)
    .single();

  if (!existingSettings) {
    const { error } = await supabase
      .from("site_settings")
      .insert({
        teacher_name: "Music Teacher",
        teacher_bio:
          "Welcome to my music studio! I am a passionate music teacher with years of experience helping students of all ages discover the joy of music.",
        pricing: [
          { name: "30 minutes", price: "$40" },
          { name: "45 minutes", price: "$55" },
          { name: "60 minutes", price: "$70" },
        ],
        contact_info: {
          email: "teacher@example.com",
          phone: "(555) 123-4567",
        },
      });

    if (error) {
      console.error("Error creating site settings:", error);
    } else {
      console.log("Created default site settings");
    }
  } else {
    console.log("Site settings already exist");
  }

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
