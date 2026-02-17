import { useLocation, Link, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle, Calendar, Clock, User, Briefcase, Download, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const BookingConfirmation = () => {
  const location = useLocation();
  const { booking, date, time } = location.state || {};

  if (!booking) return <Navigate to="/book" replace />;

  const generateICS = () => {
    const dateStr = booking.booking_date.replace(/-/g, "");
    const timeStr = booking.booking_time.replace(/:/g, "").slice(0, 4) + "00";
    const dtStart = `${dateStr}T${timeStr}`;
    
    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "BEGIN:VEVENT",
      `DTSTART:${dtStart}`,
      `SUMMARY:Interview - ${booking.role_applied}`,
      `DESCRIPTION:Interview booking for ${booking.candidate_name}`,
      "DURATION:PT30M",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    const blob = new Blob([ics], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "interview-booking.ics";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(82_85%_50%/0.06),transparent_60%)]" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-md"
      >
        <div className="text-center mb-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/20 mb-4"
          >
            <CheckCircle className="h-8 w-8 text-primary" />
          </motion.div>
          <h1 className="font-display text-3xl font-bold text-foreground">Booking Confirmed!</h1>
          <p className="mt-2 text-muted-foreground">Your interview has been scheduled successfully</p>
        </div>

        <Card className="border-border bg-card">
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-primary shrink-0" />
              <div>
                <p className="text-sm text-muted-foreground">Date</p>
                <p className="font-medium text-foreground">{date}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-primary shrink-0" />
              <div>
                <p className="text-sm text-muted-foreground">Time</p>
                <p className="font-medium text-foreground">{time}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-primary shrink-0" />
              <div>
                <p className="text-sm text-muted-foreground">Candidate</p>
                <p className="font-medium text-foreground">{booking.candidate_name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Briefcase className="h-5 w-5 text-primary shrink-0" />
              <div>
                <p className="text-sm text-muted-foreground">Role</p>
                <p className="font-medium text-foreground">{booking.role_applied}</p>
              </div>
            </div>
            {booking.meeting_link && (
              <div className="flex items-center gap-3">
                <Video className="h-5 w-5 text-primary shrink-0" />
                <div>
                  <p className="text-sm text-muted-foreground">Meeting Link</p>
                  <a href={booking.meeting_link} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline break-all">
                    Join Interview
                  </a>
                </div>
              </div>
            )}

            <div className="pt-4 flex flex-col gap-3">
              <Button onClick={generateICS} variant="outline" className="gap-2">
                <Download className="h-4 w-4" /> Add to Calendar
              </Button>
              <Link to="/">
                <Button className="w-full box-glow">Back to Home</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default BookingConfirmation;
