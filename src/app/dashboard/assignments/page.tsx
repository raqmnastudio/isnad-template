import { ClipboardList } from "lucide-react";
import { PagePlaceholder } from "@/components/layout/page-placeholder";

export default function AssignmentsPage() {
  return (
    <PagePlaceholder
      title="التكليفات"
      description="إسناد المواد والشعب للمعلمات."
      icon={ClipboardList}
    />
  );
}
