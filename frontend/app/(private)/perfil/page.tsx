"use client";

import { useEffect, useState } from "react";
import { ChevronDown, Clock3, Trophy, XCircle } from "lucide-react";
import { clearSession, getToken, updateStoredUser } from "../../lib/auth";
import { buscarHistoricoPartidas, type HistoricoPartida } from "../../lib/jogo";
import {
  atualizarEmailApi,
  atualizarBiografiaApi,
  atualizarNomeApi,
  atualizarPreferenciasApi,
  atualizarSenhaApi,
  buscarPerfilApi,
  cancelarExclusaoApi,
  desativarContaApi,
  enviarImagemPerfilApi,
  listarMoldurasApi,
  obterUrlGoogleApi,
  selecionarMolduraApi,
  solicitarExclusaoApi,
  type MolduraConta,
  type PerfilConta,
  type PreferenciasConta,
} from "../../lib/perfil";
import styles from "../../styles/perfil/perfilLayout.module.css";
import historicoStyles from "../../styles/perfil/historicoPerfil.module.css";
import { CardUsuario } from "./components/cardUsuario";
import { ConfigsPerfil } from "./components/configsPerfil";
import { PreferenciasPerfil } from "./components/preferenciasPerfil";
import { ResumoConta } from "./components/resumoConta";
import { ZonaPerigo } from "./components/zonaPerigo";

