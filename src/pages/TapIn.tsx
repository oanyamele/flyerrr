import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, QrCode, ScanLine } from "lucide-react";
import { motion } from "framer-motion";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/contexts/AuthContext";
import { listEventRecords } from "@/data/appDatabase";
import { issueDynamicCheckInToken, secondsRemaining, validateCheckInToken } from "@/data/checkInStore";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import CheckInQr from "@/components/CheckInQr";

const TapIn = () => {
  const { auth } = useAuth();
  const { toast } = useToast();
  const events = listEventRecords();
  const [selectedEventId, setSelectedEventId] = useState(events[0]?.id ?? "");
  const [scannedToken, setScannedToken] = useState("");
  const [confirmationText, setConfirmationText] = useState("");
  const [qrOpen, setQrOpen] = useState(false);
  const [token, setToken] = useState("");
  const [expiresAt, setExpiresAt] = useState(0);
  const [tick, setTick] = useState(0);

  const selectedEvent = useMemo(
    () => events.find((event) => event.id === selectedEventId),
    [events, selectedEventId],
  );
  const countdown = secondsRemaining(expiresAt);
  void tick;

  const showConfirmation = (message: string) => setConfirmationText(message);

  const handleScannerSubmit = () => {
    const result = validateCheckInToken(scannedToken.trim());
    if (!result.ok) {
      toast({ title: "Scan rejected", description: result.reason, variant: "destructive" });
      return;
    }
    showConfirmation("Attendance validated. Student check-in confirmed.");
    setScannedToken("");
    toast({ title: "Check-in confirmed", description: "The student has been marked present." });
  };

  // Depend on the event id (a string), not the event object: the events list is
  // re-read on every render, so the object is new each time and would restart
  // this effect, and the token refresh, in an endless loop.
  const selectedEventKey = selectedEvent?.id;
  useEffect(() => {
    const userId = auth.userId;
    if (!qrOpen || !userId || !selectedEventKey) return;

    const refreshToken = () => {
      const issued = issueDynamicCheckInToken(selectedEventKey, userId);
      setToken(issued.token);
      setExpiresAt(issued.expiresAt);
    };

    refreshToken();
    const refreshInterval = window.setInterval(refreshToken, 20_000);
    const secondTick = window.setInterval(() => setTick((current) => current + 1), 1_000);

    return () => {
      window.clearInterval(refreshInterval);
      window.clearInterval(secondTick);
    };
  }, [qrOpen, auth.userId, selectedEventKey]);

  return (
    <div className="min-h-screen bg-background flex flex-col pb-24">
      <header className="px-5 pt-[max(1.5rem,env(safe-area-inset-top))] pb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-foreground">Check In</h1>
            <p className="text-sm text-muted-foreground">
              {auth.role === "org_officer" ? "Validate student check-in codes" : "Check in to events with your QR code"}
            </p>
          </div>
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
                <QrCode aria-hidden="true" className="w-12 h-12 text-primary-foreground" />
              </div>
            </motion.div>

            <h2 className="text-xl font-bold text-foreground mb-2 text-center">Show your check-in QR code</h2>
            <p className="text-sm text-muted-foreground text-center max-w-xs mb-8">
              Pick the event, then show the code to the organizer. It refreshes every 20 seconds, so a screenshot won't work.
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
              <Button className="w-full" onClick={() => setQrOpen(true)} disabled={!selectedEvent}>
                <QrCode aria-hidden="true" className="mr-2 h-4 w-4" />
                Show My Check-In QR
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
          </div>
        )}

        {confirmationText && (
          <div className="mt-6 w-full max-w-xs rounded-[12px] border border-success/40 bg-success/10 p-4">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-success" />
              <div>
                <p className="text-sm font-semibold text-foreground">Check-in confirmed</p>
                <p className="text-xs text-muted-foreground">{confirmationText}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent className="max-w-sm rounded-[12px] border border-border bg-card p-5">
          <DialogHeader>
            <DialogTitle className="text-[15px] font-medium">Check-In QR</DialogTitle>
            <DialogDescription className="text-xs">
              Show this to the event organizer. The code refreshes every 20 seconds.
            </DialogDescription>
          </DialogHeader>
          <CheckInQr token={token} eventTitle={selectedEvent?.title} countdown={countdown} />
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
};

export default TapIn;
