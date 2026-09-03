declare global {
  interface RequestInit {
    body?: globalThis.BodyInit | null | undefined;
  }
}

export {};
