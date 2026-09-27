import { Save, X } from "lucide-react";
import type { FormEvent } from "react";
import type {
  AdminHabilidade,
  SalvarAdminHabilidadePayload,
} from "../../lib/admin";
import {
  SelectPadrao,
  type OpcaoSelect,
} from "../../components/ui/controlesFormulario";
import sharedStyles from "../../styles/admin/adminShared.module.css";
import featureStyles from "../../styles/admin/adminHabilidades.module.css";
import { combinarEstilos } from "./combinarEstilos";

const styles = combinarEstilos(sharedStyles, featureStyles);

function CampoDropdown({
  rotulo,
  valor,
  opcoes,
  aoAlterar,
}: {
  rotulo: string;
  valor: string;
  opcoes: OpcaoSelect[];
  aoAlterar: (valor: string) => void;
}) {
  return (
    <div className={styles.campoDropdown}>
      <span>{rotulo}</span>
      <SelectPadrao
        valor={valor}
        aoAlterar={aoAlterar}
        placeholder={rotulo}
        opcoes={opcoes}
      />
    </div>
  );
}

export type FormHabilidade = SalvarAdminHabilidadePayload & { id?: string };

type Props = {
  form: FormHabilidade;
  salvando: boolean;
  aoAtualizar: <K extends keyof FormHabilidade>(
    campo: K,
    valor: FormHabilidade[K],
  ) => void;
  aoSalvar: (event: FormEvent<HTMLFormElement>) => void;
  aoFechar: () => void;
};

const opcoesTipo: { valor: AdminHabilidade["tipoEfeito"]; texto: string }[] = [
  { valor: "BUFF", texto: "Buff" },
  { valor: "DEBUFF", texto: "Debuff" },
  { valor: "DANO", texto: "Dano" },
  { valor: "CURA", texto: "Cura" },
  { valor: "ESCUDO", texto: "Escudo" },
  { valor: "ROUBO_VIDA", texto: "Roubo de vida" },
  { valor: "EVASAO", texto: "Evasão" },
];

