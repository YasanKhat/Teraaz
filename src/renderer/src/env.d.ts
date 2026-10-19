/// <reference types="vite/client" />

declare module 'topojson-client' {
  export function feature(topology: unknown, object: unknown): any
  export function mesh(topology: unknown, object: unknown): any
}

declare module 'world-atlas/countries-110m.json' {
  const value: any
  export default value
}
