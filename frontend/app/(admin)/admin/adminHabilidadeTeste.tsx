import { FlaskConical, Play, X } from "lucide-react";
import { useState, type FormEvent } from "react";
import {
  testarAdminHabilidade,
  type AdminHabilidade,
  type ResultadoTesteAdminHabilidade,
  type TestarAdminHabilidadePayload,
} from "../../lib/admin";
import stylesAdmin from "../../styles/admin/admin.module.css";
import styles from "./adminHabilidadeTeste.module.css";

type Props = {
  habilidade: AdminHabilidade;
  aoTestar: (habilidade: AdminHabilidade) => void;
  aoFechar: () => void;
};

const cenarioInicial: TestarAdminHabilidadePayload = {
  turno: 1,
  ataquesRealizados: 0,
  hpAtual: 100,
  hpMaximo: 100,
};

export function AdminHabilidadeTeste({
  habilidade,
  aoTestar,
  aoFechar,
}: Props) {
  const [cenario, setCenario] = useState(cenarioInicial);
  const [res, setRes] = useState<ResultadoTesteAdminHabilidade | null>(null);
  const [testando, setTestando] = useState(false);
  const [erro, setErro] = useState("");

  function atualizarCenario(
    campo: keyof TestarAdminHabilidadePayload,
    valor: number,
  ) {
    setCenario((atual) => ({ ...atual, [campo]: valor }));
    setRes(null);
  }

  async function testar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTestando(true);
    setErro("");
    try {
      const resultado = await testarAdminHabilidade(habilidade.id, cenario);
      setRes(resultado);
      aoTestar(resultado.habilidade);
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Falha ao testar.");
    } finally {
      setTestando(false);
    }
  }

  return (
    <div
      className={stylesAdmin.modalBackdrop}
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) aoFechar();
      }}
    >
      <form
        className={`${stylesAdmin.usuarioEditor} ${stylesAdmin.habilidadeEditor} ${stylesAdmin.habilidadeModal}`}
        onSubmit={testar}
        role="dialog"
        aria-modal="true"
        aria-labelledby="teste-habilidade-titulo"
      >
        <header>
          <div>
            <h2 id="teste-habilidade-titulo">
              <FlaskConical aria-hidden="true" /> Testar {habilidade.nome}
            </h2>
            <p>Simule o momento em que o servidor avaliaria esta habilidade.</p>
          </div>
          <button type="button" onClick={aoFechar} aria-label="Fechar teste">
            <X aria-hidden="true" />
          </button>
        </header>

        {erro ? <p className={stylesAdmin.feedbackError}>{erro}</p> : null}
        <div className={styles.conteudo}>
          <p className={styles.explicacao}>
            O teste não executa uma batalha real. Ele verifica o requisito e
            calcula o valor que seria aplicado nesse cenário.
          </p>
          <label>
            Turno atual
            <input
              type="number"
              min={1}
              max={100}
              value={cenario.turno}
              onChange={(event) =>
                atualizarCenario("turno", Number(event.target.value))
              }
              required
            />
          </label>
          <label>
            Ataques já realizados
            <input
              type="number"
              min={0}
              max={9999}
              value={cenario.ataquesRealizados}
              onChange={(event) =>
                atualizarCenario(
                  "ataquesRealizados",
                  Number(event.target.value),
                )
              }
              required
            />
          </label>
          <label>
            HP atual
            <input
              type="number"
              min={0}
              max={999999}
              value={cenario.hpAtual}
              onChange={(event) =>
                atualizarCenario("hpAtual", Number(event.target.value))
              }
              required
            />
          </label>
          <label>
            HP máximo
            <input
              type="number"
              min={1}
              max={999999}
              value={cenario.hpMaximo}
              onChange={(event) =>
                atualizarCenario("hpMaximo", Number(event.target.value))
              }
              required
            />
          </label>

          {res ? (
            <section
              className={styles.resultado}
              data-acionada={res.resultado.acionada}
              aria-live="polite"
            >
              <div>
                <small>Ativação</small>
                <strong>
                  {res.resultado.acionada ? "Ativaria" : "Não ativaria"}
                </strong>
              </div>
              <div>
                <small>Valor calculado</small>
                <strong>{res.resultado.valorCalculado}</strong>
              </div>
              <div>
                <small>HP no cenário</small>
                <strong>{res.resultado.percentualHp}%</strong>
              </div>
              <p className={styles.resumo}>{res.resultado.resumo}</p>
            </section>
          ) : null}
        </div>

        <div className={stylesAdmin.editorActions}>
          <button type="button" onClick={aoFechar} disabled={testando}>
            Fechar
          </button>
          <button
            type="submit"
            className={stylesAdmin.primaryBtn}
            disabled={testando}
          >
            <Play aria-hidden="true" />
            {testando ? "Testando..." : "Executar teste"}
          </button>
        </div>
      </form>
    </div>
  );
}
