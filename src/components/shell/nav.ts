import type { IconName } from "@/components/ui/Icon";

export const NAV: { href: string; key: string; icon: IconName }[] = [
  { href: "/", key: "home", icon: "Home" },
  { href: "/discover", key: "discover", icon: "Search" },
  { href: "/learn", key: "learn", icon: "BookOpen" },
  { href: "/jobs", key: "jobs", icon: "Briefcase" },
  { href: "/parchi", key: "parchi", icon: "IdCard" },
  { href: "/profile", key: "profile", icon: "User" },
];

export function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");
}
