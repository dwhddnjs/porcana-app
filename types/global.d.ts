export {};

declare global {
  function print(label: unknown, value: unknown): void;
  function print(value: unknown): void;
}
