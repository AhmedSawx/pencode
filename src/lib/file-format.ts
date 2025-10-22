import type { Project } from '@/mocks/types';

const MAGIC_NUMBER = 'PENCODE1';
const CURRENT_VERSION = 1;
const XOR_KEY = 'pencode'; // A simple key for obfuscation

/**
 * Applies a simple XOR obfuscation to the data.
 * @param data The data to obfuscate.
 * @param key The key to use for XORing.
 * @returns The obfuscated data.
 */
function xor(data: Uint8Array, key: string): Uint8Array {
  const keyBytes = new TextEncoder().encode(key);
  const result = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) {
    result[i] = data[i] ^ keyBytes[i % keyBytes.length];
  }
  return result;
}

// These helpers are now public because they are needed in projects.ts
export function uint8ArrayToBase64(bytes: Uint8Array): string {
  if (typeof window !== 'undefined' && typeof window.btoa === 'function') {
    // Browser environment
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  } else {
    // Node.js or other environments with Buffer
    return Buffer.from(bytes).toString('base64');
  }
}

export function base64ToUint8Array(base64: string): Uint8Array {
  if (typeof window !== 'undefined' && typeof window.atob === 'function') {
    // Browser environment
    const binary_string = window.atob(base64);
    const len = binary_string.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes;
  } else {
    // Node.js or other environments with Buffer
    const buf = Buffer.from(base64, 'base64');
    return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
  }
}

/**
 * Encodes a project object into a structured, obfuscated binary format (.pencode).
 * @param project The project object.
 * @returns A Uint8Array representing the binary data.
 */
export function encodeProject(project: Project): Uint8Array {
  const encoder = new TextEncoder();

  // 1. Prepare metadata
  const metadata = {
    id: project.id,
    title: project.title,
    canvasSize: project.canvasSize,
    createdAt: project.createdAt,
    lastModified: project.lastModified,
    status: project.status,
  };
  let metadataBytes = encoder.encode(JSON.stringify(metadata));
  metadataBytes = xor(metadataBytes, XOR_KEY); // Obfuscate

  // 2. Prepare code
  let codeBytes = project.code ? encoder.encode(project.code) : new Uint8Array(0);
  if (codeBytes.length > 0) {
    codeBytes = xor(codeBytes, XOR_KEY); // Obfuscate
  }

  // 3. Prepare image data (not obfuscated)
  const imageBytes = project.canvasImage ? base64ToUint8Array(project.canvasImage) : new Uint8Array(0);

  // 4. Calculate total size and create buffer
  const totalSize =
    8 + // Magic number
    4 + // Metadata length
    metadataBytes.length +
    4 + // Code length
    codeBytes.length +
    4 + // Image length
    imageBytes.length;

  const buffer = new ArrayBuffer(totalSize);
  const view = new DataView(buffer);
  let offset = 0;

  // 5. Write all parts to the buffer
  const magicBytes = encoder.encode(MAGIC_NUMBER);
  magicBytes.forEach((byte, i) => view.setUint8(offset + i, byte));
  offset += 8;

  view.setUint32(offset, metadataBytes.length, true); offset += 4;
  new Uint8Array(buffer, offset).set(metadataBytes); offset += metadataBytes.length;

  view.setUint32(offset, codeBytes.length, true); offset += 4;
  new Uint8Array(buffer, offset).set(codeBytes); offset += codeBytes.length;

  view.setUint32(offset, imageBytes.length, true); offset += 4;
  new Uint8Array(buffer, offset).set(imageBytes); offset += imageBytes.length;

  return new Uint8Array(buffer);
}

/**
 * Decodes the V1 structured binary format.
 * @param data The binary data as a Uint8Array.
 * @returns The parsed project object.
 */
function decodeBinaryV1(data: Uint8Array): Project {
  const decoder = new TextDecoder();
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  let offset = 0;

  // 1. Read and verify magic number & version
  const magic = decoder.decode(data.subarray(offset, 8)); offset += 8;
  const version = parseInt(magic.substring(7), 10);
  if (version > CURRENT_VERSION) {
    throw new Error(`File version ${version} is newer than the application's supported version ${CURRENT_VERSION}. Please update the application.`);
  }

  // 2. Read and de-obfuscate metadata
  const metadataLength = view.getUint32(offset, true); offset += 4;
  let metadataBytes = data.subarray(offset, offset + metadataLength);
  metadataBytes = xor(metadataBytes, XOR_KEY); // De-obfuscate
  const metadata = JSON.parse(decoder.decode(metadataBytes));
  offset += metadataLength;

  // 3. Read and de-obfuscate code
  const codeLength = view.getUint32(offset, true); offset += 4;
  let codeBytes = data.subarray(offset, offset + codeLength);
  if (codeBytes.length > 0) {
    codeBytes = xor(codeBytes, XOR_KEY); // De-obfuscate
  }
  const code = decoder.decode(codeBytes);
  offset += codeLength;

  // 4. Read image (not obfuscated)
  const imageLength = view.getUint32(offset, true); offset += 4;
  const imageBytes = data.subarray(offset, offset + imageLength);
  const canvasImage = imageBytes.length > 0 ? uint8ArrayToBase64(imageBytes) : undefined;

  // 5. Reconstruct project object
  return {
    ...metadata,
    code,
    canvasImage,
    hasUnsavedChanges: false, // A loaded project is considered saved
  };
}

/**
 * Decodes a .pencode file, handling both the new binary format and the legacy JSON format.
 * @param data The binary data of the file as a Uint8Array.
 * @returns The parsed project object.
 */
export function decodePencodeFile(data: Uint8Array): Project {
  const decoder = new TextDecoder();
  // Use subarray to avoid decoding the whole file if it's huge
  const magic = decoder.decode(data.subarray(0, 8));

  if (magic.startsWith('PENCODE')) {
    // This is a new format file
    return decodeBinaryV1(data);
  } else {
    // This is likely an old format file (plain JSON)
    try {
      const jsonString = decoder.decode(data);
      return JSON.parse(jsonString) as Project;
    } catch (e) {
      throw new Error('Invalid file format. File is not a Pencode project.');
    }
  }
}

/**
 * Encodes a project object into a JSON string for localStorage.
 * @param project The project object.
 * @returns A JSON string.
 */
export function encodeProjectToJSON(project: Project): string {
    return JSON.stringify(project);
}

/**
 * Decodes a JSON string from localStorage back into a project object.
 * @param jsonString The JSON string from storage.
 * @returns The parsed project object.
 */
export function decodeProjectFromJSON(jsonString: string): Project {
    return JSON.parse(jsonString) as Project;
}
