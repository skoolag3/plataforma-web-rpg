"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { getToken } from "../../../lib/auth";
import { buscarPerfilPublicoApi, type PerfilPublico } from "../../../lib/perfil";
import layoutStyles from "../../../styles/perfil/perfilLayout.module.css";
import { CardUsuarioPublico, ResumoContaPublico } from "../components/perfilPublico";
import { HistoricoPartidasPerfil } from "../components/historicoPartidasPerfil";

export default function PerfilJogadorPage() {
  const { id } = useParams<{ id: string }>();
  const [perfil, setPerfil] = useState<PerfilPublico | null>(null);
  const [erro, setErro] = useState("");

  useEffect(() => {
    const token = getToken();
    if (!token || !id) return;
    let ativo = true;
    buscarPerfilPublicoApi(token, id)
      .then((dados) => { if (ativo) setPerfil(dados); })
      .catch((erroCapturado) => {
        if (ativo) setErro(erroCapturado instanceof Error ? erroCapturado.message : "Não foi possível carregar este perfil.");
      });
    return () => { ativo = false; };
  }, [id]);

  if (erro) {
    return (
      <main className={layoutStyles.estadoPerfil}>
        <h1>Não foi possível abrir o perfil</h1>
        <p>{erro}</p>
        <Link href="/ranking">Voltar ao ranking</Link>
      </main>
    );
  }

  if (!perfil) {
    return <main className={layoutStyles.estadoPerfil}><p>Carregando perfil...</p></main>;
  }

  return (
    <main className={layoutStyles.paginaPerfil}>
      <div className={layoutStyles.areaPerfil}>
        <div className={layoutStyles.conteudoPerfil}>
          <Link href="/ranking" className={layoutStyles.linkVoltarRanking}>
            <ArrowLeft aria-hidden="true" /> Voltar ao ranking
          </Link>
          <header className={layoutStyles.cabecalhoPerfil}>
            <p className={layoutStyles.sobretitulo}>Conta do jogador</p>
            <h1>Perfil de {perfil.nome}</h1>
            <p>Identidade e progresso na arena.</p>
          </header>

          <div className={layoutStyles.gradePerfil}>
            <div className={layoutStyles.colunaPrincipal}>
              <CardUsuarioPublico perfil={perfil} />
              <HistoricoPartidasPerfil historico={perfil.historico} oculto={perfil.historicoOculto} />
            </div>
            <aside className={layoutStyles.colunaLateral}>
              <ResumoContaPublico perfil={perfil} />
            </aside>
          </div>
        </div>
      </div>
    </main>
  );
}
