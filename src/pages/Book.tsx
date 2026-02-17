import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { format, isBefore, startOfDay, addDays, getDay } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar as CalendarIcon, Clock, ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface TimeSlot {
  time: string;
  available: boolean;
}

const Book = () => {
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", role: "", notes: "" });
  const [availableDays, setAvailableDays] = useState<number[]>([]);
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Fetch available days and blocked dates
  useEffect(() => {
    const fetchAvailability = async () => {
      const { data: slots } = await supabase
        .from("availability_slots")
        .select("day_of_week")
        .eq("is_active", true);
      if (slots) {
        setAvailableDays([...new Set(slots.map((s) => s.day_of_week))]);
      }

      const { data: blocked } = await supabase
        .from("blocked_dates")
        .select("blocked_date")
        .gte("blocked_date", format(new Date(), "yyyy-MM-dd"));
      if (blocked) {
        setBlockedDates(blocked.map((b) => b.blocked_date));
      }
    };
    fetchAvailability();
  }, []);

  // Fetch time slots when date is selected
  useEffect(() => {
    if (!selectedDate) return;
    const fetchSlots = async () => {
      setLoadingSlots(true);
      setSelectedTime(null);
      const dayOfWeek = getDay(selectedDate);
      const dateStr = format(selectedDate, "yyyy-MM-dd");

      const { data: availSlots } = await supabase
        .from("availability_slots")
        .select("*")
        .eq("day_of_week", dayOfWeek)
        .eq("is_active", true);

      const { data: existingBookings } = await supabase
        .from("bookings")
        .select("booking_time")
        .eq("booking_date", dateStr)
        .neq("status", "cancelled");

      const bookedTimes = new Set(existingBookings?.map((b) => b.booking_time) || []);
      const slots: TimeSlot[] = [];

      availSlots?.forEach((slot) => {
        const [startH, startM] = slot.start_time.split(":").map(Number);
        const [endH, endM] = slot.end_time.split(":").map(Number);
        const startMinutes = startH * 60 + startM;
        const endMinutes = endH * 60 + endM;
        const duration = slot.slot_duration_minutes;

        for (let m = startMinutes; m + duration <= endMinutes; m += duration) {
          const h = Math.floor(m / 60);
          const min = m % 60;
          const timeStr = `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}:00`;
          const displayTime = `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;

          // Check if time has already passed today
          const now = new Date();
          const isToday = format(selectedDate, "yyyy-MM-dd") === format(now, "yyyy-MM-dd");
          const isPast = isToday && (h < now.getHours() || (h === now.getHours() && min <= now.getMinutes()));

          slots.push({
            time: displayTime,
            available: !bookedTimes.has(timeStr) && !isPast,
          });
        }
      });

      setTimeSlots(slots);
      setLoadingSlots(false);
    };
    fetchSlots();
  }, [selectedDate]);

  const isDateDisabled = (date: Date) => {
    if (isBefore(date, startOfDay(new Date()))) return true;
    if (blockedDates.includes(format(date, "yyyy-MM-dd"))) return true;
    if (availableDays.length > 0 && !availableDays.includes(getDay(date))) return true;
    return false;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !selectedTime) return;
    setSubmitting(true);

    const { data, error } = await supabase
      .from("bookings")
      .insert({
        candidate_name: formData.name.trim(),
        candidate_email: formData.email.trim(),
        candidate_phone: formData.phone.trim() || null,
        role_applied: formData.role.trim(),
        notes: formData.notes.trim() || null,
        booking_date: format(selectedDate, "yyyy-MM-dd"),
        booking_time: selectedTime + ":00",
      })
      .select()
      .single();

    if (error) {
      toast({ title: "Booking Failed", description: error.message, variant: "destructive" });
      setSubmitting(false);
    } else {
      // Send confirmation email in background
      supabase.functions.invoke("send-booking-confirmation", {
        body: { bookingId: data.id },
      }).catch(console.error);

      navigate("/book/confirmation", {
        state: {
          booking: data,
          date: format(selectedDate, "EEEE, MMMM d, yyyy"),
          time: selectedTime,
        },
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container flex h-16 items-center">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <CalendarIcon className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-display text-lg font-bold text-foreground">InterviewBook</span>
          </Link>
        </div>
      </nav>

      <div className="container py-12 max-w-4xl">
        {/* Progress */}
        <div className="mb-8 flex items-center justify-center gap-2">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${step >= s ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
                {s}
              </div>
              {s < 3 && <div className={`w-12 h-0.5 ${step > s ? "bg-primary" : "bg-border"}`} />}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="text-center mb-8">
                <h1 className="font-display text-3xl font-bold text-foreground">Select a Date & Time</h1>
                <p className="mt-2 text-muted-foreground">Choose an available slot for your interview</p>
              </div>
              <div className="grid gap-8 md:grid-cols-2">
                <Card className="border-border bg-card">
                  <CardHeader>
                    <CardTitle className="font-display text-lg flex items-center gap-2">
                      <CalendarIcon className="h-5 w-5 text-primary" /> Pick a Date
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      disabled={isDateDisabled}
                      fromDate={new Date()}
                      toDate={addDays(new Date(), 60)}
                      className="pointer-events-auto"
                    />
                  </CardContent>
                </Card>

                <Card className="border-border bg-card">
                  <CardHeader>
                    <CardTitle className="font-display text-lg flex items-center gap-2">
                      <Clock className="h-5 w-5 text-primary" /> Available Times
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {!selectedDate ? (
                      <p className="text-muted-foreground text-sm">Select a date to see available times</p>
                    ) : loadingSlots ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    ) : timeSlots.length === 0 ? (
                      <p className="text-muted-foreground text-sm">No available slots for this date</p>
                    ) : (
                      <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                        {timeSlots.map((slot) => (
                          <button
                            key={slot.time}
                            disabled={!slot.available}
                            onClick={() => setSelectedTime(slot.time)}
                            className={`rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                              selectedTime === slot.time
                                ? "border-primary bg-primary text-primary-foreground box-glow"
                                : slot.available
                                ? "border-border bg-secondary hover:border-primary/50 text-foreground"
                                : "border-border/50 bg-muted/30 text-muted-foreground cursor-not-allowed opacity-50"
                            }`}
                          >
                            {slot.time}
                          </button>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
              <div className="mt-8 flex justify-end">
                <Button
                  onClick={() => setStep(2)}
                  disabled={!selectedDate || !selectedTime}
                  className="box-glow gap-2"
                >
                  Continue <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="text-center mb-8">
                <h1 className="font-display text-3xl font-bold text-foreground">Your Details</h1>
                <p className="mt-2 text-muted-foreground">
                  {selectedDate && format(selectedDate, "EEEE, MMMM d")} at {selectedTime}
                </p>
              </div>
              <Card className="border-border bg-card max-w-lg mx-auto">
                <CardContent className="pt-6">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name *</Label>
                      <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Jane Doe" required maxLength={100} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="jane@example.com" required maxLength={255} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone (optional)</Label>
                      <Input id="phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="+1 234 567 8900" maxLength={20} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role">Role Applying For *</Label>
                      <Input id="role" value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} placeholder="Frontend Engineer" required maxLength={100} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="notes">Additional Notes</Label>
                      <Textarea id="notes" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Anything you'd like us to know..." maxLength={1000} rows={3} />
                    </div>
                    <div className="flex gap-3 pt-2">
                      <Button type="button" variant="outline" onClick={() => setStep(1)} className="gap-2">
                        <ArrowLeft className="h-4 w-4" /> Back
                      </Button>
                      <Button type="submit" className="flex-1 box-glow" disabled={submitting}>
                        {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                        Confirm Booking
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Book;
