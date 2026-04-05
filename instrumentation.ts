// Corrige o localStorage experimental do Node.js 25 que é detectado
// pelo Next.js mas não tem os métodos implementados corretamente.
export async function register() {
  if (
    typeof globalThis.localStorage !== "undefined" &&
    typeof globalThis.localStorage.getItem !== "function"
  ) {
    Object.defineProperty(globalThis, "localStorage", {
      value: {
        getItem: (_key: string) => null,
        setItem: (_key: string, _value: string) => {},
        removeItem: (_key: string) => {},
        clear: () => {},
        key: (_index: number) => null,
        length: 0,
      },
      writable: true,
      configurable: true,
    });
  }
}
