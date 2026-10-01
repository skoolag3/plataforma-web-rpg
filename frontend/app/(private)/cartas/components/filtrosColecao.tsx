import { CLASSES, ELEMENTOS, RARIDADES, VALORES_VENDA } from "../cardData";
import { styles } from "../styles";
import { FiltroSelect } from "./filtroSelect";

type FiltrosColecaoProps = {
  raridade: string;
  elemento: string;
  classe: string;
  custo: string;
  ordenacao: string;
  somenteFavoritas: boolean;
  aoAlterarRaridade: (valor: string) => void;
  aoAlterarElemento: (valor: string) => void;
  aoAlterarClasse: (valor: string) => void;
  aoAlterarCusto: (valor: string) => void;
  aoAlterarOrdenacao: (valor: string) => void;
  aoAlterarSomenteFavoritas: (valor: boolean) => void;
};

export function FiltrosColecao(props: FiltrosColecaoProps) {
  return (
    <div className={styles.filtros}>
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
