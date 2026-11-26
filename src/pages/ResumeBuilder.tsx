import { useState } from "react";
import { ArrowLeft, GraduationCap, Briefcase, Award, Edit3, Save, CalendarCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useAsyncData } from "@/hooks/useAsyncData";
import { fetchAttendanceForUser } from "@/data/repository";
import { buildCampusInvolvement, loadResume, saveResume, type ResumeData } from "@/data/resumeStore";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/states/DataStates";

const Placeholder = ({ children }: { children: string }) => (
  <p className="text-sm text-muted-foreground">{children}</p>
);

const ResumeBuilder = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { auth } = useAuth();
  const userId = auth.userId ?? null;
  const resumeQuery = useAsyncData(() => loadResume(userId), [userId]);
  const involvementQuery = useAsyncData(() => fetchAttendanceForUser(userId), [userId]);
  const [savedResume, setSavedResume] = useState<ResumeData | null>(null);
  const [draft, setDraft] = useState<ResumeData | null>(null);
  const [saving, setSaving] = useState(false);

  const resume = savedResume ?? (resumeQuery.status === "success" ? resumeQuery.data : null);
  const editing = draft !== null;
  const shown = draft ?? resume;
  const update = (field: keyof ResumeData, value: string) =>
    setDraft((current) => (current ? { ...current, [field]: value } : current));

  const handleSave = async () => {
    if (!draft) return;
    setSaving(true);
    try {
      await saveResume(userId, draft);
      setSavedResume(draft);
      setDraft(null);
      toast({ title: "Resume saved", description: "Your changes will still be here next time." });
    } catch (error) {
      toast({
        title: "Couldn't save your resume",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-10">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="flex items-center justify-between px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-3">
          <div className="flex items-center gap-3">
            <button type="button" aria-label="Go back" onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
              <ArrowLeft aria-hidden="true" className="w-5 h-5 text-foreground" />
            </button>
            <h1 className="text-lg font-bold text-foreground">Resume Builder</h1>
          </div>
          <button
            type="button"
            aria-label={editing ? "Save resume" : "Edit resume"}
            disabled={!resume || saving}
            onClick={() => (editing ? void handleSave() : setDraft(resume))}
          >
            {editing ? <Save aria-hidden="true" className="w-5 h-5 text-primary" /> : <Edit3 aria-hidden="true" className="w-5 h-5 text-muted-foreground" />}
          </button>
        </div>
      </header>

      <div className="px-5 py-4 space-y-5">
        {resumeQuery.status === "loading" && <ListSkeleton rows={3} thumb={false} />}
        {resumeQuery.status === "error" && <ErrorState description="We couldn't load your resume." onRetry={resumeQuery.retry} />}

        {shown && (
          <>
            {/* Education */}
            <div className="p-4 rounded-2xl bg-card border border-border">
              <div className="flex items-center gap-2 mb-3">
                <GraduationCap aria-hidden="true" className="w-5 h-5 text-primary" />
                <h2 className="text-sm font-bold text-foreground">Education</h2>
              </div>
              {editing ? (
                <div className="space-y-3">
                  <Input value={shown.university} onChange={(e) => update("university", e.target.value)} aria-label="University" placeholder="University" className="rounded-xl" />
                  <Input value={shown.major} onChange={(e) => update("major", e.target.value)} aria-label="Major" placeholder="Major" className="rounded-xl" />
                  <Input value={shown.minor} onChange={(e) => update("minor", e.target.value)} aria-label="Minor" placeholder="Minor (optional)" className="rounded-xl" />
                  <div className="grid grid-cols-2 gap-3">
                    <Input value={shown.gpa} onChange={(e) => update("gpa", e.target.value)} aria-label="GPA" placeholder="GPA" className="rounded-xl" />
                    <Input value={shown.graduationYear} onChange={(e) => update("graduationYear", e.target.value)} aria-label="Graduation Year" placeholder="Graduation Year" className="rounded-xl" />
                  </div>
                </div>
              ) : shown.university || shown.major || shown.minor || shown.gpa || shown.graduationYear ? (
                <div>
                  {shown.university && <p className="text-sm font-semibold text-foreground">{shown.university}</p>}
                  {(shown.major || shown.minor) && (
                    <p className="text-xs text-muted-foreground">
                      {shown.major}
                      {shown.minor ? ` / Minor: ${shown.minor}` : ""}
                    </p>
                  )}
                  {(shown.gpa || shown.graduationYear) && (
                    <p className="text-xs text-muted-foreground">
                      {[shown.gpa && `GPA: ${shown.gpa}`, shown.graduationYear && `Class of ${shown.graduationYear}`].filter(Boolean).join(" | ")}
                    </p>
                  )}
                </div>
              ) : (
                <Placeholder>Add your school, major and graduation year.</Placeholder>
              )}
            </div>

            {/* Work Experience */}
            <div className="p-4 rounded-2xl bg-card border border-border">
              <div className="flex items-center gap-2 mb-3">
                <Briefcase aria-hidden="true" className="w-5 h-5 text-primary" />
                <h2 className="text-sm font-bold text-foreground">Work Experience</h2>
              </div>
              {editing ? (
                <Textarea value={shown.experience} onChange={(e) => update("experience", e.target.value)} aria-label="Work Experience" placeholder="One entry per line..." className="rounded-xl min-h-[100px]" />
              ) : shown.experience.trim() ? (
                <div className="space-y-1">
                  {shown.experience
                    .split("\n")
                    .filter((line) => line.trim())
                    .map((line, i) => (
                      <p key={i} className="text-sm text-foreground">{line}</p>
                    ))}
                </div>
              ) : (
                <Placeholder>Add jobs, internships or research, one per line.</Placeholder>
              )}
            </div>

            {/* Skills */}
            <div className="p-4 rounded-2xl bg-card border border-border">
              <h2 className="text-sm font-bold text-foreground mb-2">Skills</h2>
              {editing ? (
                <Input value={shown.skills} onChange={(e) => update("skills", e.target.value)} aria-label="Skills" placeholder="Comma-separated skills" className="rounded-xl" />
              ) : shown.skills.trim() ? (
                <div className="flex flex-wrap gap-1.5">
                  {shown.skills
                    .split(",")
                    .map((skill) => skill.trim())
                    .filter(Boolean)
                    .map((skill) => (
                      <span key={skill} className="px-3 py-1 rounded-full bg-secondary text-xs font-medium text-secondary-foreground">{skill}</span>
                    ))}
                </div>
              ) : (
                <Placeholder>Add skills, separated by commas.</Placeholder>
              )}
            </div>
          </>
        )}

        {/* Campus Involvement (built from the user's real check-ins) */}
        <div className="p-4 rounded-2xl bg-card border border-border">
          <div className="flex items-center gap-2 mb-3">
            <Award aria-hidden="true" className="w-5 h-5 text-warning" />
            <h2 className="text-sm font-bold text-foreground">Campus Involvement</h2>
            <span className="text-[10px] text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">From your check-ins</span>
          </div>
          {involvementQuery.status === "loading" && <ListSkeleton rows={2} thumb={false} />}
          {involvementQuery.status === "error" && <ErrorState description="We couldn't load your check-ins." onRetry={involvementQuery.retry} />}
          {involvementQuery.status === "success" &&
            (involvementQuery.data.length === 0 ? (
              <EmptyState icon={CalendarCheck} title="No check-ins yet." description="Events you check in to will be listed here automatically." />
            ) : (
              <div className="space-y-1">
                {buildCampusInvolvement(involvementQuery.data).map((item) => (
                  <p key={item} className="text-sm text-foreground">{item}</p>
                ))}
              </div>
            ))}
        </div>

        {editing && (
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" onClick={() => setDraft(null)} disabled={saving} className="h-12 rounded-xl text-base font-semibold">
              Cancel
            </Button>
            <Button onClick={() => void handleSave()} disabled={saving} className="h-12 rounded-xl text-base font-bold">
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResumeBuilder;
