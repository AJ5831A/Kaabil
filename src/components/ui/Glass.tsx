import { cn } from "./cn";

export function Glass({
  as: As = "div",
  strong,
  className,
  ...rest
}: { as?: React.ElementType; strong?: boolean } & React.HTMLAttributes<HTMLElement>) {
  return <As className={cn(strong ? "glass-strong" : "glass", "gold-edge rounded-[var(--radius-tile)]", className)} {...rest} />;
}
