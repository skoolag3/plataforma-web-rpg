import { Search } from "lucide-react";

import { CLASSES, ELEMENTOS, RARIDADES } from "../cardData";
import { styles } from "../styles";
import { FiltroSelect } from "./filtroSelect";

type FiltrosColecaoProps = {
  raridade: string;
  elemento: string;
  classe: string;
  busca: string;
  somenteFavoritas: boolean;
  aoAlterarRaridade: (valor: string) => void;
  aoAlterarElemento: (valor: string) => void;
  aoAlterarClasse: (valor: string) => void;
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
