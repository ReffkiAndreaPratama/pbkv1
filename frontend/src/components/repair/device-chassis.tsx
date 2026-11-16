import { CheckCircle2, Eye, Laptop, MonitorCog, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RepairComponentState, RepairDeviceType } from "@/lib/types";
import { componentIcon } from "./component-icons";

type Region = "tower" | "lid" | "base" | "internals";

interface Spot {
  slot: string;
  region: Region;
  x: number;
  y: number;
  w: number;
  h: number;
  layer?: number;
  compact?: boolean;
  /** Komponen besar yang jadi latar (mobo/lcd): label & ikon di pojok. */
  backdrop?: boolean;
}

// Posisi dalam persen terhadap panggung (stage) masing-masing.
const PC_SPOTS: Spot[] = [
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

const LAPTOP_SPOTS: Spot[] = [
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

interface DeviceChassisProps {
  deviceType: RepairDeviceType;
  components: RepairComponentState[];
  selectedKey: string | null;
  disabled: boolean;
  onSelect: (key: string) => void;
}

export function DeviceChassis({ deviceType, components, selectedKey, disabled, onSelect }: DeviceChassisProps) {
  const isLaptop = deviceType === "LAPTOP";
  const spots = isLaptop ? LAPTOP_SPOTS : PC_SPOTS;
  const placedSlots = new Set(spots.map((s) => s.slot));
  const bySlot = new Map(components.map((c) => [c.slot, c]));
  const unplaced = components.filter((c) => !placedSlots.has(c.slot));
  const handled = components.filter((c) => c.fixed).length;

  const renderSpot = (spot: Spot) => {
    const component = bySlot.get(spot.slot);
    if (!component) return null;
    return (
      <Hotspot
        key={spot.slot}
        component={component}
        spot={spot}
        selected={component.key === selectedKey}
        disabled={disabled}
        onSelect={() => onSelect(component.key)}
      />
    );
  };

  return (
    <div className={cn("device-chassis", isLaptop ? "is-laptop" : "is-pc")}>
      <div className="chassis-toolbar">
        <span className="chassis-device-tag">
          {isLaptop ? <Laptop className="h-3.5 w-3.5" /> : <MonitorCog className="h-3.5 w-3.5" />}
          {isLaptop ? "Laptop" : "PC Tower"}
        </span>
        <span className="chassis-progress-tag">
          <Wrench className="h-3 w-3" /> {handled}/{components.length} komponen beres
        </span>
      </div>

      {isLaptop ? (
        <div className="laptop-chassis">
          <div className="laptop-lid">
            <div className="laptop-screen">
              <div className="laptop-screen-glow" />
              <span className="laptop-screen-hint">Troubleshooting Mode</span>
            </div>
            <span className="laptop-camera-dot" />
            {spots.filter((s) => s.region === "lid").map(renderSpot)}
          </div>
          <div className="laptop-hinge" />
          <div className="laptop-base">
            <div className="laptop-deck" />
            <div className="laptop-keyboard-grid" aria-hidden />
            {spots.filter((s) => s.region === "base").map(renderSpot)}
          </div>
          <div className="laptop-internals">
            <span className="laptop-internals-label">Panel bawah — cover dilepas</span>
            <div className="laptop-internals-stage">
              <div className="laptop-pcb" aria-hidden />
              {spots.filter((s) => s.region === "internals").map(renderSpot)}
            </div>
          </div>
        </div>
      ) : (
        <div className="pc-chassis">
          <div className="pc-tower">
            <div className="pc-front" aria-hidden>
              <span className="pc-power-led" />
              <span className="pc-drive-bay" />
              <span className="pc-drive-bay" />
              <span className="pc-vent" />
            </div>
            <div className="pc-mobo" aria-hidden />
            <span className="pc-screw" style={{ left: "4%", top: "4%" }} aria-hidden />
            <span className="pc-screw" style={{ right: "24%", top: "4%" }} aria-hidden />
            <span className="pc-screw" style={{ left: "4%", bottom: "4%" }} aria-hidden />
            <span className="pc-screw" style={{ right: "24%", bottom: "4%" }} aria-hidden />
            {spots.filter((s) => s.region === "tower").map(renderSpot)}
          </div>
        </div>
      )}

      {unplaced.length > 0 && (
        <div className="chassis-tray">
          <span className="chassis-tray-label">Periferal & kabel di meja</span>
          <div className="chassis-tray-list">
            {unplaced.map((component) => {
              const Icon = componentIcon(component);
              const selected = component.key === selectedKey;
              return (
                <button
                  key={component.key}
                  type="button"
                  disabled={disabled}
                  onClick={() => onSelect(component.key)}
                  title={component.name}
                  aria-pressed={selected}
                  className={cn(
                    "chassis-tray-item",
                    selected && "is-selected",
                    component.fixed && "is-fixed",
                    !component.fixed && component.inspected && "is-inspected"
                  )}
                >
                  <span className="chassis-tray-icon">
                    <Icon />
                  </span>
                  <span className="chassis-tray-name">{component.name}</span>
                  {component.fixed ? (
                    <CheckCircle2 className="chassis-tray-badge is-done" />
                  ) : component.inspected ? (
                    <Eye className="chassis-tray-badge is-seen" />
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function Hotspot({
  component,
  spot,
  selected,
  disabled,
  onSelect,
}: {
  component: RepairComponentState;
  spot: Spot;
  selected: boolean;
  disabled: boolean;
  onSelect: () => void;
}) {
  const Icon = componentIcon(component);
  const compact = spot.compact ?? (spot.w < 12 || spot.h < 10);
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      title={`${component.name} — ${
        component.fixed ? "sudah diperbaiki" : component.inspected ? "sudah diinspeksi" : "belum dicek"
      }`}
      aria-label={component.name}
      aria-pressed={selected}
      className={cn(
        "chassis-hotspot",
        compact && "is-compact",
        spot.backdrop && "is-backdrop",
        selected && "is-selected",
        component.fixed && "is-fixed",
        !component.fixed && component.inspected && "is-inspected"
      )}
      style={{
        left: `${spot.x}%`,
        top: `${spot.y}%`,
        width: `${spot.w}%`,
        height: `${spot.h}%`,
        zIndex: (spot.layer ?? 2) + (selected ? 6 : 0),
      }}
    >
      <span className="chassis-hotspot-icon">
        <Icon />
      </span>
      {!compact && <span className="chassis-hotspot-label">{component.name}</span>}
      {component.fixed ? (
        <CheckCircle2 className="chassis-hotspot-badge is-done" />
      ) : component.inspected ? (
        <Eye className="chassis-hotspot-badge is-seen" />
      ) : null}
    </button>
  );
}
