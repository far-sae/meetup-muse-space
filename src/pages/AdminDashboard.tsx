import { useEffect, useState } from "react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Users, TrendingUp } from "lucide-react";

interface Booking {
  id: string;
  candidate_name: string;
  candidate_email: string;
  role_applied: string;
  booking_date: string;
  booking_time: string;
  status: string;
  created_at: string;
}

const statusColor: Record<string, string> = {
  scheduled: "bg-primary/20 text-primary border-primary/30",
  completed: "bg-green-500/20 text-green-400 border-green-500/30",
  cancelled: "bg-destructive/20 text-destructive border-destructive/30",
  "no-show": "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
};

const AdminDashboard = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState({ today: 0, week: 0, total: 0 });

  useEffect(() => {
    const fetchData = async () => {
      const today = format(new Date(), "yyyy-MM-dd");
      const { data } = await supabase
        .from("bookings")
        .select("*")
        .order("booking_date", { ascending: true })
        .order("booking_time", { ascending: true });

      if (data) {
        setBookings(data);
        const todayBookings = data.filter((b) => b.booking_date === today && b.status === "scheduled");
        const upcoming = data.filter((b) => b.booking_date >= today && b.status === "scheduled");
        setStats({ today: todayBookings.length, week: upcoming.slice(0, 7).length, total: upcoming.length });
      }
    };
    fetchData();
  }, []);

  const recentBookings = bookings.filter((b) => b.booking_date >= format(new Date(), "yyyy-MM-dd")).slice(0, 5);

  return (
    <AdminLayout>
      <h1 className="font-display text-3xl font-bold text-foreground mb-8">Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-3 mb-8">
        {[
          { icon: Calendar, label: "Today", value: stats.today },
          { icon: Clock, label: "This Week", value: stats.week },
          { icon: TrendingUp, label: "Total Upcoming", value: stats.total },
        ].map((stat) => (
          <Card key={stat.label} className="border-border bg-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <stat.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="font-display text-2xl font-bold text-foreground">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" /> Upcoming Interviews
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentBookings.length === 0 ? (
            <p className="text-muted-foreground text-sm">No upcoming interviews</p>
          ) : (
            <div className="space-y-3">
              {recentBookings.map((b) => (
                <div key={b.id} className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div>
                    <p className="font-medium text-foreground">{b.candidate_name}</p>
                    <p className="text-sm text-muted-foreground">{b.role_applied} • {b.candidate_email}</p>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{format(new Date(b.booking_date), "MMM d")}</p>
                      <p className="text-xs text-muted-foreground">{b.booking_time.slice(0, 5)}</p>
                    </div>
                    <Badge variant="outline" className={statusColor[b.status]}>{b.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default AdminDashboard;
