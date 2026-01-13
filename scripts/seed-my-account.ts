import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

// Load from .env.local
config({ path: ".env.local" });

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

// Your account details from Supabase Auth
const TEACHER_ID = "c818b6ff-20a4-4dcf-9771-76557d83fcd4";
const TEACHER_EMAIL = "seanm077@gmail.com";
const TEACHER_NAME = "Sean M";

async function main() {
  console.log("🎵 Seeding data for your account...\n");

  // 1. Ensure your user profile exists and is linked to your auth ID
  const { data: existingUserById } = await supabase
    .from("users")
    .select("id, role")
    .eq("id", TEACHER_ID)
    .single();

  const { data: existingUserByEmail } = await supabase
    .from("users")
    .select("id, role")
    .eq("email", TEACHER_EMAIL)
    .single();

  if (existingUserById) {
    // Profile exists with correct ID - just ensure role is TEACHER
    if (existingUserById.role !== "TEACHER") {
      await supabase
        .from("users")
        .update({ role: "TEACHER" })
        .eq("id", TEACHER_ID);
      console.log("✅ Updated your role to TEACHER");
    } else {
      console.log("✅ Teacher profile already exists with correct ID");
    }
  } else if (existingUserByEmail) {
    // Profile exists with different ID - update to match auth ID
    console.log("⚠️  Found user profile with different ID, updating...");
    await supabase.from("users").delete().eq("email", TEACHER_EMAIL);
    const { error: userError } = await supabase.from("users").insert({
      id: TEACHER_ID,
      email: TEACHER_EMAIL,
      password: "",
      name: TEACHER_NAME,
      role: "TEACHER",
    });
    if (userError) {
      console.error("Error recreating user profile:", userError);
      return;
    }
    console.log("✅ Recreated teacher profile with correct auth ID");
  } else {
    // No profile exists - create it
    const { error: userError } = await supabase.from("users").insert({
      id: TEACHER_ID,
      email: TEACHER_EMAIL,
      password: "",
      name: TEACHER_NAME,
      role: "TEACHER",
    });

    if (userError) {
      console.error("Error creating user profile:", userError);
      return;
    }
    console.log("✅ Created your teacher profile");
  }

  // 2. Create sample exercises (without actual audio files - you can add those later)
  const sampleExercises = [
    {
      title: "Major Scale Fundamentals",
      description:
        "Practice the C Major scale ascending and descending. Focus on even tempo and clean note transitions.",
      audio_url: "https://example.com/placeholder-audio.mp3",
      audio_key: "placeholder-major-scale",
    },
    {
      title: "Finger Independence Drill",
      description:
        "Exercise to develop independent finger control. Start slowly at 60 BPM and gradually increase speed.",
      audio_url: "https://example.com/placeholder-audio.mp3",
      audio_key: "placeholder-finger-drill",
    },
    {
      title: "Chord Progression Practice",
      description:
        "Practice transitioning between I-IV-V-I chord progressions in the key of G. Focus on smooth transitions.",
      audio_url: "https://example.com/placeholder-audio.mp3",
      audio_key: "placeholder-chord-prog",
    },
    {
      title: "Rhythmic Sight Reading",
      description:
        "Clap or tap along with the rhythm patterns. This builds internal timing and sight-reading skills.",
      audio_url: "https://example.com/placeholder-audio.mp3",
      audio_key: "placeholder-rhythm",
    },
    {
      title: "Ear Training - Intervals",
      description:
        "Listen and identify the intervals played. Start with perfect 5ths and octaves, then add more intervals.",
      audio_url: "https://example.com/placeholder-audio.mp3",
      audio_key: "placeholder-ear-training",
    },
  ];

  const { data: exercises, error: exerciseError } = await supabase
    .from("exercises")
    .insert(sampleExercises)
    .select();

  if (exerciseError) {
    if (exerciseError.code === "23505") {
      console.log("⚠️  Some exercises may already exist, skipping...");
    } else {
      console.error("Error creating exercises:", exerciseError);
    }
  } else {
    console.log(`✅ Created ${exercises?.length || 0} sample exercises`);
  }

  // 3. Create sample students in Supabase Auth and users table
  const sampleStudents = [
    { name: "Emma Johnson", email: "emma.student@example.com" },
    { name: "Liam Williams", email: "liam.student@example.com" },
    { name: "Olivia Brown", email: "olivia.student@example.com" },
  ];

  const createdStudentIds: string[] = [];

  for (const student of sampleStudents) {
    // Check if student already exists
    const { data: existingStudent } = await supabase
      .from("users")
      .select("id")
      .eq("email", student.email)
      .single();

    if (existingStudent) {
      console.log(`⚠️  Student ${student.name} already exists`);
      createdStudentIds.push(existingStudent.id);
      continue;
    }

    // Create auth user
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email: student.email,
        password: "student123", // Demo password
        email_confirm: true,
      });

    if (authError) {
      console.error(`Error creating auth for ${student.name}:`, authError);
      continue;
    }

    // Create user profile
    const { error: profileError } = await supabase.from("users").insert({
      id: authData.user.id,
      email: student.email,
      password: "",
      name: student.name,
      role: "STUDENT",
    });

    if (profileError) {
      console.error(`Error creating profile for ${student.name}:`, profileError);
      await supabase.auth.admin.deleteUser(authData.user.id);
      continue;
    }

    createdStudentIds.push(authData.user.id);
    console.log(`✅ Created student: ${student.name}`);
  }

  // 4. Assign exercises to students
  if (createdStudentIds.length > 0) {
    const { data: allExercises } = await supabase
      .from("exercises")
      .select("id")
      .limit(5);

    if (allExercises && allExercises.length > 0) {
      const assignments = [];

      for (const studentId of createdStudentIds) {
        // Assign 2-3 random exercises to each student
        const exercisesToAssign = allExercises.slice(
          0,
          Math.floor(Math.random() * 2) + 2
        );
        for (const exercise of exercisesToAssign) {
          assignments.push({
            student_id: studentId,
            exercise_id: exercise.id,
            notes: "Practice this exercise daily for best results!",
          });
        }
      }

      const { error: assignError } = await supabase
        .from("student_exercises")
        .upsert(assignments, { onConflict: "student_id,exercise_id" });

      if (assignError) {
        console.error("Error assigning exercises:", assignError);
      } else {
        console.log(`✅ Assigned exercises to students`);
      }
    }
  }

  // 5. Create scheduled classes for the next 2 weeks
  if (createdStudentIds.length > 0) {
    const scheduledClasses = [];
    const now = new Date();

    for (let i = 0; i < createdStudentIds.length; i++) {
      const studentId = createdStudentIds[i];

      // Schedule 2-3 classes per student over the next 2 weeks
      for (let j = 0; j < 3; j++) {
        const daysAhead = Math.floor(Math.random() * 14) + 1;
        const hour = 9 + Math.floor(Math.random() * 8); // Between 9 AM and 5 PM

        const startTime = new Date(now);
        startTime.setDate(startTime.getDate() + daysAhead);
        startTime.setHours(hour, 0, 0, 0);

        const endTime = new Date(startTime);
        endTime.setMinutes(endTime.getMinutes() + 45); // 45-minute lessons

        scheduledClasses.push({
          student_id: studentId,
          title: "Music Lesson",
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          payment_status: Math.random() > 0.5 ? "PAID" : "UNPAID",
          notes: j === 0 ? "Focus on technique this session" : null,
        });
      }
    }

    const { error: classError } = await supabase
      .from("scheduled_classes")
      .insert(scheduledClasses);

    if (classError) {
      console.error("Error creating scheduled classes:", classError);
    } else {
      console.log(`✅ Created ${scheduledClasses.length} scheduled classes`);
    }
  }

  // 6. Create/update site settings
  const { data: existingSettings } = await supabase
    .from("site_settings")
    .select("id")
    .limit(1)
    .single();

  const siteSettings = {
    teacher_name: TEACHER_NAME,
    teacher_bio:
      "Welcome to my music studio! I'm a passionate music teacher dedicated to helping students of all ages and skill levels discover the joy of music. With personalized lessons and a supportive learning environment, I'll help you achieve your musical goals.",
    pricing: [
      { name: "30 minutes", price: "$40" },
      { name: "45 minutes", price: "$55" },
      { name: "60 minutes", price: "$70" },
    ],
    contact_info: {
      email: TEACHER_EMAIL,
      phone: "(555) 123-4567",
    },
  };

  if (!existingSettings) {
    const { error } = await supabase.from("site_settings").insert(siteSettings);

    if (error) {
      console.error("Error creating site settings:", error);
    } else {
      console.log("✅ Created site settings");
    }
  } else {
    const { error } = await supabase
      .from("site_settings")
      .update(siteSettings)
      .eq("id", existingSettings.id);

    if (error) {
      console.error("Error updating site settings:", error);
    } else {
      console.log("✅ Updated site settings");
    }
  }

  console.log("\n🎉 Seeding complete!");
  console.log("\n📋 Sample student accounts created:");
  console.log("   Email: emma.student@example.com | Password: student123");
  console.log("   Email: liam.student@example.com | Password: student123");
  console.log("   Email: olivia.student@example.com | Password: student123");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
