import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, QrCode, ScanLine, Smartphone, Wifi } from "lucide-react";
import { motion } from "framer-motion";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/contexts/AuthContext";
import { useRepositories } from "@/repositories/RepositoryProvider";
import { issueDynamicCheckInToken, secondsRemaining, validateCheckInToken } from "@/data/checkInStore";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import CheckInQr from "@/components/CheckInQr";

const TapIn = () => {
  const { auth } = useAuth();
  const { toast } = useToast();
  const { events: eventRepository } = useRepositories();
  const events = eventRepository.list();
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

  useEffect(() => {
    if (!qrOpen || !auth.userId || !selectedEvent) return;

    const refreshToken = () => {
      const issued = issueDynamicCheckInToken(selectedEvent.id, auth.userId);
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
  }, [qrOpen, auth.userId, selectedEvent]);

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

              <Button className="w-full" onClick={() => showConfirmation("NFC tap successful. Attendance confirmed.")}>
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
            <DialogTitle className="text-[15px] font-medium">Backup QR Check-In</DialogTitle>
            <DialogDescription className="text-xs">
              Show this to an organizer scanner. Code refreshes every 20 seconds.
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
