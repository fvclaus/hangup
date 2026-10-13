declare global {
  interface Window {
    gtag: (
      command: string,
      action: string,
      params?: { [key: string]: unknown },
    ) => void;
  }
}

export {};
