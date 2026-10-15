import { cn } from "@/lib/utils";

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-ink text-paper" aria-hidden>
        <svg viewBox="0 0 32 32" className="h-5 w-5" fill="none">
          <rect x="6" y="7" width="4" height="18" rx="1" fill="#F3EFE7" />
          <rect x="14" y="7" width="4" height="12" rx="1" fill="#C2410C" />
          <rect x="22" y="7" width="4" height="8" rx="1" fill="#F3EFE7" fillOpacity="0.75" />
        </svg>
      </span>
      <span className="font-display text-[1.35rem] leading-none tracking-tight">Jobtrackr</span>
    </span>
  );
}
