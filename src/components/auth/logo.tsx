import { TaskLynkLogo } from "@/components/ui/tasklynk-logo";
import { cn } from "@/lib/utils";

export function AuthLogo({
  className,
  variant = "white",
  asLink = false,
}: {
  className?: { className?: string } | string;
  variant?: "auto" | "light" | "dark" | "white";
  asLink?: boolean;
}) {
  const classNameValue = typeof className === "string" ? className : className?.className;
  return (
    <div className={cn("inline-flex", classNameValue)}>
      <TaskLynkLogo size="lg" variant={variant} showTagline={true} asLink={asLink} />
    </div>
  );
}