export default function PerfilPage() {
  const [perfil, setPerfil] = useState<PerfilConta | null>(null);
  const [erro, setErro] = useState("");
  const [molduras, setMolduras] = useState<MolduraConta[]>([]);
  const [historico, setHistorico] = useState<HistoricoPartida[]>([]);
  const [historicoAberto, setHistoricoAberto] = useState(false);
  const [paginaHistorico, setPaginaHistorico] = useState(1);

  useEffect(() => {
    const token = getToken();

    if (!token) {
      return;
    }

    Promise.all([buscarPerfilApi(token), listarMoldurasApi(token), buscarHistoricoPartidas()])
      .then(([dadosPerfil, dadosMolduras, partidas]) => {
        setPerfil(dadosPerfil);
        setMolduras(dadosMolduras);
        setHistorico(partidas);
      })
      .catch((erroCapturado) =>
        setErro(
          erroCapturado instanceof Error
            ? erroCapturado.message
            : "Não foi possível carregar o perfil.",
        ),
      );
  }, []);

  async function atualizarNome(nome: string) {
    const token = getToken();
    if (!token) throw new Error("Sessão expirada.");

    const resposta = await atualizarNomeApi(token, nome);
    setPerfil((atual) => (atual ? { ...atual, user: resposta.nome } : atual));
    updateStoredUser({ nome: resposta.nome });
    return resposta.message;
  }

  async function atualizarEmail(email: string, senhaAtual: string) {
    const token = getToken();
    if (!token) throw new Error("Sessão expirada.");

    const resposta = await atualizarEmailApi(token, email, senhaAtual);
    return resposta.message;
  }

  async function atualizarSenha(
    senhaAtual: string,
    novaSenha: string,
    confirmarSenha: string,
  ) {
    const token = getToken();
    if (!token) throw new Error("Sessão expirada.");

    const resposta = await atualizarSenhaApi(
      token,
      senhaAtual,
      novaSenha,
      confirmarSenha,
    );
    return resposta.message;
  }

  async function atualizarPreferencias(preferencias: PreferenciasConta) {
    const token = getToken();
    if (!token) throw new Error("Sessão expirada.");

    const resposta = await atualizarPreferenciasApi(token, preferencias);
    setPerfil((atual) =>
      atual ? { ...atual, preferencias: resposta.preferencias } : atual,
    );
    return resposta.message;
  }

  async function atualizarBiografia(biografia: string) {
    const token = getToken();
    if (!token) throw new Error("Sessão expirada.");
    const resposta = await atualizarBiografiaApi(token, biografia);
    setPerfil((atual) =>
      atual ? { ...atual, biografia: resposta.biografia } : atual,
    );
    return resposta.message;
  }

  async function selecionarMoldura(idMoldura: string) {
    const token = getToken();
    if (!token) throw new Error("Sessão expirada.");
    const resposta = await selecionarMolduraApi(token, idMoldura);
    setPerfil((atual) =>
      atual
        ? {
            ...atual,
            moldura: resposta.moldura,
            molduraClasse: resposta.molduraClasse,
            molduraUrl: resposta.molduraUrl ?? null,
            molduraConfig: resposta.molduraConfig ?? null,
          }
        : atual,
    );
    window.dispatchEvent(new Event("perfil-atualizado"));
    return resposta.message;
  }

  async function enviarImagem(tipo: "avatar" | "banner", arquivo: File) {
    const token = getToken();
    if (!token) throw new Error("Sessão expirada.");
    const resposta = await enviarImagemPerfilApi(token, tipo, arquivo);
    setPerfil((atual) =>
      atual
        ? {
            ...atual,
            ...(tipo === "avatar"
              ? { avatarUrl: resposta.url }
              : { bannerUrl: resposta.url }),
          }
        : atual,
    );
    if (tipo === "avatar") {
      window.dispatchEvent(new Event("perfil-atualizado"));
    }
    return resposta.message;
  }

  async function vincularGoogle() {
    const token = getToken();
    if (!token) throw new Error("Sessão expirada.");
    const resposta = await obterUrlGoogleApi(token);
    window.location.assign(resposta.url);
  }

  async function desativarConta(senhaAtual: string) {
    const token = getToken();
    if (!token) throw new Error("Sessão expirada.");
    const mensagem = (await desativarContaApi(token, senhaAtual)).message;
    clearSession();
    return mensagem;
  }

  async function solicitarExclusao(senhaAtual: string) {
    const token = getToken();
    if (!token) throw new Error("Sessão expirada.");
    const mensagem = (await solicitarExclusaoApi(token, senhaAtual)).message;
    clearSession();
    return mensagem;
  }

  async function cancelarExclusao() {
    const token = getToken();
    if (!token) throw new Error("Sessao expirada.");
    const resposta = await cancelarExclusaoApi(token);
    setPerfil((atual) =>
      atual ? { ...atual, exclusaoAgendadaPara: null } : atual,
    );
    return resposta.message;
  }

  if (erro) {
    return (
      <main className={styles.estadoPerfil}>
        <h1>Não foi possível abrir o perfil</h1>
        <p>{erro}</p>
      </main>
    );
  }

  if (!perfil) {
    return (
      <main className={styles.estadoPerfil}>
        <p>Carregando perfil...</p>
      </main>
    );
  }

  return (
    <main className={styles.paginaPerfil}>
      <div className={styles.areaPerfil}>
        <div className={styles.conteudoPerfil}>
          <header className={styles.cabecalhoPerfil}>
            <p className={styles.sobretitulo}>Conta do jogador</p>
            <h1>Seu perfil</h1>
            <p>Identidade, progresso e configurações da sua conta.</p>
          </header>

          <div className={styles.gradePerfil}>
            <div className={styles.colunaPrincipal}>
              <CardUsuario
                perfil={perfil}
                molduras={molduras}
                aoAtualizarNome={atualizarNome}
                aoAtualizarBiografia={atualizarBiografia}
                aoSelecionarMoldura={selecionarMoldura}
                aoEnviarImagem={enviarImagem}
              />
              <ConfigsPerfil
                perfil={perfil}
                aoAtualizarEmail={atualizarEmail}
                aoAtualizarSenha={atualizarSenha}
                aoVincularGoogle={vincularGoogle}
              />
              <section id="historico" className={historicoStyles.painel}>
                <button type="button" className={historicoStyles.cabecalho} onClick={() => setHistoricoAberto((aberto) => !aberto)} aria-expanded={historicoAberto}>
                  <span><Clock3 /> Histórico de partidas</span><small>Últimas batalhas registradas <ChevronDown /></small>
                </button>
                {historicoAberto && (historico.length === 0 ? <p className={historicoStyles.vazio}>Você ainda não concluiu nenhuma partida.</p> : (
                  <div className={historicoStyles.lista}>
                    {historico.slice((paginaHistorico - 1) * 5, paginaHistorico * 5).map((partida) => {
                      const vitoria = partida.resultado === "VITORIA";
                      const data = partida.timestamp_inicio ? new Date(partida.timestamp_inicio).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "—";
                      return <article key={partida.id} className={historicoStyles.item}>
                        <strong data-resultado={partida.resultado}>{vitoria ? <><Trophy /> Vitória</> : partida.resultado === "DERROTA" ? <><XCircle /> Derrota</> : "Empate"}</strong>
                        <span><b>{partida.deck?.nome ?? "Deck removido"}</b><small>{data} · {partida.turnos_jogados} turnos</small></span>
                        <em>{partida.variacao_pontos && partida.variacao_pontos > 0 ? "+" : ""}{partida.variacao_pontos ?? 0} pts</em>
                      </article>;
                    })}
                    {historico.length > 5 ? <nav className={historicoStyles.paginacao} aria-label="Paginação do histórico"><button type="button" disabled={paginaHistorico === 1} onClick={() => setPaginaHistorico((pagina) => pagina - 1)}>Anterior</button><span>{paginaHistorico} / {Math.ceil(historico.length / 5)}</span><button type="button" disabled={paginaHistorico >= Math.ceil(historico.length / 5)} onClick={() => setPaginaHistorico((pagina) => pagina + 1)}>Próxima</button></nav> : null}
                  </div>
                ))}
              </section>

              <p className={styles.ajudaPerfil}>
                Precisa de ajuda? Acesse nossa{" "}
                <a href="#central-ajuda">Central de Ajuda</a>
              </p>
            </div>

            <aside className={styles.colunaLateral}>
              <ResumoConta perfil={perfil} />
              <PreferenciasPerfil
                preferencias={perfil.preferencias}
                aoAtualizar={atualizarPreferencias}
              />
              <ZonaPerigo
                exclusaoAgendadaPara={perfil.exclusaoAgendadaPara}
                aoDesativar={desativarConta}
                aoExcluir={solicitarExclusao}
                aoCancelarExclusao={cancelarExclusao}
              />
            </aside>
          </div>
        </div>
      </div>
    </main>
  );
}
