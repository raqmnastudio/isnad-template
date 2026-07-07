import { Users } from "lucide-react";
import { PagePlaceholder } from "@/components/layout/page-placeholder";

export default function TeachersPage() {
  return (
    <PagePlaceholder
      title="المعلمات"
      description="إدارة بيانات المعلمات في المدرسة."
      icon={Users}
    />
  );
}
