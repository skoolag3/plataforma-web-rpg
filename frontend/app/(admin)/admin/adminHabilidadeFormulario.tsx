import { Save, X } from "lucide-react";
import type { FormEvent } from "react";
import type {
  AdminHabilidade,
  SalvarAdminHabilidadePayload,
} from "../../lib/admin";
import sharedStyles from "../../styles/admin/adminShared.module.css";
import featureStyles from "../../styles/admin/adminHabilidades.module.css";
import { combinarEstilos } from "./combinarEstilos";

const styles = combinarEstilos(sharedStyles, featureStyles);

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
        <label>
          Tipo de efeito
          <select
            value={form.tipoEfeito}
            onChange={(event) =>
              aoAtualizar(
                "tipoEfeito",
                event.target.value as AdminHabilidade["tipoEfeito"],
              )
            }
          >
            {opcoesTipo.map((opcao) => (
              <option key={opcao.valor} value={opcao.valor}>
                {opcao.texto}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.fullField}>
          Descrição
          <textarea
            value={form.descricao ?? ""}
            onChange={(event) => aoAtualizar("descricao", event.target.value)}
            maxLength={500}
            rows={3}
          />
        </label>
        <label>
          Gatilho
          <select
            value={form.gatilho}
            onChange={(event) =>
              aoAtualizar(
                "gatilho",
                event.target.value as AdminHabilidade["gatilho"],
              )
            }
          >
            <option value="AO_ENTRAR">Ao entrar</option>
            <option value="AO_ATACAR">Ao atacar</option>
            <option value="AO_RECEBER_DANO">Ao receber dano</option>
            <option value="INICIO_TURNO">Início do turno</option>
            <option value="FIM_TURNO">Fim do turno</option>
          </select>
        </label>
        <label>
          Alvo
          <select
            value={form.alvo}
            onChange={(event) =>
              aoAtualizar("alvo", event.target.value as AdminHabilidade["alvo"])
            }
          >
            <option value="PROPRIA_CARTA">Própria carta</option>
            <option value="ALIADO_ATIVO">Aliado ativo</option>
            <option value="INIMIGO_ATIVO">Inimigo ativo</option>
          </select>
        </label>
        {alteraAtributo ? (
          <label>
            Atributo
            <select
              value={form.atributo ?? "ATAQUE"}
              onChange={(event) =>
                aoAtualizar(
                  "atributo",
                  event.target.value as NonNullable<
                    AdminHabilidade["atributo"]
                  >,
                )
              }
            >
              <option value="ATAQUE">Ataque</option>
              <option value="DEFESA">Defesa</option>
              <option value="VELOCIDADE">Velocidade</option>
            </select>
          </label>
        ) : null}
        <label>
          Unidade
          <select
            value={form.unidade}
            onChange={(event) =>
              aoAtualizar(
                "unidade",
                event.target.value as AdminHabilidade["unidade"],
              )
            }
          >
            <option value="FIXO">Valor fixo</option>
            <option value="PERCENTUAL">Percentual</option>
          </select>
        </label>
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
        <label>
          Aplicação
          <select
            value={form.formaAplicacao}
            onChange={(event) =>
              aoAtualizar(
                "formaAplicacao",
                event.target.value as AdminHabilidade["formaAplicacao"],
              )
            }
          >
            <option value="ANTES_ACAO">Antes da ação</option>
            <option value="APOS_ACAO">Após a ação</option>
            <option value="SUBSTITUI_ATAQUE">Substitui o ataque</option>
          </select>
        </label>
        <label>
          Requisito
          <select
            value={form.requisitoTipo}
            onChange={(event) =>
              aoAtualizar(
                "requisitoTipo",
                event.target.value as AdminHabilidade["requisitoTipo"],
              )
            }
          >
            <option value="NENHUM">Nenhum</option>
            <option value="CONTADOR_ATAQUES">Contador de ataques</option>
            <option value="HP_ABAIXO">HP abaixo de (%)</option>
            <option value="TURNO_MINIMO">Turno mínimo</option>
          </select>
        </label>
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
        <label>
          Escala
          <select
            value={form.escalaTipo}
            onChange={(event) =>
              aoAtualizar(
                "escalaTipo",
                event.target.value as AdminHabilidade["escalaTipo"],
              )
            }
          >
            <option value="NENHUMA">Sem escala</option>
            <option value="POR_TURNO">Por turno</option>
            <option value="POR_ATAQUE">Por ataque</option>
          </select>
        </label>
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
