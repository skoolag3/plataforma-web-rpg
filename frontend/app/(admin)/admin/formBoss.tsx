"use client";

import { nomeElementoCarta } from "../../components/elementosCarta";
import { Save, X } from "lucide-react";
import { useEffect, useState } from "react";
import {
  notificarErro,
  notificarSucesso,
} from "../../components/notificacoesGlobais";
import {
  atualizarAdminBoss,
  listarAdminCartas,
  type AdminBoss,
  type AdminCarta,
} from "../../lib/admin";
import styles from "../../styles/admin/adminCampanha.module.css";

export function FormBoss({
  boss,
  onSalvo,
  onFechar,
}: {
  boss: AdminBoss;
  onSalvo: () => void;
  onFechar: () => void;
}) {
  const [form, setForm] = useState(boss);
  const [cartas, setCartas] = useState<AdminCarta[]>([]);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => setForm(boss), [boss]);
  useEffect(() => {
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function fecharComEsc(evento: KeyboardEvent) {
      if (evento.key === "Escape") onFechar();
    }
    document.addEventListener("keydown", fecharComEsc);
    return () => {
      document.body.style.overflow = overflowAnterior;
      document.removeEventListener("keydown", fecharComEsc);
    };
  }, [onFechar]);
  useEffect(() => {
    void listarAdminCartas({ status: "ativas" })
      .then(setCartas)
      .catch(() => notificarErro("Não foi possível listar as cartas."));
  }, []);

  function alterarPergunta(indice: number, valor: string) {
    setForm((atual) => ({
      ...atual,
      perguntas: atual.perguntas.map((pergunta, posicao) =>
        posicao === indice ? valor : pergunta,
      ),
    }));
  }

  function alternarCarta(id: string) {
    setForm((atual) => ({
      ...atual,
      cartas: atual.cartas.includes(id)
        ? atual.cartas.filter((carta) => carta !== id)
        : [...atual.cartas, id],
    }));
  }

  async function salvar() {
    setSalvando(true);
    try {
      const res = await atualizarAdminBoss(form);
      notificarSucesso(res.message);
      onSalvo();
    } catch (erro) {
      notificarErro(
        erro instanceof Error
          ? erro.message
          : "Não foi possível salvar o boss.",
      );
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className={styles.modalBossBackdrop} role="presentation">
      <section
        className={styles.modalBoss}
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-form-boss"
      >
        <header>
          <div>
            <h2 id="titulo-form-boss">Configurar boss final</h2>
            <p>As mudanças valem para as próximas expedições.</p>
          </div>
          <button
            type="button"
            onClick={onFechar}
            aria-label="Fechar formulário"
          >
            <X aria-hidden="true" />
          </button>
        </header>
        <div className={styles.formBoss}>
          <label>
            Nome
            <input
              maxLength={100}
              value={form.nome}
              onChange={(evento) =>
                setForm({ ...form, nome: evento.target.value })
              }
            />
          </label>
          <label>
            Personalidade
            <textarea
              maxLength={600}
              value={form.personalidade}
              onChange={(evento) =>
                setForm({ ...form, personalidade: evento.target.value })
              }
            />
          </label>
          <label>
            Provocação inicial
            <textarea
              maxLength={500}
              value={form.provocacao}
              onChange={(evento) =>
                setForm({ ...form, provocacao: evento.target.value })
              }
            />
          </label>
          {form.perguntas.map((pergunta, indice) => (
            <label key={indice}>
              Pergunta {indice + 1}
              <input
                maxLength={250}
                value={pergunta}
                onChange={(evento) =>
                  alterarPergunta(indice, evento.target.value)
                }
              />
            </label>
          ))}
          <div className={styles.poolCartas}>
            <strong>Cartas disponíveis para o boss</strong>
            <p>
              Selecione ao menos 6. Na batalha, o servidor escolherá as mais
              vantajosas contra o deck do jogador.
            </p>
            <div>
              {cartas
                .filter((carta) => carta.ativo)
                .map((carta) => (
                  <label key={carta.id}>
                    <input
                      type="checkbox"
                      checked={form.cartas.includes(carta.id)}
                      onChange={() => alternarCarta(carta.id)}
                    />{" "}
                    {carta.nome} · {nomeElementoCarta(carta.elemento)}
                  </label>
                ))}
            </div>
          </div>
        </div>
        <footer>
          <button
            type="button"
            className={styles.cancelarBoss}
            onClick={onFechar}
          >
            Cancelar
          </button>
          <button
            className={styles.salvar}
            type="button"
            disabled={
              salvando ||
              form.perguntas.some((pergunta) => !pergunta.trim()) ||
              !form.nome.trim() ||
              !form.personalidade.trim() ||
              !form.provocacao.trim() ||
              (form.cartas.length > 0 && form.cartas.length < 6)
            }
            onClick={() => void salvar()}
          >
            <Save aria-hidden="true" />
            {salvando ? "Salvando..." : "Salvar boss"}
          </button>
        </footer>
      </section>
    </div>
  );
}
