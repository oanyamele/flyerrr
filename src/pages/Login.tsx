import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useAuth, UserRole } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { User, Building2, ArrowRight, Send } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { authenticateUser, createUser } from "@/data/appDatabase";
import { authFormSchema, type AuthFormValues } from "@/schemas/forms";

const Login = () => {
  const { loginWithUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState<"role" | "form">("role");
  const [role, setRole] = useState<UserRole>("student");
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const form = useForm<AuthFormValues>({
    resolver: zodResolver(authFormSchema(authMode)),
    defaultValues: { name: "", email: "", password: "" },
  });

  const handleSubmit = (values: AuthFormValues) => {
    if (authMode === "signup") {
      const result = createUser({
        email: values.email,
        password: values.password,
        name: values.name,
        role,
      });
      if (!result.ok) {
        toast({ title: "Sign Up failed", description: result.error, variant: "destructive" });
        return;
      }
      loginWithUser(result.user);
      toast({ title: "Account created", description: "Welcome to flyer." });
      navigate("/", { replace: true });
      return;
    }

    const signIn = authenticateUser({ email: values.email, password: values.password, role });
    if (!signIn.ok) {
      toast({ title: "Sign In failed", description: signIn.error, variant: "destructive" });
      return;
    }
    loginWithUser(signIn.user);
    navigate("/", { replace: true });
  };

  const toggleAuthMode = () => {
    setAuthMode((current) => (current === "signin" ? "signup" : "signin"));
    form.reset({ name: "", email: form.getValues("email"), password: "" });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <h1 className="mb-2 flex items-center justify-center gap-2 text-center text-4xl font-medium tracking-tight text-primary">
          <Send className="h-7 w-7 rotate-12" />
          <span>flyer</span>
        </h1>
        <p className="text-sm text-muted-foreground text-center mb-10">Discover campus events. Show up. Get rewarded.</p>

        {step === "role" ? (
          <div className="space-y-4">
            <p className="text-sm font-semibold text-foreground text-center mb-4">How will you use flyer?</p>

            <button
              onClick={() => { setRole("student"); setStep("form"); }}
              className="w-full flex items-center gap-4 p-4 rounded-2xl bg-card border border-border hover:border-primary transition-colors text-left tap-highlight-none"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <User className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-foreground">Student</p>
                <p className="text-xs text-muted-foreground">Discover and attend events on campus</p>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground" />
            </button>

            <button
              onClick={() => { setRole("org_officer"); setStep("form"); }}
              className="w-full flex items-center gap-4 p-4 rounded-2xl bg-card border border-border hover:border-accent transition-colors text-left tap-highlight-none"
            >
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-accent" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-foreground">Organization Officer</p>
                <p className="text-xs text-muted-foreground">Create and manage events for your org</p>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        ) : (
          <Form {...form}>
            <motion.form
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-4"
              noValidate
            >
              <button
                type="button"
                onClick={() => setStep("role")}
                className="text-sm text-muted-foreground hover:text-foreground mb-2"
              >
                &larr; Back
              </button>

              <p className="text-sm font-semibold text-foreground">
                {role === "student"
                  ? authMode === "signin"
                    ? "Student Sign In"
                    : "Student Sign Up"
                  : authMode === "signin"
                  ? "Organization Officer Sign In"
                  : "Organization Officer Sign Up"}
              </p>

              {authMode === "signup" && (
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input {...field} autoComplete="name" aria-label="Full Name" placeholder="Full Name" className="rounded-xl h-12" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        autoComplete="email"
                        aria-label="University Email"
                        placeholder="University Email"
                        className="rounded-xl h-12"
                      />
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
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        autoComplete={authMode === "signin" ? "current-password" : "new-password"}
                        aria-label="Password"
                        placeholder="Password"
                        className="rounded-xl h-12"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full h-12 rounded-xl text-base font-bold">
                {authMode === "signin" ? "Sign In" : "Create Account"}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                {authMode === "signin" ? "Don't have an account?" : "Already have an account?"}{" "}
                <button type="button" onClick={toggleAuthMode} className="text-primary font-semibold">
                  {authMode === "signin" ? "Sign Up" : "Sign In"}
                </button>
              </p>
            </motion.form>
          </Form>
        )}
      </motion.div>
    </div>
  );
};

export default Login;
