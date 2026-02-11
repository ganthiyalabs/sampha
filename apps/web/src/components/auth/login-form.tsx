import { GalleryVerticalEnd, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";

export function LoginForm({ className, ...props }: React.ComponentProps<"div">) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await authClient.signIn.email({
        email,
        password,
        callbackURL: window.location.origin + "/",
      });

      if (error) throw error;

      toast.success("Signed in successfully!");
      router.navigate({ to: "/" });
    } catch (error: any) {
      toast.error(error.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: "github" | "google") => {
    setIsLoading(true);
    try {
      const { error } = await authClient.signIn.social({
        provider,
        callbackURL: window.location.origin + "/",
      });
      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message || "Failed to sign in");
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6 w-full max-w-sm", className)} {...props}>
      <form onSubmit={handleSubmit}>
        <FieldGroup>
          <div className="flex flex-col items-center gap-2 text-center">
            <a href="#" className="flex flex-col items-center gap-2 font-medium">
              <div className="flex size-8 items-center justify-center rounded-md">
                <GalleryVerticalEnd className="size-6" />
              </div>
              <span className="sr-only">Sampha</span>
            </a>
            <h1 className="text-xl font-bold">Welcome to Sampha</h1>
            <FieldDescription>
              Don&apos;t have an account?{" "}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  toast.info("Sign up not implemented in this view yet");
                }}
              >
                Sign up
              </a>
            </FieldDescription>
          </div>
          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </Field>
          <Field>
            <div className="flex items-center">
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <a
                href="#"
                className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
              >
                Forgot your password?
              </a>
            </div>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
          </Field>
          <Field>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Login
            </Button>
          </Field>
          <FieldSeparator>Or</FieldSeparator>
          <Field className="">
            <Button
              variant="outline"
              type="button"
              className="text-sm"
              onClick={() => handleSocialLogin("github")}
              disabled={isLoading}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="currentColor"
                viewBox="0 0 16 16"
              >
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
              </svg>
              Continue with GitHub
            </Button>
            <Button
              variant="outline"
              type="button"
              className="text-sm"
              onClick={() => handleSocialLogin("google")}
              disabled={isLoading}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-4 h-4"
              >
                <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
              </svg>
              Continue with Google
            </Button>
          </Field>
        </FieldGroup>
      </form>
      <FieldDescription className="px-6 text-center">
        By clicking continue, you agree to our <a href="#">Terms of Service</a> and{" "}
        <a href="#">Privacy Policy</a>.
      </FieldDescription>
    </div>
  );
}
