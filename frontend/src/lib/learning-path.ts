import { useCallback, useEffect, useState } from "react";

export type Jalur = "PC" | "Laptop";

const STORAGE_KEY = "techtutor:jalur";
const EVENT = "techtutor:jalur-change";

function read(): Jalur {
  if (typeof window === "undefined") return "PC";
  return (window.localStorage.getItem(STORAGE_KEY) as Jalur) || "PC";
}

export function useJalur() {
  const [jalur, setJalurState] = useState<Jalur>(read);

  useEffect(() => {
    const sync = () => setJalurState(read());
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const setJalur = useCallback((next: Jalur) => {
    window.localStorage.setItem(STORAGE_KEY, next);
    window.dispatchEvent(new Event(EVENT));
  }, []);

  return { jalur, setJalur };
}

export function getJalur(): Jalur {
  return read();
}

export function setJalur(next: Jalur) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, next);
  window.dispatchEvent(new Event(EVENT));
}

export function hasChosenJalur(): boolean {
  if (typeof window === "undefined") return false;
  return !!window.localStorage.getItem(STORAGE_KEY);
}

export function jalurLabel(jalur: Jalur) {
  return jalur === "PC" ? "Troubleshooting PC" : "Troubleshooting Laptop";
}