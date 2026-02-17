import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Clock, Plus, Trash2, CalendarOff, Loader2, Video } from "lucide-react";
import { format } from "date-fns";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

interface AvailSlot {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
  is_active: boolean;
}

interface BlockedDate {
  id: string;
  blocked_date: string;
  reason: string | null;
}

const AdminAvailability = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [slots, setSlots] = useState<AvailSlot[]>([]);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [newSlot, setNewSlot] = useState({ day: 1, start: "09:00", end: "17:00", duration: 30 });
  const [newBlockDate, setNewBlockDate] = useState("");
  const [newBlockReason, setNewBlockReason] = useState("");
  const [meetingLink, setMeetingLink] = useState("");
  const [savingMeetLink, setSavingMeetLink] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const [slotsRes, blockedRes, settingsRes] = await Promise.all([
      supabase.from("availability_slots").select("*").order("day_of_week").order("start_time"),
      supabase.from("blocked_dates").select("*").order("blocked_date"),
      supabase.from("admin_settings").select("*").eq("setting_key", "default_meeting_link").maybeSingle(),
    ]);
    if (slotsRes.data) setSlots(slotsRes.data);
    if (blockedRes.data) setBlockedDates(blockedRes.data);
    if (settingsRes.data) setMeetingLink(settingsRes.data.setting_value);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const addSlot = async () => {
    if (!user) return;
    const { error } = await supabase.from("availability_slots").insert({
      admin_user_id: user.id,
      day_of_week: newSlot.day,
      start_time: newSlot.start + ":00",
      end_time: newSlot.end + ":00",
      slot_duration_minutes: newSlot.duration,
    });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Slot added" }); fetchData(); }
  };

  const deleteSlot = async (id: string) => {
    await supabase.from("availability_slots").delete().eq("id", id);
    fetchData();
  };

  const toggleSlot = async (id: string, active: boolean) => {
    await supabase.from("availability_slots").update({ is_active: active }).eq("id", id);
    fetchData();
  };

  const addBlockedDate = async () => {
    if (!user || !newBlockDate) return;
    const { error } = await supabase.from("blocked_dates").insert({
      admin_user_id: user.id,
      blocked_date: newBlockDate,
      reason: newBlockReason || null,
    });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Date blocked" }); setNewBlockDate(""); setNewBlockReason(""); fetchData(); }
  };

  const saveMeetingLink = async () => {
    if (!user) return;
    setSavingMeetLink(true);
    const { error } = await supabase
      .from("admin_settings")
      .upsert(
        { admin_user_id: user.id, setting_key: "default_meeting_link", setting_value: meetingLink },
        { onConflict: "admin_user_id,setting_key" }
      );
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else toast({ title: "Meeting link saved" });
    setSavingMeetLink(false);
  };

  const removeBlockedDate = async (id: string) => {
    await supabase.from("blocked_dates").delete().eq("id", id);
    fetchData();
  };

  if (loading) return <AdminLayout><div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></AdminLayout>;

  return (
    <AdminLayout>
      <h1 className="font-display text-3xl font-bold text-foreground mb-8">Manage Availability</h1>

      {/* Meeting Link Setting */}
      <Card className="border-border bg-card mb-8">
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2">
            <Video className="h-5 w-5 text-primary" /> Default Meeting Link
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Paste your Google Meet link here. It will be included in every booking confirmation email.
          </p>
          <div className="flex gap-3">
            <Input
              value={meetingLink}
              onChange={(e) => setMeetingLink(e.target.value)}
              placeholder="https://meet.google.com/xxx-xxxx-xxx"
              className="flex-1"
            />
            <Button onClick={saveMeetingLink} disabled={savingMeetLink} className="box-glow">
              {savingMeetLink ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-6">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" /> Add Recurring Slot
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Day</Label>
                  <select
                    value={newSlot.day}
                    onChange={(e) => setNewSlot({ ...newSlot, day: Number(e.target.value) })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Duration (min)</Label>
                  <select
                    value={newSlot.duration}
                    onChange={(e) => setNewSlot({ ...newSlot, duration: Number(e.target.value) })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value={30}>30 min</option>
                    <option value={60}>60 min</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Time</Label>
                  <Input type="time" value={newSlot.start} onChange={(e) => setNewSlot({ ...newSlot, start: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>End Time</Label>
                  <Input type="time" value={newSlot.end} onChange={(e) => setNewSlot({ ...newSlot, end: e.target.value })} />
                </div>
              </div>
              <Button onClick={addSlot} className="w-full box-glow">Add Slot</Button>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" /> Current Slots
              </CardTitle>
            </CardHeader>
            <CardContent>
              {slots.length === 0 ? (
                <p className="text-muted-foreground text-sm">No slots configured yet</p>
              ) : (
                <div className="space-y-2">
                  {slots.map((slot) => (
                    <div key={slot.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                      <div className="flex items-center gap-3">
                        <Switch checked={slot.is_active} onCheckedChange={(v) => toggleSlot(slot.id, v)} />
                        <div>
                          <p className="text-sm font-medium text-foreground">{DAYS[slot.day_of_week]}</p>
                          <p className="text-xs text-muted-foreground">
                            {slot.start_time.slice(0, 5)} – {slot.end_time.slice(0, 5)} • {slot.slot_duration_minutes}min
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => deleteSlot(slot.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="border-border bg-card h-fit">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <CalendarOff className="h-5 w-5 text-primary" /> Blocked Dates
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={newBlockDate} onChange={(e) => setNewBlockDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Reason (optional)</Label>
              <Input value={newBlockReason} onChange={(e) => setNewBlockReason(e.target.value)} placeholder="Holiday, team event..." />
            </div>
            <Button onClick={addBlockedDate} variant="outline" className="w-full">Block Date</Button>

            {blockedDates.length > 0 && (
              <div className="space-y-2 pt-4 border-t border-border">
                {blockedDates.map((bd) => (
                  <div key={bd.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{format(new Date(bd.blocked_date + "T00:00"), "MMM d, yyyy")}</p>
                      {bd.reason && <p className="text-xs text-muted-foreground">{bd.reason}</p>}
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => removeBlockedDate(bd.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminAvailability;
