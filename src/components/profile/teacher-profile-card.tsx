"use client";

import { useState, useEffect } from "react";
import { Music, User } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { VideoEmbed } from "./video-embed";

interface TeacherProfile {
  id: string;
  name: string;
  bio: string | null;
  videoUrl: string | null;
}

export function TeacherProfileCard() {
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
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-60 mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!teacher) {
    return null;
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-md">
            <Music className="h-6 w-6 text-white" />
          </div>
          <div>
            <CardTitle className="flex items-center gap-2">
              Meet Your Teacher
            </CardTitle>
            <CardDescription className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {teacher.name}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
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
        {teacher.videoUrl && (
          <div className="pt-2">
            <VideoEmbed url={teacher.videoUrl} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