export function AdminHabilidadeFormulario({
  form,
  salvando,
  aoAtualizar,
  aoSalvar,
  aoFechar,
}: Props) {
  const alteraAtributo =
    form.tipoEfeito === "BUFF" || form.tipoEfeito === "DEBUFF";
  const aceitaDuracao = alteraAtributo || form.tipoEfeito === "ESCUDO";
  const possuiRequisito = form.requisitoTipo !== "NENHUM";
  const possuiEscala = form.escalaTipo !== "NENHUMA";

  return (
    <div
      className={styles.modalBackdrop}
      data-modal-overlay
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) aoFechar();
      }}
    >
      <form
        data-modal-panel
        className={`${styles.usuarioEditor} ${styles.habilidadeEditor} ${styles.habilidadeModal}`}
        onSubmit={aoSalvar}
        role="dialog"
        aria-modal="true"
        aria-labelledby="habilidade-modal-titulo"
      >
        <header>
          <div>
            <h2 id="habilidade-modal-titulo">
              {form.id ? "Editar habilidade" : "Nova habilidade"}
            </h2>
            <p>A habilidade será salva como rascunho para validação.</p>
          </div>
          <button
            type="button"
            onClick={aoFechar}
            aria-label="Fechar formulário"
          >
            <X aria-hidden="true" />
          </button>
        </header>

        <label>
          Nome
          <input
            value={form.nome}
            onChange={(event) => aoAtualizar("nome", event.target.value)}
            minLength={3}
            maxLength={100}
            required
            autoFocus
          />
        </label>
        <CampoDropdown
          rotulo="Tipo de efeito"
          valor={form.tipoEfeito}
          aoAlterar={(valor) =>
            aoAtualizar("tipoEfeito", valor as AdminHabilidade["tipoEfeito"])
          }
          opcoes={opcoesTipo.map((opcao) => ({
            valor: opcao.valor,
            label: opcao.texto,
          }))}
        />
        <label className={styles.fullField}>
          Descrição
          <textarea
            value={form.descricao ?? ""}
            onChange={(event) => aoAtualizar("descricao", event.target.value)}
            maxLength={500}
            rows={3}
          />
        </label>
        <CampoDropdown
          rotulo="Gatilho"
          valor={form.gatilho}
          aoAlterar={(valor) =>
            aoAtualizar("gatilho", valor as AdminHabilidade["gatilho"])
          }
          opcoes={[
            { valor: "AO_ENTRAR", label: "Ao entrar" },
            { valor: "AO_ATACAR", label: "Ao atacar" },
            { valor: "AO_RECEBER_DANO", label: "Ao receber dano" },
            { valor: "INICIO_TURNO", label: "Início do turno" },
            { valor: "FIM_TURNO", label: "Fim do turno" },
          ]}
        />
        <CampoDropdown
          rotulo="Alvo"
          valor={form.alvo}
          aoAlterar={(valor) =>
            aoAtualizar("alvo", valor as AdminHabilidade["alvo"])
          }
          opcoes={[
            { valor: "PROPRIA_CARTA", label: "Própria carta" },
            { valor: "ALIADO_ATIVO", label: "Aliado ativo" },
            { valor: "INIMIGO_ATIVO", label: "Inimigo ativo" },
          ]}
        />
        {alteraAtributo ? (
          <CampoDropdown
            rotulo="Atributo"
            valor={form.atributo ?? "ATAQUE"}
            aoAlterar={(valor) =>
              aoAtualizar(
                "atributo",
                valor as NonNullable<AdminHabilidade["atributo"]>,
              )
            }
            opcoes={[
              { valor: "ATAQUE", label: "Ataque" },
              { valor: "DEFESA", label: "Defesa" },
              { valor: "VELOCIDADE", label: "Velocidade" },
            ]}
          />
        ) : null}
        <CampoDropdown
          rotulo="Unidade"
          valor={form.unidade}
          aoAlterar={(valor) =>
            aoAtualizar("unidade", valor as AdminHabilidade["unidade"])
          }
          opcoes={[
            { valor: "FIXO", label: "Valor fixo" },
            { valor: "PERCENTUAL", label: "Percentual" },
          ]}
        />
        <label>
          Valor base
          <input
            type="number"
            min={1}
            max={9999}
            value={form.valorBase}
            onChange={(event) =>
              aoAtualizar("valorBase", Number(event.target.value))
            }
            required
          />
        </label>
        <CampoDropdown
          rotulo="Aplicação"
          valor={form.formaAplicacao}
          aoAlterar={(valor) =>
            aoAtualizar(
              "formaAplicacao",
              valor as AdminHabilidade["formaAplicacao"],
            )
          }
          opcoes={[
            { valor: "ANTES_ACAO", label: "Antes da ação" },
            { valor: "APOS_ACAO", label: "Após a ação" },
            { valor: "SUBSTITUI_ATAQUE", label: "Substitui o ataque" },
          ]}
        />
        <CampoDropdown
          rotulo="Requisito"
          valor={form.requisitoTipo}
          aoAlterar={(valor) =>
            aoAtualizar(
              "requisitoTipo",
              valor as AdminHabilidade["requisitoTipo"],
            )
          }
          opcoes={[
            { valor: "NENHUM", label: "Nenhum" },
            { valor: "CONTADOR_ATAQUES", label: "Contador de ataques" },
            { valor: "HP_ABAIXO", label: "HP abaixo de (%)" },
            { valor: "TURNO_MINIMO", label: "Turno mínimo" },
          ]}
        />
        {possuiRequisito ? (
          <label>
            Valor do requisito
            <input
              type="number"
              min={1}
              max={100}
              value={form.requisitoValor ?? 1}
              onChange={(event) =>
                aoAtualizar("requisitoValor", Number(event.target.value))
              }
              required
            />
          </label>
        ) : null}
        <CampoDropdown
          rotulo="Escala"
          valor={form.escalaTipo}
          aoAlterar={(valor) =>
            aoAtualizar("escalaTipo", valor as AdminHabilidade["escalaTipo"])
          }
          opcoes={[
            { valor: "NENHUMA", label: "Sem escala" },
            { valor: "POR_TURNO", label: "Por turno" },
            { valor: "POR_ATAQUE", label: "Por ataque" },
          ]}
        />
        {possuiEscala ? (
          <>
            <label>
              Crescimento
              <input
                type="number"
                min={1}
                max={9999}
                value={form.escalaValor ?? 1}
                onChange={(event) =>
                  aoAtualizar("escalaValor", Number(event.target.value))
                }
                required
              />
            </label>
            <label>
              Limite da escala
              <input
                type="number"
                min={1}
                max={9999}
                value={form.escalaLimite ?? form.valorBase}
                onChange={(event) =>
                  aoAtualizar("escalaLimite", Number(event.target.value))
                }
                required
              />
            </label>
          </>
        ) : null}
        {aceitaDuracao ? (
          <label>
            Duração em turnos
            <input
              type="number"
              min={1}
              max={20}
              value={form.duracaoTurnos ?? ""}
              onChange={(event) =>
                aoAtualizar(
                  "duracaoTurnos",
                  event.target.value ? Number(event.target.value) : undefined,
                )
              }
              placeholder="Sem duração"
            />
          </label>
        ) : null}

        <div className={styles.editorActions}>
          <button type="button" onClick={aoFechar} disabled={salvando}>
            Cancelar
          </button>
          <button
            type="submit"
            className={styles.primaryBtn}
            disabled={salvando}
          >
            <Save aria-hidden="true" />{" "}
            {salvando ? "Salvando..." : "Salvar rascunho"}
          </button>
        </div>
      </form>
    </div>
  );
}
