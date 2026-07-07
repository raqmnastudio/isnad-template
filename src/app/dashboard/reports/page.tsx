import { FileBarChart2 } from "lucide-react";
import { PagePlaceholder } from "@/components/layout/page-placeholder";

export default function ReportsPage() {
  return (
    <PagePlaceholder
      title="التقارير"
      description="تقارير شاملة عن النصاب والتكليفات."
      icon={FileBarChart2}
    />
  );
}
