import {
  Film,
  Palette,
  Sparkles,
  Layers,
  Code2,
  Compass,
  Camera,
  Pen,
  Brush,
  Megaphone,
  Lightbulb,
  Globe,
  Smartphone,
  Box,
  Image as ImageIcon,
  Music,
  Wand2,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

/**
 * Curated list of icons available for the Services CMS.
 * Adding to this list extends the icon picker; the string key is what's stored in the DB.
 */
export const SERVICE_ICONS: Record<string, LucideIcon> = {
  Palette,
  Film,
  Sparkles,
  Layers,
  Code2,
  Compass,
  Camera,
  Pen,
  Brush,
  Megaphone,
  Lightbulb,
  Globe,
  Smartphone,
  Box,
  Image: ImageIcon,
  Music,
  Wand2,
  TrendingUp,
};

export const SERVICE_ICON_NAMES = Object.keys(SERVICE_ICONS);

export function getServiceIcon(name: string): LucideIcon {
  return SERVICE_ICONS[name] ?? Sparkles;
}
