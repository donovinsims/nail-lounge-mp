import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { getMyStaff } from "@/lib/admin.functions";
import { getStaffAppointments } from "@/lib/booking.functions";
import { Loader2, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/_authenticated/staff/appointments")({
  component: StaffAppointments,
});

interface Appointment {
  id: string;
  start_time: string;
  end_time: string;
  status: string;
  client_name: string;
  service_name: string;
  client_phone: string | null;
}

function StaffAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const staff = await getMyStaff();
        if (!staff) return;

        const data = await getStaffAppointments({ data: { staffId: staff.id } });
        setAppointments(data as Appointment[]);
      } catch (err) {
        console.error("Failed to load appointments:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="flex items-center gap-3">
        <Link
          to="/staff"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
      </div>

      <h1 className="mt-4 text-2xl font-bold tracking-tight">My Appointments</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Upcoming and past appointments assigned to you.
      </p>

      {appointments.length === 0 ? (
        <div className="mt-8 rounded-xl border bg-card p-8 text-center text-muted-foreground">
          <p>No upcoming appointments found.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {appointments.map((apt) => (
            <div
              key={apt.id}
              className="flex items-center justify-between rounded-xl border bg-card px-5 py-4"
            >
              <div>
                <p className="font-medium">{apt.client_name}</p>
                <p className="text-sm text-muted-foreground">{apt.service_name}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(apt.start_time).toLocaleString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}{" "}
                  —{" "}
                  {new Date(apt.end_time).toLocaleString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  apt.status === "confirmed"
                    ? "bg-blue-100 text-blue-700"
                    : apt.status === "completed"
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-600"
                }`}
              >
                {apt.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
