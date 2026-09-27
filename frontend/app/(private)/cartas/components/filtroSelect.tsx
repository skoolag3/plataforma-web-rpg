import Image from "next/image";
import { Gem, Shapes, Shield, SlidersHorizontal } from "lucide-react";

import { SelectPadrao } from "../../../components/ui/controlesFormulario";
import { obterElementoCarta } from "../../../components/elementosCarta";

type FiltroSelectProps = {
  rotulo: string;
  valor: string;
  opcoes: string[];
  aoAlterar: (valor: string) => void;
};

function IconeFiltro({ rotulo, valor }: { rotulo: string; valor: string }) {
  const elemento = obterElementoCarta(valor);
  const Icone =
    rotulo === "Raridade"
      ? Gem
      : rotulo === "Classe"
        ? Shield
        : valor === "Todos" || valor === "Todas"
          ? SlidersHorizontal
          : Shapes;

  return elemento ? (
    <Image src={elemento.icone} width={18} height={18} alt="" />
  ) : (
    <Icone strokeWidth={2.25} aria-hidden="true" />
  );
}

function obterCorFiltro(rotulo: string, valor: string) {
  const elemento = obterElementoCarta(valor);
  if (elemento) return elemento.cor;
  if (rotulo !== "Raridade") return undefined;
  const coresRaridade: Record<string, string> = {
    UR: "#e879f9",
    SSR: "#facc15",
    SR: "#67e8f9",
    R: "#a78bfa",
    N: "#94a3b8",
  };
  return coresRaridade[valor];
}

export function FiltroSelect({
  rotulo,
  valor,
  opcoes,
  aoAlterar,
}: FiltroSelectProps) {
  return (
    <SelectPadrao
      rotulo={rotulo}
      placeholder={rotulo}
      valor={valor}
      aoAlterar={aoAlterar}
      opcoes={opcoes.map((opcao) => ({
        valor: opcao,
        label: opcao,
        icone: <IconeFiltro rotulo={rotulo} valor={opcao} />,
        cor: obterCorFiltro(rotulo, opcao),
      }))}
    />
  );
}
