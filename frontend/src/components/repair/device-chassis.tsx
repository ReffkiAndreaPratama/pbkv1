import { CheckCircle2, Eye, ListChecks } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RepairComponentState, RepairDeviceType } from "@/lib/types";
import { componentIcon } from "./component-icons";
import { LAPTOP_SPOTS, PC_SPOTS, type ChassisSpot } from "./chassis-layout";

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

  const renderSpot = (spot: ChassisSpot) => {
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
      <div className="chassis-stage">
        <span className="chassis-stage-badge" aria-hidden>
          {isLaptop ? "UNIT · LAPTOP / BOTTOM VIEW" : "UNIT · ATX TOWER / SIDE PANEL OFF"}
        </span>

        {isLaptop ? (
          <div className="laptop-chassis">
            <div className="laptop-lid">
              <div className="laptop-screen">
                <div className="laptop-screen-ui" aria-hidden>
                  <span className="laptop-screen-brand">TECHTUTOR // SERVICE UNIT</span>
                  <span className="laptop-screen-off">NO SIGNAL</span>
                  <span className="laptop-screen-standby">
                    <i /> panel standby
                  </span>
                </div>
                <div className="laptop-screen-glow" aria-hidden />
              </div>
              <span className="laptop-camera-dot" aria-hidden />
              {spots.filter((s) => s.region === "lid").map(renderSpot)}
            </div>

            <div className="laptop-hinge" aria-hidden>
              <span />
              <span />
            </div>

            <div className="laptop-base">
              <div className="laptop-deck" aria-hidden />
              <div className="laptop-keyboard-grid" aria-hidden />
              <span className="laptop-speaker-dots is-left" aria-hidden />
              <span className="laptop-speaker-dots is-right" aria-hidden />
              {spots.filter((s) => s.region === "base").map(renderSpot)}
            </div>

            <div className="laptop-internals">
              <div className="laptop-internals-head">
                <span className="laptop-internals-label">Panel bawah — cover dilepas</span>
                <span className="laptop-internals-tag">BOTTOM VIEW</span>
              </div>
              <div className="laptop-internals-stage">
                <div className="laptop-pcb" aria-hidden />
                <span className="laptop-heatpipe" aria-hidden />
                {spots.filter((s) => s.region === "internals").map(renderSpot)}
              </div>
            </div>
          </div>
        ) : (
          <div className="pc-chassis">
            <div className="pc-tower">
              <span className="pc-glass" aria-hidden />
              <span className="pc-rgb" aria-hidden />
              <div className="pc-front" aria-hidden>
                <span className="pc-power-led" />
                <span className="pc-drive-bay" />
                <span className="pc-drive-bay" />
                <span className="pc-usb-slot" />
                <span className="pc-usb-slot" />
                <span className="pc-vent" />
              </div>
              <span className="pc-shroud" aria-hidden />
              <span className="pc-grommet" aria-hidden />
              <span className="pc-screw" style={{ left: "4%", top: "4%" }} aria-hidden />
              <span className="pc-screw" style={{ right: "24%", top: "4%" }} aria-hidden />
              <span className="pc-screw" style={{ left: "4%", bottom: "4%" }} aria-hidden />
              <span className="pc-screw" style={{ right: "24%", bottom: "4%" }} aria-hidden />
              {spots.filter((s) => s.region === "tower").map(renderSpot)}
              <span className="pc-floor-glow" aria-hidden />
            </div>
          </div>
        )}

        <span className="chassis-stage-floor" aria-hidden />
      </div>

      {unplaced.length > 0 && (
        <div className="chassis-tray">
          <span className="chassis-tray-label">
            Periferal &amp; kabel di meja <em>{unplaced.length}</em>
          </span>
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

      {/* Di layar kecil hotspot bisa terlalu kecil untuk disentuh; sediakan daftar
          komponen yang bisa diketuk dan otomatis menggulir ke panel diagnosis. */}
      <details className="chassis-mobile-list lg:hidden">
        <summary>
          <span className="chassis-mobile-summary">
            <ListChecks aria-hidden /> Daftar komponen
          </span>
          <span className="chassis-mobile-count">
            {handled}/{components.length} beres
          </span>
        </summary>
        <div className="chassis-mobile-grid">
          {components.map((component) => {
            const Icon = componentIcon(component);
            const selected = component.key === selectedKey;
            return (
              <button
                key={component.key}
                type="button"
                disabled={disabled}
                onClick={() => onSelect(component.key)}
                aria-pressed={selected}
                className={cn(
                  "chassis-mobile-item",
                  selected && "is-selected",
                  component.fixed && "is-fixed",
                  !component.fixed && component.inspected && "is-inspected"
                )}
              >
                <span className="chassis-mobile-icon">
                  <Icon aria-hidden />
                </span>
                <span className="chassis-mobile-name">{component.name}</span>
                {component.fixed ? (
                  <CheckCircle2 className="chassis-mobile-badge is-done" aria-label="sudah diperbaiki" />
                ) : component.inspected ? (
                  <Eye className="chassis-mobile-badge is-seen" aria-label="sudah diinspeksi" />
                ) : null}
              </button>
            );
          })}
        </div>
      </details>
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
  spot: ChassisSpot;
  selected: boolean;
  disabled: boolean;
  onSelect: () => void;
}) {
  const Icon = componentIcon(component);
  const compact = spot.compact ?? (spot.w < 12 || spot.h < 10);
  const spinning = component.slot.includes("fan");
  const status = component.fixed ? "fixed" : component.inspected ? "inspected" : "untouched";

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
      data-component={component.slot}
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
      {spinning && <span className="chassis-hotspot-fan" aria-hidden />}
      <span className="chassis-hotspot-icon">
        <Icon />
      </span>
      {!compact && <span className="chassis-hotspot-label">{component.name}</span>}
      <span className={cn("chassis-hotspot-led", `is-${status}`)} aria-hidden />
      {component.fixed ? (
        <CheckCircle2 className="chassis-hotspot-badge is-done" />
      ) : component.inspected ? (
        <Eye className="chassis-hotspot-badge is-seen" />
      ) : null}
      {selected && (
        <>
          <span className="chassis-corner is-tl" aria-hidden />
          <span className="chassis-corner is-tr" aria-hidden />
          <span className="chassis-corner is-bl" aria-hidden />
          <span className="chassis-corner is-br" aria-hidden />
        </>
      )}
    </button>
  );
}
