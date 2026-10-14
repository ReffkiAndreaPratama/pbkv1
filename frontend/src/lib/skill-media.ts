const SKILL_IMAGES: Record<string, string> = {
  POWER: "/materials/power.jpg",
  BOOT: "/materials/boot.jpg",
  NETWORK: "/materials/network.jpg",
  STORAGE: "/materials/storage.jpg",
  DISPLAY: "/materials/display.jpg",
  PERIPHERAL: "/materials/peripheral.jpg",
};

export const SKILL_ORDER = ["POWER", "BOOT", "NETWORK", "STORAGE", "DISPLAY", "PERIPHERAL"];

export function skillImageUrl(code: string): string {
  return SKILL_IMAGES[code] ?? "/images/hero.jpg";
}