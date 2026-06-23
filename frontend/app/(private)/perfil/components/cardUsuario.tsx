"use client";

import {
  Copy,
  Frame,
  Image as ImagemIcone,
  Pencil,
  ShieldCheck,
  Swords,
  Trophy,
  UserRound,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import type { MolduraConta, PerfilConta } from "../../../lib/perfil";
import styles from "../../../styles/perfil/cardUsuario.module.css";
import modalStyles from "../../../styles/perfil/modalPerfil.module.css";
import { ModalEdicao } from "./modalEdicao";

type PropsCardUsuario = {
  perfil: PerfilConta;
  molduras: MolduraConta[];
  aoAtualizarNome: (nome: string) => Promise<string>;
  aoAtualizarBiografia: (biografia: string) => Promise<string>;
  aoSelecionarMoldura: (idMoldura: string) => Promise<string>;
  aoEnviarImagem: (
    tipo: "avatar" | "banner",
    arquivo: File,
  ) => Promise<string>;
};

export function CardUsuario({
  perfil,
  molduras,
  aoAtualizarNome,
  aoAtualizarBiografia,
  aoSelecionarMoldura,
  aoEnviarImagem,
}: PropsCardUsuario) {
  const [copiado, setCopiado] = useState(false);
  const [editandoNome, setEditandoNome] = useState(false);
  const [modalPerfil, setModalPerfil] = useState<"bio" | "moldura" | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const inputAvatar = useRef<HTMLInputElement>(null);
  const inputBanner = useRef<HTMLInputElement>(null);

  async function copiarId() {
    await navigator.clipboard.writeText(perfil.idUser);
    setCopiado(true);
    window.setTimeout(() => setCopiado(false), 1400);
  }

  return (
    <section className={styles.cardUsuario}>
      <div
        className={styles.bannerPerfil}
        style={
          perfil.bannerUrl
            ? { backgroundImage: `url("${perfil.bannerUrl}")` }
            : undefined
        }
      >
        <ImagemIcone aria-hidden="true" />
        <button
          type="button"
          aria-label="Editar banner"
          title={
            perfil.storageConfigurado
              ? "Editar banner"
              : "Storage ainda não configurado"
          }
          disabled={!perfil.storageConfigurado}
          onClick={() => inputBanner.current?.click()}
        >
          <Pencil aria-hidden="true" />
        </button>
      </div>

      <div className={styles.identidadeUsuario}>
        <div className={styles.avatarArea}>
          <div
            className={[
              styles.avatarUsuario,
              styles[perfil.molduraClasse] ?? "",
            ].join(" ")}
            style={
              perfil.avatarUrl
                ? { backgroundImage: `url("${perfil.avatarUrl}")` }
                : undefined
            }
          >
            <span className={styles.brilhoAvatar} />
            <UserRound aria-hidden="true" />
          </div>
          <button
            type="button"
            className={styles.btnEditarAvatar}
            aria-label="Editar avatar"
            title={
              perfil.storageConfigurado
                ? "Editar avatar"
                : "Storage ainda não configurado"
            }
            disabled={!perfil.storageConfigurado}
            onClick={() => inputAvatar.current?.click()}
          >
            <Pencil aria-hidden="true" />
          </button>
        </div>

        <div className={styles.dadosUsuario}>
          <div className={styles.nomeUsuario}>
            <h2>{perfil.user}</h2>
            <button
              type="button"
              onClick={() => setEditandoNome(true)}
              aria-label="Editar nome de usuário"
            >
              <Pencil aria-hidden="true" />
            </button>
          </div>
          <span className={styles.nivelUsuario}>
            <ShieldCheck aria-hidden="true" />
            Nível {perfil.nivel}
          </span>

          <button type="button" className={styles.btnCopiarId} onClick={copiarId}>
            ID: {perfil.idUser}
            <Copy aria-hidden="true" />
            {copiado ? <small>Copiado</small> : null}
          </button>

          <div className={styles.biografiaUsuario}>
            <p>{perfil.biografia}</p>
            <button
              type="button"
              aria-label="Editar biografia"
              title="Editar biografia"
              onClick={() => setModalPerfil("bio")}
            >
              <Pencil aria-hidden="true" />
            </button>
          </div>

          <button
            type="button"
            className={styles.btnMoldura}
            title="Selecionar moldura"
            onClick={() => setModalPerfil("moldura")}
          >
            <Frame aria-hidden="true" />
            Moldura: {perfil.moldura}
            <Pencil aria-hidden="true" />
          </button>
        </div>
      </div>

      <dl className={styles.listaStats}>
        <div className={styles.statVitoria}>
          <Swords aria-hidden="true" />
          <span>
            <dt>Vitórias</dt>
            <dd>{perfil.vitorias}</dd>
          </span>
        </div>
        <div className={styles.statDerrota}>
          <X aria-hidden="true" />
          <span>
            <dt>Derrotas</dt>
            <dd>{perfil.derrotas}</dd>
          </span>
        </div>
        <div className={styles.statRanking}>
          <Trophy aria-hidden="true" />
          <span>
            <dt>Ranking</dt>
            <dd>{perfil.ranking.toLocaleString("pt-BR")} pts</dd>
          </span>
        </div>
      </dl>

      <input
        ref={inputAvatar}
        className={styles.inputArquivo}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={(evento) => {
          const arquivo = evento.target.files?.[0];
          if (arquivo) void aoEnviarImagem("avatar", arquivo);
        }}
      />
      <input
        ref={inputBanner}
        className={styles.inputArquivo}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={(evento) => {
          const arquivo = evento.target.files?.[0];
          if (arquivo) void aoEnviarImagem("banner", arquivo);
        }}
      />

      {editandoNome ? (
        <ModalEdicao
          titulo="Editar nome de usuário"
          descricao="Escolha o nome que será exibido no seu perfil."
          aoFechar={() => setEditandoNome(false)}
        >
          <form
            className={modalStyles.formModal}
            onSubmit={(evento) => {
              evento.preventDefault();
              const formulario = new FormData(evento.currentTarget);
              const nome = String(formulario.get("nome") ?? "");

              setErro("");
              setSalvando(true);
              aoAtualizarNome(nome)
                .then(() => setEditandoNome(false))
                .catch((erroCapturado) =>
                  setErro(
                    erroCapturado instanceof Error
                      ? erroCapturado.message
                      : "Não foi possível atualizar o nome.",
                  ),
                )
                .finally(() => setSalvando(false));
            }}
          >
            <label>
              Nome de usuário
              <input
                name="nome"
                defaultValue={perfil.user}
                minLength={3}
                maxLength={30}
                required
              />
            </label>
            {erro ? <p className={modalStyles.erroForm}>{erro}</p> : null}
            <div className={modalStyles.acoesModal}>
              <button
                type="button"
                onClick={() => setEditandoNome(false)}
                disabled={salvando}
              >
                Cancelar
              </button>
              <button type="submit" disabled={salvando}>
                {salvando ? "Salvando..." : "Salvar nome"}
              </button>
            </div>
          </form>
        </ModalEdicao>
      ) : null}

      {modalPerfil === "bio" ? (
        <ModalEdicao
          titulo="Editar biografia"
          descricao="Use até 280 caracteres."
          aoFechar={() => setModalPerfil(null)}
        >
          <form
            className={modalStyles.formModal}
            onSubmit={(evento) => {
              evento.preventDefault();
              const dados = new FormData(evento.currentTarget);
              setSalvando(true);
              setErro("");
              aoAtualizarBiografia(String(dados.get("biografia") ?? ""))
                .then(() => setModalPerfil(null))
                .catch((e) =>
                  setErro(e instanceof Error ? e.message : "Erro ao salvar."),
                )
                .finally(() => setSalvando(false));
            }}
          >
            <label>
              Biografia
              <textarea
                name="biografia"
                defaultValue={perfil.biografia}
                maxLength={280}
                rows={5}
              />
            </label>
            {erro ? <p className={modalStyles.erroForm}>{erro}</p> : null}
            <div className={modalStyles.acoesModal}>
              <button type="button" onClick={() => setModalPerfil(null)}>
                Cancelar
              </button>
              <button type="submit" disabled={salvando}>
                Salvar
              </button>
            </div>
          </form>
        </ModalEdicao>
      ) : null}

      {modalPerfil === "moldura" ? (
        <ModalEdicao
          titulo="Selecionar moldura"
          descricao="Somente molduras obtidas podem ser usadas."
          aoFechar={() => setModalPerfil(null)}
        >
          <div className={styles.listaMolduras}>
            {molduras.map((moldura) => (
              <button
                type="button"
                key={moldura.id}
                disabled={!moldura.obtida}
                onClick={() =>
                  void aoSelecionarMoldura(moldura.id).then(() =>
                    setModalPerfil(null),
                  )
                }
              >
                <span className={styles[moldura.classeCss] ?? ""} />
                <strong>{moldura.nome}</strong>
                <small>
                  {moldura.obtida
                    ? "Disponível"
                    : `${moldura.precoMoedas.toLocaleString("pt-BR")} moedas`}
                </small>
              </button>
            ))}
          </div>
        </ModalEdicao>
      ) : null}
    </section>
  );
}
