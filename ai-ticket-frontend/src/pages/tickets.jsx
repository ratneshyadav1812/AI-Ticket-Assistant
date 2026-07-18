import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/use-auth.js";

const PROCESSING_STATUSES = new Set(["TODO", "PROCESSING"]);

export default function Tickets() {
  const { apiFetch, user } = useAuth();
  const [form, setForm] = useState({ title: "", description: "" });
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchTickets = useCallback(async () => {
    try {
      const response = await apiFetch("/tickets");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch tickets");
      }

      setTickets(data);
      setError("");
    } catch (requestError) {
      setError(requestError.message);
    }
  }, [apiFetch]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  useEffect(() => {
    const hasProcessingTicket = tickets.some((ticket) =>
      PROCESSING_STATUSES.has(ticket.status)
    );

    if (!hasProcessingTicket) return undefined;
    const interval = setInterval(fetchTickets, 3000);
    return () => clearInterval(interval);
  }, [fetchTickets, tickets]);

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      const response = await apiFetch("/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Ticket creation failed");
      }

      setForm({ title: "", description: "" });
      await fetchTickets();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-3xl mx-auto">
      {user?.role === "user" && (
        <>
          <h2 className="text-2xl font-bold mb-4">Create Ticket</h2>
          <form onSubmit={handleSubmit} className="space-y-3 mb-8">
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Ticket title"
              className="input input-bordered w-full"
              minLength={5}
              maxLength={200}
              required
            />
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Describe the problem"
              className="textarea textarea-bordered w-full"
              minLength={10}
              maxLength={10000}
              required
            />
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? "Submitting..." : "Submit Ticket"}
            </button>
          </form>
        </>
      )}

      <h2 className="text-xl font-semibold mb-2">
        {user?.role === "moderator" ? "Assigned Tickets" : "Tickets"}
      </h2>
      {error && <p className="alert alert-error mb-4">{error}</p>}

      <div className="space-y-3">
        {tickets.map((ticket) => (
          <Link
            key={ticket._id}
            className="card shadow-md p-4 bg-base-200"
            to={`/tickets/${ticket._id}`}
          >
            <div className="flex justify-between gap-4">
              <h3 className="font-bold text-lg">{ticket.title}</h3>
              <span className="badge badge-outline">{ticket.status}</span>
            </div>
            <p className="text-sm line-clamp-2">{ticket.description}</p>
            {ticket.priority && (
              <p className="text-sm">Priority: {ticket.priority}</p>
            )}
            <p className="text-sm opacity-60">
              {new Date(ticket.createdAt).toLocaleString()}
            </p>
          </Link>
        ))}
        {tickets.length === 0 && <p>No tickets found.</p>}
      </div>
    </div>
  );
}

