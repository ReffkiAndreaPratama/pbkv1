// Posisi hotspot chassis (persen terhadap panggung masing-masing region).
// Dipisah dari komponen React supaya bisa dipakai juga oleh test integritas seed.

export type ChassisRegion = "tower" | "lid" | "base" | "internals";

export interface ChassisSpot {
  slot: string;
  region: ChassisRegion;
  x: number;
  y: number;
  w: number;
  h: number;
  layer?: number;
  compact?: boolean;
  /** Komponen besar yang jadi latar (mobo/lcd): label & ikon di pojok. */
  backdrop?: boolean;
}

export const PC_SPOTS: ChassisSpot[] = [
  { slot: "mobo", region: "tower", x: 6, y: 9, w: 58, h: 61, layer: 1, backdrop: true },
  { slot: "cpu", region: "tower", x: 19, y: 21, w: 17, h: 15 },
  { slot: "fan", region: "tower", x: 19, y: 38, w: 17, h: 14 },
  { slot: "ram", region: "tower", x: 40, y: 15, w: 9, h: 30, compact: true },
  { slot: "cmos", region: "tower", x: 41, y: 51, w: 10, h: 8, compact: true },
  { slot: "gpu", region: "tower", x: 12, y: 55, w: 46, h: 12 },
  { slot: "nic", region: "tower", x: 12, y: 70, w: 19, h: 9 },
  { slot: "psu", region: "tower", x: 5, y: 82, w: 35, h: 14 },
  { slot: "cable_power", region: "tower", x: 43, y: 84, w: 16, h: 10, compact: true },
  { slot: "power_button", region: "tower", x: 76, y: 5, w: 15, h: 8, compact: true },
  { slot: "usb_port", region: "tower", x: 76, y: 16, w: 15, h: 8, compact: true },
  { slot: "cable_usb", region: "tower", x: 68, y: 28, w: 27, h: 8, compact: true },
  { slot: "cable_display", region: "tower", x: 68, y: 39, w: 27, h: 8, compact: true },
  { slot: "cable_lan", region: "tower", x: 68, y: 50, w: 27, h: 8, compact: true },
  { slot: "cable_data", region: "tower", x: 68, y: 61, w: 27, h: 8, compact: true },
  { slot: "cable_sata_power", region: "tower", x: 68, y: 72, w: 27, h: 8, compact: true },
  { slot: "hdd", region: "tower", x: 68, y: 83, w: 27, h: 11 },
];

export const LAPTOP_SPOTS: ChassisSpot[] = [
  // Lid / layar
  { slot: "lcd", region: "lid", x: 9, y: 10, w: 82, h: 74, layer: 1, backdrop: true },
  { slot: "webcam", region: "lid", x: 44, y: 2, w: 12, h: 9, compact: true },
  { slot: "lcd_cable", region: "lid", x: 44, y: 86, w: 12, h: 11, compact: true },
  { slot: "hinge", region: "lid", x: 8, y: 86, w: 13, h: 11, compact: true },
  // Base / dek keyboard
  { slot: "laptop_keyboard", region: "base", x: 7, y: 8, w: 62, h: 54, layer: 1 },
  { slot: "touchpad", region: "base", x: 28, y: 67, w: 19, h: 25 },
  { slot: "speaker", region: "base", x: 7, y: 68, w: 15, h: 23, compact: true },
  { slot: "power_button", region: "base", x: 77, y: 9, w: 13, h: 19, compact: true },
  { slot: "usb_port", region: "base", x: 78, y: 35, w: 13, h: 17, compact: true },
  { slot: "dc_jack", region: "base", x: 92, y: 12, w: 7, h: 24, compact: true },
  // Panel bawah (cover dilepas)
  { slot: "mobo", region: "internals", x: 0, y: 0, w: 100, h: 100, layer: 1, backdrop: true },
  { slot: "battery", region: "internals", x: 2, y: 12, w: 24, h: 76 },
  { slot: "ram_sodimm", region: "internals", x: 28, y: 12, w: 9, h: 76, compact: true },
  { slot: "ssd", region: "internals", x: 39, y: 12, w: 9, h: 76, compact: true },
  { slot: "keyboard_ribbon", region: "internals", x: 50, y: 12, w: 8, h: 76, compact: true },
  { slot: "touchpad_ribbon", region: "internals", x: 60, y: 12, w: 8, h: 76, compact: true },
  { slot: "laptop_fan", region: "internals", x: 70, y: 12, w: 10, h: 76, compact: true },
  { slot: "thermal_paste", region: "internals", x: 82, y: 12, w: 7, h: 36, compact: true },
  { slot: "wifi_card", region: "internals", x: 82, y: 54, w: 7, h: 34, compact: true },
  { slot: "wifi_antenna", region: "internals", x: 91, y: 12, w: 7, h: 36, compact: true },
];

/** Slot PC yang sengaja diletakkan di baki meja, bukan di chassis. */
export const PC_TRAY_SLOTS = ["monitor", "keyboard", "printer", "mouse", "router"] as const;

/** Slot laptop yang sengaja diletakkan di baki meja. */
export const LAPTOP_TRAY_SLOTS = ["charger", "router"] as const;
