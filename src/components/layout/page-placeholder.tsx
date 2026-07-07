import { type LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

interface PagePlaceholderProps {
  title: string;
  description: string;
  icon: LucideIcon;
}

export function PagePlaceholder({
  title,
  description,
  icon: Icon,
}: PagePlaceholderProps) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold text-navy">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-navy/10 text-navy">
            <Icon className="h-6 w-6" />
          </div>
          <p className="font-medium text-navy">هذا القسم قيد الإعداد</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            سيتم تفعيل إدارة {title} في الإصدارات القادمة من نظام إسناد.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
