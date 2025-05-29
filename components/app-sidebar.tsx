"use client"

import * as React from "react"
import {
  AudioWaveform,
  BookOpen,
  Bot,
  Command,
  Frame,
  GalleryVerticalEnd,
  Map,
  PieChart,
  QrCode,
  Settings2,
  SquareTerminal,
  StarIcon,
} from "lucide-react"



import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

// This is sample data.
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "Real Estate",
      logo: StarIcon,
      plan: "Admin",
    },
    {
      name: "Real Estate.",
      logo: AudioWaveform,
      plan: "Super Admin",
    },
    {
      name: "Evil Corp.",
      logo: Command,
      plan: "Free",
    },
  ],
  navMain: [
    {
      title: "Plots",
      url: "/plots",
      icon: Frame,
      isActive: true,
      items: [
        {
          title: "Add Project",
          url: "/plots",
        },
        {
          title: "Add Plots",
          url: "/plots",
        },
        {
          title: "Settings",
          url: "#",
        },
      ],
    },
    {
      title: "Visit Requests",
      url: "/visit-requests",
      icon: QrCode,
      items: [
        {
          title: "Requets",
          url: "/visit-requests",
        },
        {
          title: "Feedback",
          url: "/feedback",
        },
        {
          title: "Quantum",
          url: "#",
        },
      ],
    },
    {
      title: "Clients",
      url: "#",
      icon: BookOpen,
      items: [
        {
          title: "Add Client",
          url: "#",
        },
        {
          title: "Sell Request",
          url: "#",
        },
        {
          title: "Camera",
          url: "#",
        },
        {
          title: "Chats",
          url: "#",
        },
      ],
    },
    {
      title: "Managers",
      url: "#",
      icon: Settings2,
      items: [
        {
          title: "Attendance",
          url: "#",
        },
        {
          title: "Team",
          url: "#",
        },
        {
          title: "Manage",
          url: "#",
        },
        {
          title: "Limits",
          url: "#",
        },
      ],
    },
  ],
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
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
