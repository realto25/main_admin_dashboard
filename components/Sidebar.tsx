"use client";

import {
  BuildingIcon,
  CameraIcon,
  DollarSignIcon,
  FileTextIcon,
  HomeIcon,
  SettingsIcon,
  UsersIcon,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: HomeIcon },
  { name: "Clients", href: "/clients", icon: UsersIcon },
  { name: "Plots", href: "/plots", icon: BuildingIcon },
  { name: "Cameras", href: "/cameras", icon: CameraIcon },
  { name: "Sell Requests", href: "/sell-requests", icon: DollarSignIcon },
  { name: "Reports", href: "/reports", icon: FileTextIcon },
  { name: "Settings", href: "/settings", icon: SettingsIcon },
];
