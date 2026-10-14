import { MonitorCog } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({ inverse = false, className, onClick }: { inverse?: boolean; className?: string; onClick?: () => void }) {
  return (
    <button className={cn("logo", inverse && "logo-inverse", className)} onClick={onClick} type="button">
      <span className="logo-mark">
        <MonitorCog size={21} />
      </span>
      <span>
        TechTutor <strong>AI</strong>
      </span>
    </button>
  );
}