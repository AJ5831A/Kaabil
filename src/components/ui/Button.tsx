"use client";

import Link from "next/link";
import { cn } from "./cn";
import { Icon, type IconName } from "./Icon";
import { useFeedback } from "@/lib/feedback";

type Variant = "gold" | "glass" | "ghost" | "danger";
type Size = "md" | "lg" | "xl";

const base =
  "relative inline-flex select-none items-center justify-center gap-2 rounded-full font-medium transition-[transform,background,box-shadow,color] duration-200 ease-[var(--ease-spring)] active:scale-[0.97] disabled:pointer-events-none disabled:opacity-45";
const variants: Record<Variant, string> = {
  gold: "bg-gold text-gold-ink shadow-[0_8px_24px_-10px_var(--gold)] hover:brightness-110",
  glass: "glass text-fg hover:bg-glass-2",
  ghost: "text-muted hover:bg-glass hover:text-fg",
  danger: "bg-danger-bg text-danger hover:brightness-110",
};
const sizes: Record<Size, string> = {
  md: "h-11 px-5 text-sm",
  lg: "h-13 px-6 text-[0.95rem]",
  xl: "h-16 px-8 text-lg",
};

type Common = { variant?: Variant; size?: Size; icon?: IconName; iconRight?: IconName; className?: string; children?: React.ReactNode };

export function Button({
  variant = "glass", size = "md", icon, iconRight, className, children, onClick, ...rest
}: Common & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const fb = useFeedback();
  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      onClick={(e) => {
        fb.tap();
        onClick?.(e);
      }}
      {...rest}
    >
      {icon && <Icon name={icon} className="size-[1.15em]" />}
      {children}
      {iconRight && <Icon name={iconRight} className="size-[1.15em]" />}
    </button>
  );
}

export function LinkButton({
  href, variant = "glass", size = "md", icon, iconRight, className, children, ...rest
}: Common & { href: string } & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href">) {
  return (
    <Link href={href} className={cn(base, variants[variant], sizes[size], className)} {...rest}>
      {icon && <Icon name={icon} className="size-[1.15em]" />}
      {children}
      {iconRight && <Icon name={iconRight} className="size-[1.15em]" />}
    </Link>
  );
}
