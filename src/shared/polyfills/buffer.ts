import { Buffer } from "buffer";

const globalWithBuffer = globalThis as typeof globalThis & {
  Buffer?: typeof Buffer;
};

if (!globalWithBuffer.Buffer) {
  globalWithBuffer.Buffer = Buffer;
  console.info("[polyfill] Attached Buffer polyfill from 'buffer/' package.");
} else {
  console.info("[polyfill] Native Buffer available; polyfill not applied.");
}

export {};
