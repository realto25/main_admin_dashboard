// app/dashboard/visit-requests/page.tsx
"use client";

import axios from "axios";
import { useEffect, useState } from "react";

interface VisitRequest {
  id: string;
  name: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  qrCode?: string;
  plotId: string;
  createdAt: string;
}

export default function VisitRequestsPage() {
  const [requests, setRequests] = useState<VisitRequest[]>([]);

  useEffect(() => {
    axios.get("/api/visit-requests").then((res) => setRequests(res.data));
  }, []);

  const approveRequest = async (id: string) => {
    const res = await axios.post(`/api/visit-requests/${id}/approve`);
    alert("Approved & QR generated");
    setRequests((prev) => prev.map((r) => (r.id === id ? res.data : r)));
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Visit Requests</h1>
      {requests.map((req) => (
        <div key={req.id} className="p-4 border rounded mb-4">
          <p>
            <strong>Name:</strong> {req.name}
          </p>
          <p>
            <strong>Plot ID:</strong> {req.plotId}
          </p>
          <p>
            <strong>Status:</strong> {req.status}
          </p>
          {req.qrCode && (
            <img src={req.qrCode} alt="QR Code" className="mt-2 w-32" />
          )}
          {req.status === "PENDING" && (
            <button
              className="mt-2 bg-green-500 text-white px-4 py-2 rounded"
              onClick={() => approveRequest(req.id)}
            >
              Approve & Generate QR
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
