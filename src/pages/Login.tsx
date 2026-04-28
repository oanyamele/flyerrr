import { useState } from "react";
import { useAuth, UserRole } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, Building2, ArrowRight, Send } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { authenticateUser, createUser } from "@/data/appDatabase";

const Login = () => {
  const { loginWithUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState<"role" | "form">("role");
  const [role, setRole] = useState<UserRole>("student");
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    if (authMode === "signup") {
      if (!name.trim()) return;
      const result = createUser({ email, password, name, role });
      if (!result.ok) {
        toast({ title: "Sign Up failed", description: result.error, variant: "destructive" });
        return;
      }
      loginWithUser(result.user);
      toast({ title: "Account created", description: "Welcome to flyer." });
      navigate("/", { replace: true });
      return;
    }

    const signIn = authenticateUser({ email, password, role });
    if (!signIn.ok) {
      toast({ title: "Sign In failed", description: signIn.error, variant: "destructive" });
      return;
    }
    loginWithUser(signIn.user);
    navigate("/", { replace: true });
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
          <motion.form
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            onSubmit={handleSubmit}
            className="space-y-4"
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
              <Input
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="rounded-xl h-12"
                required={authMode === "signup"}
              />
            )}
            <Input
              type="email"
              placeholder="University Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-xl h-12"
              required
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-xl h-12"
              required
            />

            <Button type="submit" className="w-full h-12 rounded-xl text-base font-bold">
              {authMode === "signin" ? "Sign In" : "Create Account"}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              {authMode === "signin" ? "Don't have an account?" : "Already have an account?"}{" "}
              <button
                type="button"
                onClick={() => setAuthMode((prev) => (prev === "signin" ? "signup" : "signin"))}
                className="text-primary font-semibold"
              >
                {authMode === "signin" ? "Sign Up" : "Sign In"}
              </button>
            </p>
          </motion.form>
        )}
      </motion.div>
    </div>
  );
};

export default Login;
