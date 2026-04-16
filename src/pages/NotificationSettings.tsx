import { ArrowLeft, Bell, BellOff, Volume2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";

const NotificationSettings = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    allowNotifications: true,
    sounds: true,
    badges: true,
    lockScreen: true,
    banners: true,
    eventReminders: true,
    friendActivity: false,
    orgUpdates: true,
    weeklyDigest: true,
    tapInConfirmation: true,
    newEvents: true,
    capacityAlerts: false,
  });

  const toggle = (key: keyof typeof settings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="mb-5">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 mb-2">{title}</p>
      <div className="mx-5 rounded-2xl bg-card border border-border overflow-hidden">{children}</div>
    </div>
  );

  const Row = ({ label, description, checked, onToggle, last }: { label: string; description?: string; checked: boolean; onToggle: () => void; last?: boolean }) => (
    <div className={`flex items-center justify-between px-4 py-3.5 ${!last ? "border-b border-border" : ""}`}>
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onToggle} />
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-10">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="flex items-center gap-3 px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-3">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-lg font-bold text-foreground">Notification Settings</h1>
        </div>
      </header>

      <div className="py-4">
        <Section title="General">
          <Row label="Allow Notifications" description="Receive notifications from flyer" checked={settings.allowNotifications} onToggle={() => toggle("allowNotifications")} />
          <Row label="Sounds" description="Play a sound for notifications" checked={settings.sounds} onToggle={() => toggle("sounds")} />
          <Row label="Badges" description="Show badge count on app icon" checked={settings.badges} onToggle={() => toggle("badges")} />
          <Row label="Lock Screen" description="Show notifications on lock screen" checked={settings.lockScreen} onToggle={() => toggle("lockScreen")} />
          <Row label="Banners" description="Show banner notifications" checked={settings.banners} onToggle={() => toggle("banners")} last />
        </Section>

        <Section title="Events">
          <Row label="Event Reminders" description="Get reminded before events you RSVP'd to" checked={settings.eventReminders} onToggle={() => toggle("eventReminders")} />
          <Row label="New Events" description="When orgs you follow post new events" checked={settings.newEvents} onToggle={() => toggle("newEvents")} />
          <Row label="Capacity Alerts" description="When events are almost full" checked={settings.capacityAlerts} onToggle={() => toggle("capacityAlerts")} last />
        </Section>

        <Section title="Social">
          <Row label="Friend Activity" description="When friends RSVP to events" checked={settings.friendActivity} onToggle={() => toggle("friendActivity")} />
          <Row label="Organization Updates" description="Posts and announcements from followed orgs" checked={settings.orgUpdates} onToggle={() => toggle("orgUpdates")} last />
        </Section>

        <Section title="Summary">
          <Row label="Weekly Digest" description="Personalized weekly campus event summary" checked={settings.weeklyDigest} onToggle={() => toggle("weeklyDigest")} />
          <Row label="Tap-In Confirmation" description="Confirmation when you check in to an event" checked={settings.tapInConfirmation} onToggle={() => toggle("tapInConfirmation")} last />
        </Section>
      </div>
    </div>
  );
};

export default NotificationSettings;
