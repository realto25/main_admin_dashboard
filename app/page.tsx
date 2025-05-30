import { NotificationBell } from "@/components/NotificationBell";

export default function Home() {
  return (
    <div className="flex justify-center items-center">
      <h1 className="text-4xl font-bold">Home page</h1>

      <NotificationBell />
    </div>
  );
}
