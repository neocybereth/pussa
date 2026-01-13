"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AudioUploader } from "./audio-uploader";

const exerciseSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be less than 200 characters"),
  description: z
    .string()
    .max(2000, "Description must be less than 2000 characters")
    .optional()
    .or(z.literal("")),
  audioUrl: z.string().url("Audio file is required"),
  audioKey: z.string().min(1, "Audio file is required"),
});

type ExerciseFormValues = z.infer<typeof exerciseSchema>;

interface ExerciseFormProps {
  mode: "create" | "edit";
  exercise?: {
    id: string;
    title: string;
    description: string | null;
    audioUrl: string;
    audioKey: string;
  };
}

export function ExerciseForm({ mode, exercise }: ExerciseFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<ExerciseFormValues>({
    resolver: zodResolver(exerciseSchema),
    defaultValues: {
      title: exercise?.title || "",
      description: exercise?.description || "",
      audioUrl: exercise?.audioUrl || "",
      audioKey: exercise?.audioKey || "",
    },
  });

  const audioUrl = form.watch("audioUrl");
  const audioKey = form.watch("audioKey");

  async function onSubmit(data: ExerciseFormValues) {
    setIsLoading(true);
    setError(null);

    try {
      const url =
        mode === "create" ? "/api/exercises" : `/api/exercises/${exercise?.id}`;
      const method = mode === "create" ? "POST" : "PUT";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: data.title,
          description: data.description || null,
          audioUrl: data.audioUrl,
          audioKey: data.audioKey,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Something went wrong");
      }

      toast.success(
        mode === "create"
          ? "Exercise created successfully"
          : "Exercise updated successfully"
      );
      router.push("/dashboard/teacher/exercises");
      router.refresh();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Something went wrong";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }

  const handleAudioUpload = (data: { url: string; key: string }) => {
    form.setValue("audioUrl", data.url, { shouldValidate: true });
    form.setValue("audioKey", data.key, { shouldValidate: true });
  };

  const handleAudioRemove = () => {
    form.setValue("audioUrl", "", { shouldValidate: true });
    form.setValue("audioKey", "", { shouldValidate: true });
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>
          {mode === "create" ? "Create Exercise" : "Edit Exercise"}
        </CardTitle>
        <CardDescription>
          {mode === "create"
            ? "Add a new exercise with an audio file for your students"
            : "Update the exercise details"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
                {error}
              </div>
            )}

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Scale Practice - C Major"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    Give your exercise a descriptive title
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the exercise, including any instructions or tips for the student..."
                      className="min-h-[120px] resize-y"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    Add instructions or notes about this exercise
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <FormLabel>Audio File</FormLabel>
              <AudioUploader
                onUploadComplete={handleAudioUpload}
                onUploadError={(error) => toast.error(error)}
                existingAudioUrl={audioUrl || undefined}
                existingAudioKey={audioKey || undefined}
                onRemove={handleAudioRemove}
                disabled={isLoading}
              />
              {form.formState.errors.audioUrl && (
                <p className="text-sm font-medium text-destructive">
                  {form.formState.errors.audioUrl.message}
                </p>
              )}
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {mode === "create" ? "Creating..." : "Saving..."}
                  </>
                ) : mode === "create" ? (
                  "Create Exercise"
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
