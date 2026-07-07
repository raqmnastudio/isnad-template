import { Gauge } from "lucide-react";
import { PagePlaceholder } from "@/components/layout/page-placeholder";

export default function QuotasPage() {
  return (
    <PagePlaceholder
      title="النصاب"
      description="متابعة النصاب الأسبوعي لكل معلمة."
      icon={Gauge}
    />
  );
}
