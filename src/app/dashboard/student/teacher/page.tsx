"use client";

import { useState, useEffect } from "react";
import { Music, User, Video } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { VideoEmbed } from "@/components/profile/video-embed";

interface TeacherProfile {
  id: string;
  name: string;
  bio: string | null;
  videoUrl: string | null;
}

export default function MyTeacherPage() {
  const [teacher, setTeacher] = useState<TeacherProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchTeacher() {
      try {
        const response = await fetch("/api/teacher");
        if (response.ok) {
          const data = await response.json();
          setTeacher(data);
        }
      } catch (error) {
        console.error("Error fetching teacher:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchTeacher();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-5 w-64 mt-2" />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Music className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold">Teacher Not Found</h2>
        <p className="text-muted-foreground mt-2">
          Unable to load teacher information.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Teacher</h1>
        <p className="text-muted-foreground">
          Get to know your music instructor
        </p>
      </div>

      {/* Teacher Info Card */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-violet-500/10 via-fuchsia-500/10 to-rose-500/10 border-b">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg">
              <Music className="h-8 w-8 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl">{teacher.name}</CardTitle>
              <CardDescription className="flex items-center gap-1 mt-1">
                <User className="h-4 w-4" />
                Your Music Teacher
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* About Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-violet-500" />
              About
            </CardTitle>
            <CardDescription>Learn more about your instructor</CardDescription>
          </CardHeader>
          <CardContent>
            {teacher.bio ? (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {teacher.bio}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                Your teacher hasn&apos;t added a bio yet.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Video Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5 text-rose-500" />
              Featured Video
            </CardTitle>
            <CardDescription>Watch your teacher in action</CardDescription>
          </CardHeader>
          <CardContent>
            {teacher.videoUrl ? (
              <VideoEmbed url={teacher.videoUrl} />
            ) : (
              <div className="flex flex-col items-center justify-center py-12 rounded-lg bg-muted/50 text-center">
                <Video className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground italic">
                  No video has been added yet.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
