import { FlaskConical, Heart, Play, RotateCcw, Shield, Swords, X } from "lucide-react";
import { useState, type FormEvent } from "react";
import {
  testarAdminHabilidade,
  type AdminHabilidade,
  type ResultadoTesteAdminHabilidade,
  type TestarAdminHabilidadePayload,
} from "../../../lib/admin";
import sharedStyles from "../../../styles/admin/adminShared.module.css";
import habilidadeStyles from "../../../styles/admin/adminHabilidades.module.css";
import styles from "./adminHabilidadeTeste.module.css";
import { combinarEstilos } from "../shared/combinarEstilos";

const stylesAdmin = combinarEstilos(sharedStyles, habilidadeStyles);

type Props = {
  habilidade: AdminHabilidade;
  aoTestar: (habilidade: AdminHabilidade) => void;
  aoFechar: () => void;
};

const cenarioInicial: TestarAdminHabilidadePayload = {
  criticoAtivou: false,
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
  const [vidaInimigo, setVidaInimigo] = useState(100);
  const percentualHp = Math.min(100, Math.max(0, Math.round((cenario.hpAtual / Math.max(1, cenario.hpMaximo)) * 100)));
  const critico = habilidade.tipoEfeito === "CRITICO";
  const danoDireto = habilidade.tipoEfeito === "DANO" && habilidade.alvo === "INIMIGO_ATIVO" && habilidade.unidade === "FIXO";
  const precisaTurno = habilidade.requisitoTipo === "TURNO_MINIMO" || habilidade.requisitoTipo === "INTERVALO_TURNOS" || habilidade.escalaTipo === "POR_TURNO";
  const precisaAtaques = habilidade.requisitoTipo === "CONTADOR_ATAQUES" || habilidade.escalaTipo === "POR_ATAQUE";
  const precisaVida = habilidade.requisitoTipo === "HP_ABAIXO" || habilidade.tipoEfeito === "CURA";
  const danoPrevisto = res?.resultado.acionada && danoDireto ? Math.max(0, res.resultado.valorCalculado) : 0;
  const temPerguntas = critico || precisaTurno || precisaAtaques || precisaVida || danoDireto;
  const nomeSugereCritico = /cr[ií]tic/i.test(habilidade.nome) && !critico;

  function atualizarCenario<K extends keyof TestarAdminHabilidadePayload>(
    campo: K,
    valor: TestarAdminHabilidadePayload[K],
  ) {
    setCenario((atual) => ({ ...atual, [campo]: valor }));
    setRes(null);
    setErro("");
  }

  function usarVida(percentual: number) {
    atualizarCenario("hpAtual", Math.round((cenario.hpMaximo * percentual) / 100));
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
      data-modal-overlay
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) aoFechar();
      }}
    >
      <form
        data-modal-panel
        className={`${stylesAdmin.usuarioEditor} ${stylesAdmin.habilidadeEditor} ${stylesAdmin.habilidadeModal} ${styles.modalTeste} ${critico ? styles.modalCritico : ""}`}
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
            <p>{critico ? "Confira a chance e o bônus do ataque crítico." : "Confira a regra salva e o valor que ela calcula."}</p>
          </div>
          <button type="button" onClick={aoFechar} aria-label="Fechar teste">
            <X aria-hidden="true" />
          </button>
        </header>

        {erro ? <p className={stylesAdmin.feedbackError}>{erro}</p> : null}
        <div className={styles.conteudo}>
          <p className={styles.explicacao}>Este teste avalia a regra da habilidade, mas não executa o combate. Só dano fixo pode ter uma prévia simples de vida, sem considerar defesa.</p>
          {nomeSugereCritico ? <p className={styles.alertaTipo}>Atenção: apesar do nome, esta habilidade está salva como <strong>{habilidade.tipoEfeito}</strong>, não como Golpe crítico. Edite o efeito principal se quiser testar chance de crítico.</p> : null}
          <div className={`${styles.sandbox} ${critico ? styles.sandboxCritico : ""}`}>
            <div className={styles.duelo}>
            <div className={`${styles.cartaTeste} ${critico ? styles.cartaCritico : ""}`} aria-label={critico ? "Carta de exemplo" : `Carta de exemplo com ${percentualHp}% de vida`}>
              <span className={styles.seloCarta}>CARTA DE TESTE</span>
              <div className={styles.arteCarta} aria-hidden="true"><Swords size={36} strokeWidth={1.5} /></div>
              <strong>Herói de treino</strong>
              <span className={styles.habilidadeCarta}>{habilidade.nome}</span>
              {!critico ? <div className={styles.vidaCarta}>
                <span><Heart size={14} aria-hidden="true" /> Vida <b>{cenario.hpAtual}/{cenario.hpMaximo}</b></span>
                <progress className={styles.progressoVida} value={cenario.hpAtual} max={Math.max(1, cenario.hpMaximo)} aria-label="Vida da carta de teste" />
              </div> : null}
            </div>
            <span className={styles.versus}>VS</span>
            <div className={`${styles.cartaTeste} ${styles.cartaInimigo}`} aria-label="Inimigo de treino">
              <span className={styles.seloCarta}>ALVO DE TESTE</span>
              <div className={styles.arteCarta} aria-hidden="true"><Shield size={32} strokeWidth={1.5} /></div>
              <strong>Inimigo de treino</strong>
              {danoDireto ? <div className={styles.vidaCarta}>
                <span><Heart size={14} aria-hidden="true" /> Vida estimada <b>{Math.max(0, vidaInimigo - danoPrevisto)}/{vidaInimigo}</b></span>
                <progress className={styles.progressoVida} value={Math.max(0, vidaInimigo - danoPrevisto)} max={Math.max(1, vidaInimigo)} aria-label="Vida estimada do inimigo" />
              </div> : <small className={styles.semPreviaVida}>Vida não calculada sem o dano base e as regras do combate.</small>}
              {res ? <small className={styles.efeitoNoInimigo}>{danoDireto ? danoPrevisto > 0 ? `−${danoPrevisto} pontos de dano estimado` : "Nenhum dano neste cenário" : critico ? res.resultado.acionada ? `+${res.resultado.valorCalculado}% sobre o dano do ataque, não sobre a vida do inimigo` : "Sem bônus crítico" : habilidade.alvo === "INIMIGO_ATIVO" ? `Valor da regra: ${res.resultado.valorCalculado}${habilidade.unidade === "PERCENTUAL" ? "%" : " pontos"}. Não é perda de vida calculada.` : "Esta habilidade não mira o inimigo"}</small> : null}
            </div>
            </div>
            <div className={styles.configuracao}>
              <div className={styles.configuracaoTitulo}><strong>{critico ? "Teste o golpe" : "Cenário do teste"}</strong><span>{critico ? "Escolha se o sorteio deu certo neste ataque." : temPerguntas ? "Responda só ao que muda o resultado desta habilidade." : "Esta habilidade não tem condição variável para preencher."}</span></div>
              {!temPerguntas ? <p className={styles.cenarioPronto}>A regra será verificada com o cenário padrão. Clique em “Calcular efeito” para ver o valor; isso não calcula a vida perdida pelo inimigo.</p> : null}
              {!critico ? <><div className={styles.camposCenario}>
                {precisaTurno ? <label>Em qual turno estamos?<input type="number" min={1} max={100} value={cenario.turno} onChange={(event) => atualizarCenario("turno", Number(event.target.value))} required /></label> : null}
                {precisaAtaques ? <label>Quantos ataques já foram feitos?<input type="number" min={0} max={9999} value={cenario.ataquesRealizados} onChange={(event) => atualizarCenario("ataquesRealizados", Number(event.target.value))} required /></label> : null}
                {precisaVida ? <><label>Quanta vida a carta tem agora?<input type="number" min={0} max={cenario.hpMaximo} value={cenario.hpAtual} onChange={(event) => atualizarCenario("hpAtual", Number(event.target.value))} required /></label>
                <label>Qual é a vida máxima da carta?<input type="number" min={1} max={999999} value={cenario.hpMaximo} onChange={(event) => atualizarCenario("hpMaximo", Number(event.target.value))} required /></label></> : null}
              </div>
              {precisaVida ? <div className={styles.atalhosVida} aria-label="Atalhos de vida">
                <span>Quer ajustar a vida rapidamente?</span>
                <button type="button" onClick={() => usarVida(100)}>Cheia</button>
                <button type="button" onClick={() => usarVida(50)}>Metade</button>
                <button type="button" onClick={() => usarVida(20)}>Baixa</button>
              </div> : null}</> : null}
              {danoDireto ? <label className={styles.vidaInimigoCampo}>Quanta vida o inimigo tem no teste?<input type="number" min={1} max={999999} value={vidaInimigo} onChange={(event) => { setVidaInimigo(Number(event.target.value)); setRes(null); }} required /></label> : null}
              {critico ? <fieldset className={styles.escolhaCritico}>
                <legend>O golpe foi crítico?</legend>
                <p>A habilidade tem {habilidade.requisitoValor ?? 0}% de chance de causar um crítico. O que aconteceu neste golpe?</p>
                <div>
                  <label><input type="radio" name="criticoAtivou" checked={cenario.criticoAtivou === true} onChange={() => atualizarCenario("criticoAtivou", true)} /><span>Sim, foi crítico</span></label>
                  <label><input type="radio" name="criticoAtivou" checked={cenario.criticoAtivou === false} onChange={() => atualizarCenario("criticoAtivou", false)} /><span>Não foi crítico</span></label>
                </div>
              </fieldset> : null}
            </div>
          </div>

          {res && critico ? <section className={styles.resultadoCritico} data-acionada={res.resultado.acionada} aria-live="polite">
            <strong>{res.resultado.acionada ? "O golpe foi crítico" : "O golpe não foi crítico"}</strong>
            <span>{res.resultado.acionada ? `+${res.resultado.valorCalculado}% de dano neste golpe` : "Nenhum dano extra neste golpe"}</span>
            <small>A chance cadastrada é {habilidade.requisitoValor ?? 0}%. Aqui você escolhe o resultado apenas para conferir o efeito.</small>
          </section> : res ? (
            <section
              className={styles.resultado}
              data-acionada={res.resultado.acionada}
              aria-live="polite"
            >
              <div><small>Condição</small><strong>{res.resultado.acionada ? "Atendida" : "Não atendida"}</strong></div>
              <div><small>Valor da regra</small><strong>{res.resultado.valorCalculado}{habilidade.unidade === "PERCENTUAL" ? "%" : " pontos"}</strong></div>
              <div><small>Tipo salvo</small><strong>{habilidade.tipoEfeito}</strong></div>
              <p className={styles.resumo}>{res.resultado.acionada ? danoDireto ? "Prévia de dano fixo mostrada no inimigo, sem defesa." : "Valor calculado. A vida do inimigo depende do dano base e das regras da batalha." : "A condição não foi cumprida neste cenário."}</p>
            </section>
          ) : <p className={styles.estadoInicial}><FlaskConical size={17} aria-hidden="true" /> {critico ? "Escolha Sim ou Não e clique em Ver resultado." : "O resultado aparece aqui depois de executar o teste."}</p>}
        </div>

        <div className={`${stylesAdmin.editorActions} ${styles.acoesTeste}`}>
          {critico ? <button type="button" onClick={aoFechar} disabled={testando}>Fechar</button> : <button type="button" onClick={() => { setCenario(cenarioInicial); setVidaInimigo(100); setRes(null); setErro(""); }} disabled={testando}>
            <RotateCcw aria-hidden="true" /> Reiniciar cenário
          </button>}
          <button
            type="submit"
            className={stylesAdmin.primaryBtn}
            disabled={testando}
          >
            <Play aria-hidden="true" />
            {testando ? "Calculando..." : "Calcular efeito"}
          </button>
        </div>
      </form>
    </div>
  );
}
