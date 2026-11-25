import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, QrCode, ScanLine, Smartphone, Wifi } from "lucide-react";
import { motion } from "framer-motion";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/contexts/AuthContext";
import { listEventRecords, recordCheckIn, type EventRecord } from "@/data/appDatabase";
import { fetchEvents } from "@/data/repository";
import { issueDynamicCheckInToken, secondsRemaining, validateCheckInToken } from "@/data/checkInStore";
import { fetchEventAttendance, redeemCheckInCode, requestCheckInCode, type ServerAttendanceRecord } from "@/services/checkInApi";
import { ApiError, useHttpBackend } from "@/services/httpApi";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import CheckInQr from "@/components/CheckInQr";

// How often the student's code is replaced. The server only honours the newest code, so an old screenshot stops working.
const QR_REFRESH_MS = 20_000;

const TapIn = () => {
  const { auth } = useAuth();
  const { toast } = useToast();
  // Offline mode reads the browser's own data. Server mode reads the shared events from the API.
  const [serverEvents, setServerEvents] = useState<EventRecord[]>([]);
  const [eventsError, setEventsError] = useState(false);
  const events = useHttpBackend ? serverEvents : listEventRecords();
  const [pickedEventId, setSelectedEventId] = useState(events[0]?.id ?? "");
  const selectedEventId = pickedEventId || events[0]?.id || "";
  const [scannedToken, setScannedToken] = useState("");
  const [confirmation, setConfirmation] = useState<{ ok: boolean; message: string } | null>(null);
  const [qrOpen, setQrOpen] = useState(false);
  const [token, setToken] = useState("");
  const [expiresAt, setExpiresAt] = useState(0);
  const [tick, setTick] = useState(0);
  const [codeError, setCodeError] = useState("");
  const [attendance, setAttendance] = useState<ServerAttendanceRecord[]>([]);
  const [attendanceVersion, setAttendanceVersion] = useState(0);

  const selectedEvent = useMemo(
    () => events.find((event) => event.id === selectedEventId),
    [events, selectedEventId],
  );
  const countdown = secondsRemaining(expiresAt);
  void tick;

  const confirmSavedCheckIn = (eventId: string, userId: string) => {
    const saved = recordCheckIn({ eventId, userId });
    if (!saved.ok) {
      setConfirmation({ ok: false, message: saved.reason });
      toast({ title: "Check-in rejected", description: saved.reason, variant: "destructive" });
      return;
    }
    const when = new Date(saved.record.checkedInAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    const message = `${saved.record.attendeeName} checked in for ${saved.record.eventTitle}. +${saved.record.pointsAwarded} pts at ${when}.`;
    setConfirmation({ ok: true, message });
    toast({ title: "Check-in confirmed", description: message });
  };

  // Server mode: the server decides whether a code is genuine, unexpired and unused.
  // Offline mode keeps the original browser-only check below.
  const handleScannerSubmit = async () => {
    if (useHttpBackend) {
      if (!selectedEvent) return;
      try {
        const result = await redeemCheckInCode(selectedEvent.id, scannedToken);
        if (!result.ok) {
          setConfirmation({ ok: false, message: result.message });
          toast({ title: "Scan rejected", description: result.message, variant: "destructive" });
          return;
        }
        setScannedToken("");
        const when = new Date(result.checkedInAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
        const message = `${result.attendee.name} checked in for ${selectedEvent.title} at ${when}.`;
        setConfirmation({ ok: true, message });
        toast({ title: "Check-in confirmed", description: message });
        setAttendanceVersion((current) => current + 1);
      } catch (error) {
        const message = error instanceof ApiError && error.status !== 500 ? error.message : "Couldn't reach the server. Try again.";
        setConfirmation({ ok: false, message });
        toast({ title: "Scan failed", description: message, variant: "destructive" });
      }
      return;
    }
    const result = validateCheckInToken(scannedToken.trim());
    if (!result.ok) {
      toast({ title: "Scan rejected", description: result.reason, variant: "destructive" });
      return;
    }
    setScannedToken("");
    confirmSavedCheckIn(result.eventId, result.userId);
  };

  const handleNfcTap = () => {
    if (useHttpBackend) {
      toast({ title: "Use your QR code", description: "Check-in is done by showing your QR code to an organizer.", variant: "destructive" });
      return;
    }
    if (!auth.userId || !selectedEvent) return;
    confirmSavedCheckIn(selectedEvent.id, auth.userId);
  };

  useEffect(() => {
    if (!useHttpBackend) return;
    let active = true;
    fetchEvents()
      .then((loaded) => { if (active) setServerEvents(loaded); })
      .catch(() => { if (active) setEventsError(true); });
    return () => { active = false; };
  }, []);

  // The officer's list of who has checked in, read from the server.
  const attendanceEventId = selectedEvent?.id;
  useEffect(() => {
    if (!useHttpBackend || auth.role !== "org_officer" || !attendanceEventId) return;
    let active = true;
    fetchEventAttendance(attendanceEventId)
      .then((rows) => { if (active) setAttendance(rows); })
      .catch(() => { if (active) setAttendance([]); });
    return () => { active = false; };
  }, [auth.role, attendanceEventId, attendanceVersion]);

  // Depend on the event id (a string), not the event object: the events list is
  // re-read on every render, so the object is new each time and would restart
  // this effect, and the token refresh, in an endless loop.
  const selectedEventKey = selectedEvent?.id;
  useEffect(() => {
    const userId = auth.userId;
    if (!qrOpen || !userId || !selectedEventKey) return;
    let active = true;

    const refreshToken = async () => {
      try {
        const issued = useHttpBackend
          ? await requestCheckInCode(selectedEventKey)
          : issueDynamicCheckInToken(selectedEventKey, userId);
        if (!active) return;
        setToken(issued.token);
        setExpiresAt(Math.min(issued.expiresAt, Date.now() + QR_REFRESH_MS));
        setCodeError("");
      } catch (error) {
        if (active) setCodeError(error instanceof ApiError ? error.message : "Couldn't get a check-in code. Check your connection.");
      }
    };

    void refreshToken();
    const refreshInterval = window.setInterval(() => void refreshToken(), QR_REFRESH_MS);
    const secondTick = window.setInterval(() => setTick((current) => current + 1), 1_000);

    return () => {
      active = false;
      window.clearInterval(refreshInterval);
      window.clearInterval(secondTick);
    };
  }, [qrOpen, auth.userId, selectedEventKey]);

  return (
    <div className="min-h-screen bg-background flex flex-col pb-24">
      <header className="px-5 pt-[max(1.5rem,env(safe-area-inset-top))] pb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-foreground">Tap In</h1>
            <p className="text-sm text-muted-foreground">
              {auth.role === "org_officer" ? "Scan and validate attendance quickly" : "Check in to events instantly"}
            </p>
          </div>
          {auth.role === "student" && (
            <button
              onClick={() => setQrOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card"
              aria-label="Open backup QR check-in"
              title="Backup QR check-in"
            >
              <QrCode aria-hidden="true" className="h-5 w-5 text-foreground" />
            </button>
          )}
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-8">
        {auth.role === "student" ? (
          <>
            <motion.div
              className="relative w-48 h-48 mb-8"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="absolute inset-0 rounded-full bg-primary/10 animate-pulse-ring" />
              <div className="absolute inset-4 rounded-full bg-primary/15 animate-pulse-ring" style={{ animationDelay: "0.5s" }} />
              <div className="absolute inset-8 rounded-full bg-primary shadow-2xl shadow-primary/40 flex items-center justify-center">
                <Smartphone className="w-12 h-12 text-primary-foreground" />
              </div>
            </motion.div>

            <h2 className="text-xl font-bold text-foreground mb-2 text-center">Hold your iPhone near the reader</h2>
            <p className="text-sm text-muted-foreground text-center max-w-xs mb-8">
              NFC is the fastest option. If NFC fails, use QR backup from the event detail page.
            </p>

            <div className="w-full max-w-xs space-y-3">
              <select
                aria-label="Select event for check-in"
                value={selectedEventId}
                onChange={(event) => setSelectedEventId(event.target.value)}
                className="h-10 w-full rounded-[8px] border border-border bg-background px-3 text-sm"
              >
                {events.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.title}
                  </option>
                ))}
              </select>
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-card border border-border">
                <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                  <Wifi className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">NFC Ready</p>
                  <p className="text-xs text-muted-foreground">Your device supports Tap In</p>
                </div>
              </div>

              <Button className="w-full" onClick={handleNfcTap}>
                <Smartphone className="mr-2 h-4 w-4" />
                Simulate NFC Tap
              </Button>
            </div>
          </>
        ) : (
          <div className="w-full max-w-sm space-y-4">
            <div className="rounded-[12px] border border-border bg-card p-4">
              <div className="mb-3 flex items-center gap-2">
                <ScanLine className="h-4 w-4 text-primary" />
                <p className="text-sm font-semibold text-foreground">Scanner Mode</p>
              </div>
              <label className="mb-2 block text-xs text-muted-foreground">Event</label>
              <select
                aria-label="Select event to validate"
                value={selectedEventId}
                onChange={(event) => setSelectedEventId(event.target.value)}
                className="mb-3 h-10 w-full rounded-[8px] border border-border bg-background px-3 text-sm"
              >
                {events.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.title}
                  </option>
                ))}
              </select>
              <label className="mb-2 block text-xs text-muted-foreground">Scanned QR payload</label>
              <textarea
                aria-label="Scanned QR payload"
                value={scannedToken}
                onChange={(event) => setScannedToken(event.target.value)}
                className="h-24 w-full rounded-[8px] border border-border bg-background px-3 py-2 text-xs"
                placeholder="Paste QR token from student device"
              />
              <Button className="mt-3 w-full" onClick={handleScannerSubmit}>
                <QrCode className="mr-2 h-4 w-4" />
                Validate Attendance
              </Button>
              {selectedEvent && (
                <p className="mt-2 text-[11px] text-muted-foreground">
                  Validating for: <span className="font-medium text-foreground">{selectedEvent.title}</span>
                </p>
              )}
            </div>
            {useHttpBackend && (
              <div className="rounded-[12px] border border-border bg-card p-4">
                <p className="mb-2 text-sm font-semibold text-foreground">Checked in ({attendance.length})</p>
                {attendance.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No one has checked in yet.</p>
                ) : (
                  <ul aria-label="Checked-in attendees" className="space-y-1 text-xs">
                    {attendance.map((row) => (
                      <li key={row.userId} className="flex justify-between gap-2">
                        <span className="text-foreground">{row.name}</span>
                        <span className="text-muted-foreground">{new Date(row.checkedInAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}

        {eventsError && (
          <p role="alert" className="mt-6 text-sm text-destructive">Couldn't load events. Check your connection and reload.</p>
        )}

        {confirmation && (
          <div className={`mt-6 w-full max-w-xs rounded-[12px] border p-4 ${confirmation.ok ? "border-success/40 bg-success/10" : "border-destructive/40 bg-destructive/10"}`}>
            <div className="flex items-start gap-2">
              <CheckCircle2 className={`h-5 w-5 ${confirmation.ok ? "text-success" : "text-destructive"}`} />
              <div>
                <p className="text-sm font-semibold text-foreground">{confirmation.ok ? "Check-in confirmed" : "Check-in rejected"}</p>
                <p className="text-xs text-muted-foreground">{confirmation.message}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent className="max-w-sm rounded-[12px] border border-border bg-card p-5">
          <DialogHeader>
            <DialogTitle className="text-[15px] font-medium">Backup QR Check-In</DialogTitle>
            <DialogDescription className="text-xs">
              Show this to an organizer scanner. Code refreshes every 20 seconds.
            </DialogDescription>
          </DialogHeader>
          <CheckInQr token={token} eventTitle={selectedEvent?.title} countdown={countdown} />
          {codeError && <p role="alert" className="text-xs text-destructive">{codeError}</p>}
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
};

export default TapIn;
