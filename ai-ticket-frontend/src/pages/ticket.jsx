import { useCallback, useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { useParams } from "react-router-dom";
import { useAuth } from "../auth/use-auth.js";

const PROCESSING_STATUSES = new Set(["TODO", "PROCESSING"]);

export default function TicketDetailsPage() {
  const { id } = useParams();
  const { apiFetch, user } = useAuth();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchTicket = useCallback(async () => {
    try {
      const response = await apiFetch(`/tickets/${id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch ticket");
      }

      setTicket(data);
      setError("");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, [apiFetch, id]);

  useEffect(() => {
    fetchTicket();
  }, [fetchTicket]);

  useEffect(() => {
    if (!ticket || !PROCESSING_STATUSES.has(ticket.status)) return undefined;
    const interval = setInterval(fetchTicket, 3000);
    return () => clearInterval(interval);
  }, [fetchTicket, ticket]);

  const updateStatus = async (status) => {
    try {
      const response = await apiFetch(`/tickets/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update status");
      }

      setTicket(data.ticket);
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  if (loading) {
    return <div className="text-center mt-10">Loading ticket details...</div>;
  }

  if (!ticket) {
    return <div className="text-center mt-10">{error || "Ticket not found"}</div>;
  }

  const canManage = ["moderator", "admin"].includes(user?.role);

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Ticket Details</h2>
      {error && <p className="alert alert-error mb-4">{error}</p>}

      <div className="card bg-base-200 shadow p-4 space-y-4">
        <div className="flex justify-between gap-4">
          <h3 className="text-xl font-semibold">{ticket.title}</h3>
          <span className="badge badge-outline">{ticket.status}</span>
        </div>
        <p>{ticket.description}</p>

        {ticket.summary && (
          <p>
            <strong>AI Summary:</strong> {ticket.summary}
          </p>
        )}
        {ticket.priority && (
          <p>
            <strong>Priority:</strong> {ticket.priority}
          </p>
        )}
        {ticket.relatedSkills?.length > 0 && (
          <p>
            <strong>Related Skills:</strong> {ticket.relatedSkills.join(", ")}
          </p>
        )}
        {ticket.helpfulNotes && (
          <div>
            <strong>Helpful Notes:</strong>
            <div className="prose max-w-none rounded mt-2">
              <ReactMarkdown>{ticket.helpfulNotes}</ReactMarkdown>
            </div>
          </div>
        )}

        <p>
          <strong>Assigned To:</strong> {ticket.assignedTo?.email || "Not assigned"}
        </p>

        {canManage && ticket.status === "ASSIGNED" && (
          <button className="btn btn-primary" onClick={() => updateStatus("IN_PROGRESS")}>
            Start Work
          </button>
        )}
        {canManage && ["ASSIGNED", "IN_PROGRESS"].includes(ticket.status) && (
          <button className="btn btn-success" onClick={() => updateStatus("RESOLVED")}>
            Resolve Ticket
          </button>
        )}

        <p className="text-sm opacity-60">
          Created: {new Date(ticket.createdAt).toLocaleString()}
        </p>
      </div>
    </div>
  );
}

