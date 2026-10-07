import {
  ArrowLeft, ArrowRight, BadgeCheck, BookOpen, Briefcase, Building2, Check, ChefHat, ChevronRight, CircleAlert,
  CircleEllipsis, Clock, CookingPot, Flag, Globe, GraduationCap, Hammer, HandHelping, HeartHandshake, Home, IdCard,
  Keyboard, Languages, LayoutGrid, Mic, MicOff, MapPin, MessageCircle, Monitor, Package, Palette, Pause, Play, Plus,
  Printer, QrCode, Scale, Scissors, Search, Send, Settings, ShieldAlert, ShieldCheck, Sparkles, Sprout, Star, Store,
  Sun, Moon, Timer, Trash2, User, Users, Volume2, VolumeX, Wallet, Wheat, Wrench, X, Zap, Accessibility, Bell,
  CalendarClock, Route, LogOut, FileText, Eye, Navigation, Filter, RotateCcw, Phone, Award, Lock,
  type LucideIcon, type LucideProps,
} from "lucide-react";

/** Curated icon registry: keeps the bundle small and lets data refer to icons by name. */
export const ICONS = {
  ArrowLeft, ArrowRight, BadgeCheck, BookOpen, Briefcase, Building2, Check, ChefHat, ChevronRight, CircleAlert,
  CircleEllipsis, Clock, CookingPot, Flag, Globe, GraduationCap, Hammer, HandHelping, HeartHandshake, Home, IdCard,
  Keyboard, Languages, LayoutGrid, Mic, MicOff, MapPin, MessageCircle, Monitor, Package, Palette, Pause, Play, Plus,
  Printer, QrCode, Scale, Scissors, Search, Send, Settings, ShieldAlert, ShieldCheck, Sparkles, Sprout, Star, Store,
  Sun, Moon, Timer, Trash2, User, Users, Volume2, VolumeX, Wallet, Wheat, Wrench, X, Zap, Accessibility, Bell,
  CalendarClock, Route, LogOut, FileText, Eye, Navigation, Filter, RotateCcw, Phone, Award, Lock,
} satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof ICONS;

export function Icon({ name, ...props }: { name: IconName | string } & LucideProps) {
  const C = (ICONS as Record<string, LucideIcon>)[name] ?? CircleEllipsis;
  return <C strokeWidth={1.5} aria-hidden {...props} />;
}
