import { BookOpen } from "lucide-react";
import { PagePlaceholder } from "@/components/layout/page-placeholder";

export default function SubjectsPage() {
  return (
    <PagePlaceholder
      title="المواد"
      description="إدارة المواد الدراسية المعتمدة."
      icon={BookOpen}
    />
  );
}
