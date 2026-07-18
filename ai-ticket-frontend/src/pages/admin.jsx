import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/use-auth.js";

export default function AdminPanel() {
  const { apiFetch } = useAuth();
  const [users, setUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    role: "user",
    skills: "",
    capacity: 5,
    isAvailable: true,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");

  const fetchUsers = useCallback(async () => {
    try {
      const response = await apiFetch("/auth/users");
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to fetch users");
      setUsers(data);
      setError("");
    } catch (requestError) {
      setError(requestError.message);
    }
  }, [apiFetch]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return users;
    return users.filter((user) => user.email.toLowerCase().includes(query));
  }, [searchQuery, users]);

  const handleEditClick = (user) => {
    setEditingUser(user.email);
    setFormData({
      role: user.role,
      skills: user.skills?.join(", ") || "",
      capacity: user.capacity || 5,
      isAvailable: user.isAvailable ?? true,
    });
  };

  const handleUpdate = async () => {
    try {
      const response = await apiFetch("/auth/update-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: editingUser,
          role: formData.role,
          skills: formData.skills
            .split(",")
            .map((skill) => skill.trim())
            .filter(Boolean),
          capacity: Number(formData.capacity),
          isAvailable: formData.isAvailable,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update user");
      }

      setEditingUser(null);
      await fetchUsers();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 mt-6">
      <h1 className="text-2xl font-bold mb-6">Admin Panel - Manage Users</h1>
      {error && <p className="alert alert-error mb-4">{error}</p>}
      <input
        type="text"
        className="input input-bordered w-full mb-6"
        placeholder="Search by email"
        value={searchQuery}
        onChange={(event) => setSearchQuery(event.target.value)}
      />

      {filteredUsers.map((user) => (
        <div key={user._id} className="bg-base-100 shadow rounded p-4 mb-4 border">
          <p>
            <strong>Email:</strong> {user.email}
          </p>
          <p>
            <strong>Role:</strong> {user.role}
          </p>
          <p>
            <strong>Skills:</strong> {user.skills?.join(", ") || "N/A"}
          </p>
          {user.role === "moderator" && (
            <p>
              <strong>Workload:</strong> {user.activeTicketCount}/{user.capacity}{" "}
              ({user.isAvailable ? "available" : "unavailable"})
            </p>
          )}

          {editingUser === user.email ? (
            <div className="mt-4 space-y-2">
              <select
                className="select select-bordered w-full"
                value={formData.role}
                onChange={(event) =>
                  setFormData({ ...formData, role: event.target.value })
                }
              >
                <option value="user">User</option>
                <option value="moderator">Moderator</option>
                <option value="admin">Admin</option>
              </select>
              <input
                type="text"
                placeholder="Comma-separated skills"
                className="input input-bordered w-full"
                value={formData.skills}
                onChange={(event) =>
                  setFormData({ ...formData, skills: event.target.value })
                }
              />
              <input
                type="number"
                min="1"
                max="100"
                className="input input-bordered w-full"
                value={formData.capacity}
                onChange={(event) =>
                  setFormData({ ...formData, capacity: event.target.value })
                }
              />
              <label className="label cursor-pointer justify-start gap-3">
                <input
                  type="checkbox"
                  className="checkbox"
                  checked={formData.isAvailable}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      isAvailable: event.target.checked,
                    })
                  }
                />
                Available for assignment
              </label>

              <div className="flex gap-2">
                <button className="btn btn-success btn-sm" onClick={handleUpdate}>
                  Save
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setEditingUser(null)}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              className="btn btn-primary btn-sm mt-2"
              onClick={() => handleEditClick(user)}
            >
              Edit
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

