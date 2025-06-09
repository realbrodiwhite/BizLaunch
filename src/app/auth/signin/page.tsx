
"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Rocket, LogIn } from 'lucide-react';
import { toast } from "@/hooks/use-toast";
import { auth } from '@/lib/firebase'; // Import Firebase auth instance
import { signInWithEmailAndPassword } from 'firebase/auth'; // Import Firebase auth function

const signInFormSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(1, { message: "Password is required." }), // Min 1 for presence
});

type SignInFormValues = z.infer<typeof signInFormSchema>;

export default function SignInPage() {
  const router = useRouter();
  const form = useForm<SignInFormValues>({
    resolver: zodResolver(signInFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(data: SignInFormValues) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
      console.log("Sign In Successful:", userCredential.user);
      toast({
        title: "Sign In Successful!",
        description: "Welcome back! Redirecting to dashboard...",
      });
      // Redirect to dashboard on successful sign-in
      router.push('/dashboard'); 
    } catch (error: any) {
      console.error("Sign In Error:", error);
      let errorMessage = "Invalid email or password. Please try again.";
      // Firebase provides more specific error codes like 'auth/user-not-found', 'auth/wrong-password', 'auth/invalid-credential'
      // You can customize messages based on error.code for better UX
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        errorMessage = "Invalid email or password. Please check your credentials.";
      }
      toast({
        variant: "destructive",
        title: "Sign In Failed",
        description: errorMessage,
      });
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background via-secondary/20 to-background p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <Link href="/" className="inline-block mb-4">
            <Rocket className="w-10 h-10 text-accent mx-auto" />
          </Link>
          <CardTitle className="text-2xl font-bold text-foreground">Sign In to BizLaunch</CardTitle>
          <CardDescription>Enter your credentials to access your dashboard.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="you@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={form.formState.isSubmitting}>
                 {form.formState.isSubmitting ? "Signing In..." : <><LogIn className="mr-2 h-4 w-4" /> Sign In</>}
              </Button>
            </form>
          </Form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link href="/auth/signup" className="font-medium text-accent hover:underline">
              Sign Up
            </Link>
          </p>
           <p className="mt-2 text-center text-xs text-muted-foreground">
            <Link href="/dashboard" className="font-medium text-accent hover:underline">
              (Dev: Go to Dashboard)
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
