import { Search } from "lucide-react";

import { CLASSES, ELEMENTOS, RARIDADES, VALORES_VENDA } from "../cardData";
import { styles } from "../styles";
import { FiltroSelect } from "./filtroSelect";

type FiltrosColecaoProps = {
  raridade: string;
  elemento: string;
  classe: string;
  custo: string;
  ordenacao: string;
  busca: string;
  somenteFavoritas: boolean;
  aoAlterarRaridade: (valor: string) => void;
  aoAlterarElemento: (valor: string) => void;
  aoAlterarClasse: (valor: string) => void;
  aoAlterarCusto: (valor: string) => void;
  aoAlterarOrdenacao: (valor: string) => void;
  aoAlterarBusca: (valor: string) => void;
  aoAlterarSomenteFavoritas: (valor: boolean) => void;
};

export function FiltrosColecao(props: FiltrosColecaoProps) {
  return (
    <div className={styles.filtros}>
      <label className={styles.busca}>
        <Search aria-hidden="true" />
        <input
          type="search"
          value={props.busca}
          onChange={(evento) => props.aoAlterarBusca(evento.target.value)}
          placeholder="Buscar carta..."
        />
      </label>
      <FiltroSelect
        rotulo="Raridade"
        valor={props.raridade}
        opcoes={RARIDADES}
        aoAlterar={props.aoAlterarRaridade}
      />
      <FiltroSelect
        rotulo="Elemento"
        valor={props.elemento}
        opcoes={ELEMENTOS}
        aoAlterar={props.aoAlterarElemento}
      />
      <FiltroSelect
        rotulo="Classe"
        valor={props.classe}
        opcoes={CLASSES}
        aoAlterar={props.aoAlterarClasse}
      />
      <FiltroSelect
        rotulo="Valor de venda"
        valor={props.custo}
        opcoes={VALORES_VENDA}
        aoAlterar={props.aoAlterarCusto}
      />
      <FiltroSelect
        rotulo="Ordenar por"
        valor={props.ordenacao}
        opcoes={[
          "Raridade",
          "HP",
          "Ataque",
          "Defesa",
          "Valor de venda",
          "Mais recentes",
          "Mais antigas",
        ]}
        aoAlterar={props.aoAlterarOrdenacao}
      />

      <label className={styles.favoritos}>
        <input
          type="checkbox"
          checked={props.somenteFavoritas}
          onChange={(evento) =>
            props.aoAlterarSomenteFavoritas(evento.target.checked)
          }
        />
        <span className={styles.checkbox} aria-hidden="true" />
        Mostrar apenas favoritas
      </label>
    </div>
  );
}
