import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="mb-1 inline-flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-navy"
    >
      <ArrowRight className="h-4 w-4" />
      {label}
    </Link>
  );
}
