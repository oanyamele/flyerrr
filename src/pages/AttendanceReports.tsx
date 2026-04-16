import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CalendarDays, Database, Download, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { attendanceRecords, buildAttendanceCsv, getAttendanceSummary } from "@/data/attendanceStore";

const AttendanceReports = () => {
  const navigate = useNavigate();
  const summary = useMemo(() => getAttendanceSummary(attendanceRecords), []);
  const totalCheckIns = attendanceRecords.length;
  const totalEvents = summary.length;

  const downloadCsv = () => {
    const csv = buildAttendanceCsv(attendanceRecords);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "attendance-report.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-xl">
        <div className="mx-auto w-full max-w-3xl px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 sm:px-6">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
              <ArrowLeft className="h-5 w-5 text-foreground" />
            </button>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-bold text-foreground sm:text-xl">Attendance Reporting</h1>
              <p className="text-xs text-muted-foreground sm:text-sm">Export records and review engagement trends</p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl space-y-4 px-4 py-4 sm:px-6">
        <section className="grid grid-cols-2 gap-3">
          <article className="rounded-2xl border border-border bg-card p-4">
            <Users className="mb-2 h-4 w-4 text-primary" />
            <p className="text-xl font-bold text-foreground">{totalCheckIns}</p>
            <p className="text-xs text-muted-foreground">Total check-ins</p>
          </article>
          <article className="rounded-2xl border border-border bg-card p-4">
            <CalendarDays className="mb-2 h-4 w-4 text-primary" />
            <p className="text-xl font-bold text-foreground">{totalEvents}</p>
            <p className="text-xs text-muted-foreground">Events reported</p>
          </article>
        </section>

        <section className="rounded-2xl border border-border bg-card p-4">
          <div className="mb-3 flex items-start gap-3">
            <div className="rounded-xl bg-primary/10 p-2">
              <Database className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground sm:text-base">Attendance Data Store</p>
              <p className="text-xs text-muted-foreground sm:text-sm">
                Structured records are available for exports and future analytics integration.
              </p>
            </div>
          </div>
          <Button onClick={downloadCsv} className="w-full sm:w-auto">
            <Download className="mr-2 h-4 w-4" />
            Export Attendance Report (CSV)
          </Button>
        </section>

        <section className="space-y-2">
          {summary.map((event) => (
            <article key={event.eventId} className="rounded-2xl border border-border bg-card p-4">
              <p className="truncate text-sm font-bold text-foreground sm:text-base">{event.eventTitle}</p>
              <p className="text-xs text-muted-foreground">{event.orgName}</p>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl bg-secondary p-2">
                  <p className="text-base font-bold text-foreground">{event.totalAttendees}</p>
                  <p className="text-[10px] text-muted-foreground">Attendees</p>
                </div>
                <div className="rounded-xl bg-secondary p-2">
                  <p className="text-base font-bold text-foreground">{event.avgPointsAwarded}</p>
                  <p className="text-[10px] text-muted-foreground">Avg points</p>
                </div>
                <div className="rounded-xl bg-secondary p-2">
                  <p className="text-[11px] font-semibold text-foreground">
                    {new Date(event.lastCheckInAt).toLocaleDateString()}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Last check-in</p>
                </div>
              </div>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
};

export default AttendanceReports;
