globalThis.print = function print(...args: unknown[]) {
  if (args.length === 0) return;
  if (args.length === 1) {
    const [value] = args;
    console.log(typeof value === 'string' ? value : JSON.stringify(value, null, 2));
    return;
  }
  const [label, value] = args;
  console.log(label, JSON.stringify(value, null, 2));
};
