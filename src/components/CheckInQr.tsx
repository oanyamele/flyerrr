interface CheckInQrProps {
  token: string;
  eventTitle?: string;
  countdown: number;
}

const CheckInQr = ({ token, eventTitle, countdown }: CheckInQrProps) => {
  const label = token
    ? `QR check-in code${eventTitle ? ` for ${eventTitle}` : ""}. Refreshes in ${countdown} seconds. Code value: ${token}`
    : "Generating QR check-in code";

  return (
    <div className="space-y-3">
      <div
        role="img"
        aria-label={label}
        className="rounded-[12px] border border-border bg-surface-sunken p-4"
      >
        <div className="grid grid-cols-12 gap-0.5 rounded-[8px] bg-background p-2" aria-hidden="true">
          {Array.from((token || "flyer-check-in-placeholder").slice(0, 144)).map((char, index) => (
            <div
              key={`${char}-${index}`}
              className={`h-2 w-2 rounded-[2px] ${char.charCodeAt(0) % 2 === 0 ? "bg-foreground" : "bg-transparent"}`}
            />
          ))}
        </div>
      </div>
      <p className="text-center text-xs text-muted-foreground">
        Refreshes in <span className="font-semibold text-foreground">{countdown}s</span>
      </p>
      <p className="sr-only">{label}</p>
      <p className="break-all rounded-[8px] bg-secondary/20 px-2 py-1 text-[10px] text-foreground">
        {token || "Generating code…"}
      </p>
    </div>
  );
};

export default CheckInQr;
