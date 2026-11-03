import { CLASSES, ELEMENTOS } from "../cardData";
import { styles } from "../styles";
import { FiltroSelect } from "./filtroSelect";
import { useRaridadesJogo } from "../../../components/raridadesJogo";

type FiltrosColecaoProps = {
  raridade: string;
  elemento: string;
  classe: string;
  ordenacao: string;
  somenteFavoritas: boolean;
  aoAlterarRaridade: (valor: string) => void;
  aoAlterarElemento: (valor: string) => void;
  aoAlterarClasse: (valor: string) => void;
  aoAlterarOrdenacao: (valor: string) => void;
  aoAlterarSomenteFavoritas: (valor: boolean) => void;
};

export function FiltrosColecao(props: FiltrosColecaoProps) {
  const raridades = useRaridadesJogo();
  return (
    <div className={styles.filtros}>
      <FiltroSelect
        rotulo="Raridade"
        valor={props.raridade}
        opcoes={["Todas", ...raridades.map((item) => item.codigo)]}
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
