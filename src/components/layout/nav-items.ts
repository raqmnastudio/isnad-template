import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Gauge,
  Layers,
  BookOpen,
  FileBarChart2,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  key: "dashboard" | "teachers" | "assignments" | "quotas" | "classes" | "subjects" | "reports" | "settings";
  href: string;
  icon: LucideIcon;
}

export const navItems: NavItem[] = [
  { key: "dashboard", href: "/dashboard", icon: LayoutDashboard },
  { key: "teachers", href: "/dashboard/teachers", icon: Users },
  { key: "assignments", href: "/dashboard/assignments", icon: ClipboardList },
  { key: "quotas", href: "/dashboard/quotas", icon: Gauge },
  { key: "classes", href: "/dashboard/classes", icon: Layers },
  { key: "subjects", href: "/dashboard/subjects", icon: BookOpen },
  { key: "reports", href: "/dashboard/reports", icon: FileBarChart2 },
  { key: "settings", href: "/dashboard/settings", icon: Settings },
];
