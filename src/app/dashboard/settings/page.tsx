import { Settings } from "lucide-react";
import { PagePlaceholder } from "@/components/layout/page-placeholder";

export default function SettingsPage() {
  return (
    <PagePlaceholder
      title="الإعدادات"
      description="إعدادات النظام والحساب."
      icon={Settings}
    />
  );
}
