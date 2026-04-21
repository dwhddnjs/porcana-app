const safeStringify = (value: unknown): string => {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

globalThis.print = function print(...args: unknown[]) {
  if (!__DEV__) return;
  if (args.length === 0) return;
  if (args.length === 1) {
    const [value] = args;
    console.log(typeof value === 'string' ? value : safeStringify(value));
    return;
  }
  const [label, value] = args;
  console.log(label, safeStringify(value));
};
