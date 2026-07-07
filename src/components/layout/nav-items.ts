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
  title: string;
  href: string;
  icon: LucideIcon;
}

export const navItems: NavItem[] = [
  { title: "لوحة التحكم", href: "/dashboard", icon: LayoutDashboard },
  { title: "المعلمات", href: "/dashboard/teachers", icon: Users },
  { title: "التكليفات", href: "/dashboard/assignments", icon: ClipboardList },
  { title: "النصاب", href: "/dashboard/quotas", icon: Gauge },
  { title: "الصفوف والشعب", href: "/dashboard/classes", icon: Layers },
  { title: "المواد", href: "/dashboard/subjects", icon: BookOpen },
  { title: "التقارير", href: "/dashboard/reports", icon: FileBarChart2 },
  { title: "الإعدادات", href: "/dashboard/settings", icon: Settings },
];
