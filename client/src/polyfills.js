import { Buffer } from 'buffer';
import process from 'process';

if (!globalThis.global) {
  globalThis.global = globalThis;
}

if (!globalThis.Buffer) {
  globalThis.Buffer = Buffer;
}

if (!globalThis.process) {
  globalThis.process = process;
}
