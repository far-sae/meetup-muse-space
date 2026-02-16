import { useEffect, useState } from "react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { List, Search, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Booking {
  id: string;
  candidate_name: string;
  candidate_email: string;
  candidate_phone: string | null;
  role_applied: string;
  notes: string | null;
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

const AdminBookings = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast } = useToast();

  const fetchBookings = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("bookings")
      .select("*")
      .order("booking_date", { ascending: false })
      .order("booking_time", { ascending: false });
    if (data) setBookings(data);
    setLoading(false);
  };

  useEffect(() => { fetchBookings(); }, []);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("bookings").update({ status }).eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else fetchBookings();
  };

  const filtered = bookings.filter((b) => {
    const matchesSearch = b.candidate_name.toLowerCase().includes(search.toLowerCase()) ||
      b.candidate_email.toLowerCase().includes(search.toLowerCase()) ||
      b.role_applied.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <AdminLayout>
      <h1 className="font-display text-3xl font-bold text-foreground mb-8">All Bookings</h1>

      <Card className="border-border bg-card">
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
            <CardTitle className="font-display flex items-center gap-2">
              <List className="h-5 w-5 text-primary" /> Interviews ({filtered.length})
            </CardTitle>
            <div className="flex gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="pl-9 w-48" />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="no-show">No-show</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No bookings found</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Candidate</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-foreground">{b.candidate_name}</p>
                          <p className="text-xs text-muted-foreground">{b.candidate_email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-foreground">{b.role_applied}</TableCell>
                      <TableCell className="text-foreground">{format(new Date(b.booking_date + "T00:00"), "MMM d, yyyy")}</TableCell>
                      <TableCell className="text-foreground">{b.booking_time.slice(0, 5)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusColor[b.status]}>{b.status}</Badge>
                      </TableCell>
                      <TableCell>
                        {b.status === "scheduled" && (
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" onClick={() => updateStatus(b.id, "completed")} className="text-xs">Complete</Button>
                            <Button size="sm" variant="ghost" onClick={() => updateStatus(b.id, "cancelled")} className="text-xs text-destructive">Cancel</Button>
                            <Button size="sm" variant="ghost" onClick={() => updateStatus(b.id, "no-show")} className="text-xs">No-show</Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default AdminBookings;
