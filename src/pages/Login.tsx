import { useState } from "react";
import { useAuth, UserRole } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, Building2, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const Login = () => {
  const { login } = useAuth();
  const [step, setStep] = useState<"role" | "form">("role");
  const [role, setRole] = useState<UserRole>("student");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && email.trim()) {
      login(role, name.trim());
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <h1 className="text-4xl font-extrabold text-primary text-center mb-2 tracking-tight">flyerrr</h1>
        <p className="text-sm text-muted-foreground text-center mb-10">Discover campus events. Show up. Get rewarded.</p>

        {step === "role" ? (
          <div className="space-y-4">
            <p className="text-sm font-semibold text-foreground text-center mb-4">How will you use flyerrr?</p>

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
              {role === "student" ? "Student Sign In" : "Organization Officer Sign In"}
            </p>

            <Input
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-xl h-12"
              required
            />
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
              Sign In
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Don't have an account? <span className="text-primary font-semibold cursor-pointer">Sign Up</span>
            </p>
          </motion.form>
        )}
      </motion.div>
    </div>
  );
};

export default Login;
