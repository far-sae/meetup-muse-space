
-- Fix overly permissive INSERT on bookings - restrict to only insert with valid data
DROP POLICY "Anyone can create bookings" ON public.bookings;
CREATE POLICY "Anyone can create bookings" ON public.bookings FOR INSERT WITH CHECK (
  candidate_name IS NOT NULL AND candidate_email IS NOT NULL AND role_applied IS NOT NULL AND booking_date IS NOT NULL AND booking_time IS NOT NULL
);
