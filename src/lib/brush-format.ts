import type { Brush } from '@/mocks/types';

const MAGIC_NUMBER = 'PENBRSH1';
const XOR_KEY = 'pencode-brush'; // A different key to avoid any mix-ups

/**
 * Applies a simple XOR obfuscation to the data.
 */
function xor(data: Uint8Array, key: string): Uint8Array {
  const keyBytes = new TextEncoder().encode(key);
  const result = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) {
    result[i] = data[i] ^ keyBytes[i % keyBytes.length];
  }
  return result;
}

/**
 * Encodes a brush object into a structured, obfuscated binary format (.penbrush).
 * @param brush The brush object.
 * @returns A Uint8Array representing the binary data.
 */
export function encodePenbrush(brush: Brush): Uint8Array {
  const encoder = new TextEncoder();

  // 1. Prepare data by turning the whole object into a JSON string
  let dataBytes = encoder.encode(JSON.stringify(brush));
  dataBytes = xor(dataBytes, XOR_KEY); // Obfuscate

  // 2. Calculate total size and create buffer
  const totalSize =
    8 + // Magic number
    4 + // Data length
    dataBytes.length;

  const buffer = new ArrayBuffer(totalSize);
  const view = new DataView(buffer);
  let offset = 0;

  // 3. Write all parts to the buffer
  const magicBytes = encoder.encode(MAGIC_NUMBER);
  magicBytes.forEach((byte, i) => view.setUint8(offset + i, byte));
  offset += 8;

  view.setUint32(offset, dataBytes.length, true); // Write data length
  offset += 4;
  new Uint8Array(buffer, offset).set(dataBytes); // Write data block

  return new Uint8Array(buffer);
}

/**
 * Decodes a .penbrush file.
 * @param data The binary data of the file as a Uint8Array.
 * @returns The parsed brush object.
 */
export function decodePenbrush(data: Uint8Array): Brush {
  const decoder = new TextDecoder();
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  let offset = 0;

  // 1. Read and verify magic number & version
  const magic = decoder.decode(data.subarray(offset, 8));
  offset += 8;
  if (magic !== MAGIC_NUMBER) {
    throw new Error('Invalid file format. Not a valid .penbrush file.');
  }

  // 2. Read and de-obfuscate data
  const dataLength = view.getUint32(offset, true);
  offset += 4;
  let dataBytes = data.subarray(offset, offset + dataLength);
  dataBytes = xor(dataBytes, XOR_KEY); // De-obfuscate
  const brush = JSON.parse(decoder.decode(dataBytes)) as Brush;

  return brush;
}
