"use client";

import {
  AudioWaveform,
  Command,
  Frame,
  Home,
  Map,
  PieChart,
  QrCode,
  Settings2,
  StarIcon,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";

import { NavProjects } from "@/components/nav-projects";
import { NavUser } from "@/components/nav-user";
import { TeamSwitcher } from "@/components/team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";

// Combined navigation items (showing all for now)
const navMainItems = [
  {
    title: "Dashboard",
    url: "/dashboard", // Assuming main dashboard page is at /dashboard
    icon: Home,
    items: [], // No nested items for dashboard usually
  },
  {
    title: "Clients",
    url: "/clients",
    icon: Users,
    items: [
      { title: "All Clients", url: "/clients" },
      { title: "Sell Requests", url: "/sell-requests" },
      { title: "Camera Access", url: "/cameras" },
    
    ],
  },
  {
    title: "Plots",
    url: "/plots", // Assuming main plots page is at /plots
    icon: Frame,
    items: [
      { title: "All Plots", url: "/plots" },
      { title: "Add Project", url: "/plots/new" }, // Assuming add project page
      { title: "Add Plots", url: "/plots/new-plot" }, // Assuming add plot page
    ],
  },
  {
    title: "Visit Requests",
    url: "/visit-requests", // Assuming main visit requests page
    icon: QrCode,
    items: [
      { title: "Requests", url: "/visit-requests" },
      { title: "Feedback", url: "/feedback" }, // Assuming feedback page
    ],
  },
  {
    title: "Camera Access",
    url: "/cameras",
    icon: Users,
    items: [],
  },
  {
    title: "Managers",
    url: "/managers", // Assuming main managers page
    icon: Settings2,
    items: [
      { title: "All Managers", url: "/managers" },
      // Add other manager-related links if needed
    ],
  },
];

// This is sample data with updated navigation structure
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    { name: "Real Estate", logo: StarIcon, plan: "Admin" },
    { name: "Real Estate.", logo: AudioWaveform, plan: "Super Admin" },
    { name: "Evil Corp.", logo: Command, plan: "Free" },
  ],
  navMain: navMainItems, // Use the combined list
  projects: [
    {
      name: "Plots",
      url: "/plots",
      icon: Frame,
    },
    {
      name: "Analytics",
      url: "#",
      icon: PieChart,
    },
    {
      name: "Travel",
      url: "#",
      icon: Map,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const router = useRouter(); // Initialize useRouter

  // Handle click for sidebar items with nested items (use the first item's URL as the default)
  const handleParentNavClick = (item: any) => {
    if (item.url) {
      router.push(item.url);
    } else if (item.items && item.items.length > 0) {
      router.push(item.items[0].url);
    }
  };

  // Handle click for nested sidebar items
  const handleChildNavClick = (url: string) => {
    router.push(url);
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <nav className="space-y-1">
          {data.navMain.map((item) => (
            <div key={item.title}>
              <button
                className="flex items-center w-full px-4 py-2 text-left hover:bg-accent rounded transition"
                onClick={() => handleParentNavClick(item)}
                type="button"
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.title}
              </button>
              {item.items && item.items.length > 0 && (
                <ul className="ml-6 space-y-1">
                  {item.items.map((subItem) => (
                    <li key={subItem.title}>
                      <button
                        className="flex items-center w-full px-4 py-2 text-left text-sm hover:bg-accent rounded transition"
                        onClick={() => handleChildNavClick(subItem.url)}
                        type="button"
                      >
                        {subItem.title}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </nav>
        <NavProjects projects={data.projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
