
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

// Form schema validation
const formSchema = z.object({
  name: z.string().nullable().optional(),
  year: z.string().nullable().optional(),
  department: z.string().nullable().optional(),
  program: z.string().nullable().optional(),
  student_number: z.string().nullable().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function ProfileForm() {
  const { profile, refreshProfile } = useAuth();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: profile?.name || "",
      year: profile?.year || "",
      department: profile?.department || "",
      program: profile?.program || "",
      student_number: profile?.student_number || "",
    },
  });

  // Update form values when profile data changes
  useEffect(() => {
    if (profile) {
      form.reset({
        name: profile.name || "",
        year: profile.year || "",
        department: profile.department || "",
        program: profile.program || "",
        student_number: profile.student_number || "",
      });
    }
  }, [profile, form]);

  // Handle form submission
  async function onSubmit(values: FormValues) {
    if (!profile?.id) {
      toast.error("You must be logged in to update your profile");
      return;
    }
    
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          name: values.name,
          year: values.year,
          department: values.department,
          program: values.program,
          student_number: values.student_number,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile.id);

      if (error) throw error;
      
      await refreshProfile();
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="Your name" {...field} value={field.value || ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="year"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Year</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Freshman, Sophomore..." {...field} value={field.value || ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="department"
          render={({ field }) => (
            <FormItem>
              <FormLabel>College Department</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Computer Science" {...field} value={field.value || ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="program"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Program</FormLabel>
              <FormControl>
                <Input placeholder="e.g. BS Computer Science" {...field} value={field.value || ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="student_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Student Number</FormLabel>
              <FormControl>
                <Input placeholder="e.g. 2022-12345" {...field} value={field.value || ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit" className="w-full bg-campus-accent hover:bg-campus-accent/90">
          Save Changes
        </Button>
      </form>
    </Form>
  );
}
