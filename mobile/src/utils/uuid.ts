export const newId = (): string => {
  if (typeof globalThis !== "undefined" && typeof globalThis.crypto !== "undefined") {
    if ("randomUUID" in globalThis.crypto && typeof globalThis.crypto.randomUUID === "function") {
      return globalThis.crypto.randomUUID();
    }
    if (typeof globalThis.crypto.getRandomValues === "function") {
      const bytes = new Uint8Array(16);
      globalThis.crypto.getRandomValues(bytes);
      return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
    }
  }
  return `id-${Math.random().toString(36).slice(2, 10)}-${Date.now()}`;
};
