import { useState } from "react";
import { ArrowLeft, GraduationCap, Briefcase, Award, Edit3, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const ResumeBuilder = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [gpa, setGpa] = useState("3.7");
  const [major, setMajor] = useState("Computer Science");
  const [minor, setMinor] = useState("");
  const [university, setUniversity] = useState("Howard University");
  const [gradYear, setGradYear] = useState("2027");
  const [experience, setExperience] = useState(
    "Software Engineering Intern - Google (Summer 2026)\nResearch Assistant - CS Department (Spring 2026)"
  );
  const [skills, setSkills] = useState("Python, React, TypeScript, SQL, Figma");

  const campusInvolvement = [
    "Hackathon Participant - Fall 2025",
    "AI Workshop Attendee - Oct 2025",
    "Career Fair Attendee - Sep 2025",
    "CS Society Member",
    "Intramural Volleyball",
  ];

  const handleSave = () => {
    setEditing(false);
    toast({ title: "Resume Saved", description: "Your resume credentials have been updated." });
  };

  return (
    <div className="min-h-screen bg-background pb-10">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="flex items-center justify-between px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-3">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            <h1 className="text-lg font-bold text-foreground">Resume Builder</h1>
          </div>
          <button onClick={() => editing ? handleSave() : setEditing(true)}>
            {editing ? <Save className="w-5 h-5 text-primary" /> : <Edit3 className="w-5 h-5 text-muted-foreground" />}
          </button>
        </div>
      </header>

      <div className="px-5 py-4 space-y-5">
        {/* Education */}
        <div className="p-4 rounded-2xl bg-card border border-border">
          <div className="flex items-center gap-2 mb-3">
            <GraduationCap className="w-5 h-5 text-primary" />
            <h2 className="text-sm font-bold text-foreground">Education</h2>
          </div>
          {editing ? (
            <div className="space-y-3">
              <Input value={university} onChange={(e) => setUniversity(e.target.value)} placeholder="University" className="rounded-xl" />
              <Input value={major} onChange={(e) => setMajor(e.target.value)} placeholder="Major" className="rounded-xl" />
              <Input value={minor} onChange={(e) => setMinor(e.target.value)} placeholder="Minor (optional)" className="rounded-xl" />
              <div className="grid grid-cols-2 gap-3">
                <Input value={gpa} onChange={(e) => setGpa(e.target.value)} placeholder="GPA" className="rounded-xl" />
                <Input value={gradYear} onChange={(e) => setGradYear(e.target.value)} placeholder="Graduation Year" className="rounded-xl" />
              </div>
            </div>
          ) : (
            <div>
              <p className="text-sm font-semibold text-foreground">{university}</p>
              <p className="text-xs text-muted-foreground">{major}{minor ? ` / Minor: ${minor}` : ""}</p>
              <p className="text-xs text-muted-foreground">GPA: {gpa} | Class of {gradYear}</p>
            </div>
          )}
        </div>

        {/* Work Experience */}
        <div className="p-4 rounded-2xl bg-card border border-border">
          <div className="flex items-center gap-2 mb-3">
            <Briefcase className="w-5 h-5 text-primary" />
            <h2 className="text-sm font-bold text-foreground">Work Experience</h2>
          </div>
          {editing ? (
            <Textarea value={experience} onChange={(e) => setExperience(e.target.value)} placeholder="One entry per line..." className="rounded-xl min-h-[100px]" />
          ) : (
            <div className="space-y-1">
              {experience.split("\n").filter(Boolean).map((line, i) => (
                <p key={i} className="text-sm text-foreground">{line}</p>
              ))}
            </div>
          )}
        </div>

        {/* Skills */}
        <div className="p-4 rounded-2xl bg-card border border-border">
          <h2 className="text-sm font-bold text-foreground mb-2">Skills</h2>
          {editing ? (
            <Input value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="Comma-separated skills" className="rounded-xl" />
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {skills.split(",").map((s) => (
                <span key={s.trim()} className="px-3 py-1 rounded-full bg-secondary text-xs font-medium text-secondary-foreground">{s.trim()}</span>
              ))}
            </div>
          )}
        </div>

        {/* Campus Involvement (auto-generated) */}
        <div className="p-4 rounded-2xl bg-card border border-border">
          <div className="flex items-center gap-2 mb-3">
            <Award className="w-5 h-5 text-warning" />
            <h2 className="text-sm font-bold text-foreground">Campus Involvement</h2>
            <span className="text-[10px] text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">Auto-generated</span>
          </div>
          <div className="space-y-1">
            {campusInvolvement.map((item, i) => (
              <p key={i} className="text-sm text-foreground">{item}</p>
            ))}
          </div>
        </div>

        {editing && (
          <Button onClick={handleSave} className="w-full h-12 rounded-xl text-base font-bold">
            Save Changes
          </Button>
        )}
      </div>
    </div>
  );
};

export default ResumeBuilder;
