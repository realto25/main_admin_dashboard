"use client";
import { useEffect, useState } from "react";

export default function ClientTable() {
  const [clients, setClients] = useState([]);

  const loadClients = async () => {
    const res = await fetch("/api/users/client");
    const data = await res.json();
    setClients(data);
  };

  useEffect(() => {
    loadClients();
  }, []);

  return (
    <table className="w-full text-left">
      <thead>
        <tr>
          <th>Name</th><th>Email</th><th>Phone</th><th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {clients.map((c) => (
          <tr key={c.id}>
            <td>{c.name}</td><td>{c.email}</td><td>{c.phone}</td>
            <td>
              {/* For future: Add Edit/Delete buttons */}
              <button>Assign</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
