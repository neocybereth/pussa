import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ProfileForm } from "@/components/profile/profile-form";
import { ChangePasswordForm } from "@/components/profile/change-password-form";

export default async function ProfilePage() {
  const session = await auth();

  // Redirect students away from profile page
  if (session?.user?.role === "STUDENT") {
    redirect("/dashboard/student");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Profile</h1>
        <p className="text-muted-foreground">
          Manage your personal information and security settings
        </p>
      </div>
      <ProfileForm />
      <ChangePasswordForm />
    </div>
  );
}
