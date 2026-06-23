"use client";

import { useEffect, useState } from "react";
import { clearSession, getToken, updateStoredUser } from "../../lib/auth";
import {
  atualizarEmailApi,
  atualizarBiografiaApi,
  atualizarNomeApi,
  atualizarPreferenciasApi,
  atualizarSenhaApi,
  buscarPerfilApi,
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
import { CardUsuario } from "./components/cardUsuario";
import { ConfigsPerfil } from "./components/configsPerfil";
import { PreferenciasPerfil } from "./components/preferenciasPerfil";
import { ResumoConta } from "./components/resumoConta";
import { SidebarPerfil } from "./components/sidebarPerfil";
import { TopoPerfil } from "./components/topoPerfil";
import { ZonaPerigo } from "./components/zonaPerigo";

export default function PerfilPage() {
  const [perfil, setPerfil] = useState<PerfilConta | null>(null);
  const [erro, setErro] = useState("");
  const [molduras, setMolduras] = useState<MolduraConta[]>([]);

  useEffect(() => {
    const token = getToken();

    if (!token) {
      return;
    }

    Promise.all([buscarPerfilApi(token), listarMoldurasApi(token)])
      .then(([dadosPerfil, dadosMolduras]) => {
        setPerfil(dadosPerfil);
        setMolduras(dadosMolduras);
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
    setPerfil((atual) =>
      atual ? { ...atual, user: resposta.nome } : atual,
    );
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
          }
        : atual,
    );
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
      <SidebarPerfil />

      <div className={styles.areaPerfil}>
        <TopoPerfil perfil={perfil} />

        <div className={styles.conteudoPerfil}>
          <header className={styles.cabecalhoPerfil}>
            <p className={styles.sobretitulo}>Conta do jogador</p>
            <h1>Gerenciamento de Perfil</h1>
            <p>
              Gerencie suas informações pessoais, segurança e preferências da
              conta.
            </p>
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
                aoDesativar={desativarConta}
                aoExcluir={solicitarExclusao}
              />
            </aside>
          </div>
        </div>
      </div>
    </main>
  );
}
