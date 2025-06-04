// "use client";

// import { useEffect, useState } from "react";
// import { Input } from "@/components/ui/input";
// import { Button } from "@/components/ui/button";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// type User = {
//   id: string;
//   name: string;
//   email: string;
//   phone?: string;
//   role: "CLIENT" | "MANAGER";
// };

// export default function ManageUsers() {
//   const [users, setUsers] = useState<User[]>([]);
//   const [form, setForm] = useState({ name: "", email: "", phone: "", role: "CLIENT" });

//   const fetchUsers = async () => {
//     const res = await fetch("/api/all-users");
//     const data = await res.json();
//     setUsers(data);
//   };

//   const handleSubmit = async () => {
//     const res = await fetch("/api/users", {
//       method: "POST",
//       body: JSON.stringify(form),
//       headers: { "Content-Type": "application/json" },
//     });
//     if (res.ok) {
//       fetchUsers();
//       setForm({ name: "", email: "", phone: "", role: "CLIENT" });
//     }
//   };

//   const handleDelete = async (id: string) => {
//     await fetch(`/api/users/${id}`, { method: "DELETE" });
//     fetchUsers();
//   };

//   useEffect(() => {
//     fetchUsers();
//   }, []);

//   return (
//     <div className="space-y-6 p-6 max-w-4xl mx-auto">
//       <h2 className="text-2xl font-bold">Add Client/Manager</h2>

//       <div className="grid gap-4 md:grid-cols-4">
//         <Input
//           placeholder="Name"
//           value={form.name}
//           onChange={(e) => setForm({ ...form, name: e.target.value })}
//         />
//         <Input
//           placeholder="Email"
//           value={form.email}
//           onChange={(e) => setForm({ ...form, email: e.target.value })}
//         />
//         <Input
//           placeholder="Phone"
//           value={form.phone}
//           onChange={(e) => setForm({ ...form, phone: e.target.value })}
//         />
//         <Select value={form.role} onValueChange={(val) => setForm({ ...form, role: val as "CLIENT" | "MANAGER" })}>
//           <SelectTrigger>
//             <SelectValue placeholder="Role" />
//           </SelectTrigger>
//           <SelectContent>
//             <SelectItem value="CLIENT">Client</SelectItem>
//             <SelectItem value="MANAGER">Manager</SelectItem>
//           </SelectContent>
//         </Select>
//       </div>

//       <Button onClick={handleSubmit}>Add User</Button>

//       <h2 className="text-xl font-semibold mt-8">All Users</h2>
//       <Table>
//         <TableHeader>
//           <TableRow>
//             <TableHead>Name</TableHead>
//             <TableHead>Email</TableHead>
//             <TableHead>Phone</TableHead>
//             <TableHead>Role</TableHead>
//             <TableHead>Actions</TableHead>
//           </TableRow>
//         </TableHeader>
//         <TableBody>
//           {users.map((u) => (
//             <TableRow key={u.id}>
//               <TableCell>{u.name}</TableCell>
//               <TableCell>{u.email}</TableCell>
//               <TableCell>{u.phone || "-"}</TableCell>
//               <TableCell>{u.role}</TableCell>
//               <TableCell>
//                 <Button variant="destructive" onClick={() => handleDelete(u.id)}>Delete</Button>
//               </TableCell>
//             </TableRow>
//           ))}
//         </TableBody>
//       </Table>
//     </div>
//   );
// }
