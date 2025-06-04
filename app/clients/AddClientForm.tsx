"use client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function AddClientForm({ onAdd }: { onAdd: () => void }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", clerkId: "" });

  const handleSubmit = async () => {
    const res = await fetch("/api/users", {
      method: "POST",
      body: JSON.stringify({ ...form, role: "CLIENT" }),
    });

    if (res.ok) {
      toast.success("Client added");
      setForm({ name: "", email: "", phone: "", clerkId: "" });
      onAdd();
    } else toast.error("Error adding client");
  };

  return (
    <div className="space-y-4">
      <Input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      <Input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      <Input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
      <Input placeholder="Clerk ID" value={form.clerkId} onChange={(e) => setForm({ ...form, clerkId: e.target.value })} />
      <Button onClick={handleSubmit}>Add Client</Button>
    </div>
  );
}
