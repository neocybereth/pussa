"use client";

import type { ComponentType } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  Music,
  Users,
  Calendar,
  Settings,
  Home,
  BookOpen,
  X,
  UserCircle,
  LogOut,
  GraduationCap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface DashboardSidebarProps {
  open?: boolean;
  onClose?: () => void;
}

interface NavItem {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
}

const teacherNavItems: NavItem[] = [
  { href: "/dashboard/teacher", label: "Overview", icon: Home },
  { href: "/dashboard/teacher/students", label: "Students", icon: Users },
  { href: "/dashboard/teacher/exercises", label: "Exercises", icon: BookOpen },
  { href: "/dashboard/teacher/calendar", label: "Calendar", icon: Calendar },
  { href: "/dashboard/profile", label: "My Profile", icon: UserCircle },
  { href: "/dashboard/teacher/settings", label: "Settings", icon: Settings },
];

const studentNavItems: NavItem[] = [
  { href: "/dashboard/student", label: "Overview", icon: Home },
  { href: "/dashboard/student/teacher", label: "My Teacher", icon: GraduationCap },
  { href: "/dashboard/student/exercises", label: "My Exercises", icon: BookOpen },
  { href: "/dashboard/student/calendar", label: "My Calendar", icon: Calendar },
];

export function DashboardSidebar({ open, onClose }: DashboardSidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isTeacher = session?.user?.role === "TEACHER";

  const navItems = isTeacher ? teacherNavItems : studentNavItems;

  const isActive = (href: string) => {
    if (href === "/dashboard/teacher" || href === "/dashboard/student") {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-background border-r transition-transform duration-200 lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Mobile close button */}
        <div className="flex h-16 items-center justify-between border-b px-4 lg:hidden">
          <Link href="/" className="flex items-center gap-2">
            <Music className="h-6 w-6 text-primary" />
            <span className="text-lg font-semibold">Music Teacher</span>
          </Link>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
            <span className="sr-only">Close sidebar</span>
          </Button>
        </div>

        {/* Desktop logo */}
        <div className="hidden h-16 items-center border-b px-6 lg:flex">
          <Link href="/" className="flex items-center gap-2">
            <Music className="h-6 w-6 text-primary" />
            <span className="text-lg font-semibold">Music Teacher</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Role indicator and logout */}
        <div className="border-t p-4 space-y-3">
          <div className="rounded-md bg-muted px-3 py-2">
            <p className="text-xs font-medium text-muted-foreground">
              Logged in as
            </p>
            <p className="text-sm font-semibold">
              {isTeacher ? "Teacher" : "Student"}
            </p>
          </div>
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            <LogOut className="h-4 w-4" />
            Log out
          </Button>
        </div>
      </aside>
    </>
  );
}
