type CssModule = Readonly<Record<string, string>>;

export function combinarEstilos(
  ...modulos: CssModule[]
): Record<string, string> {
  const res: Record<string, string> = {};

  for (const modulo of modulos) {
    for (const [classe, valor] of Object.entries(modulo)) {
      const valores = `${res[classe] ?? ""} ${valor}`.trim().split(/\s+/);
      res[classe] = Array.from(new Set(valores)).join(" ");
    }
  }

  return res;
}
