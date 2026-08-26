export const elementosCarta = [
  {
    value: "natureza",
    label: "Natureza",
    cor: "#7ee757",
    icone:
      "https://res.cloudinary.com/djqmayaj1/image/upload/v1786518103/natureza_nuhlgx.png",
  },
  {
    value: "agua",
    label: "Água",
    cor: "#38bdf8",
    icone:
      "https://res.cloudinary.com/djqmayaj1/image/upload/v1786518114/agua_u51lna.png",
  },
  {
    value: "fogo",
    label: "Fogo",
    cor: "#ef4444",
    icone:
      "https://res.cloudinary.com/djqmayaj1/image/upload/v1786518110/fogo_oubwzz.png",
  },
  {
    value: "sombra",
    label: "Sombra",
    cor: "#a855f7",
    icone:
      "https://res.cloudinary.com/djqmayaj1/image/upload/v1786518118/sombra_tuwmrr.png",
  },
  {
    value: "luz",
    label: "Luz",
    cor: "#facc15",
    icone:
      "https://res.cloudinary.com/djqmayaj1/image/upload/v1786518124/Luz_om7cht.png",
  },
] as const;

export type ElementoCarta = (typeof elementosCarta)[number]["value"];

export function obterElementoCarta(value: string) {
  return elementosCarta.find((elemento) => elemento.value === value);
}
