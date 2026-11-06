"use client";

import {
  ChevronLeft,
  ChevronRight,
  Copy,
  Pencil,
  Swords,
  Trophy,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { criarEstiloMolduraPerfil } from "../../../components/cartaMontada";
import VLabel8 from "@/components/ui/v-label-8";
import type { FotoCartaPerfil, MolduraConta, PerfilConta } from "../../../lib/perfil";
import styles from "../../../styles/perfil/cardUsuario.module.css";
import modalStyles from "../../../styles/perfil/modalPerfil.module.css";
import { ModalEdicao } from "./modalEdicao";

type PropsCardUsuario = {
  perfil: PerfilConta;
  molduras: MolduraConta[];
  fotosCartas: FotoCartaPerfil[];
  aoSelecionarFotoCarta: (idCarta: string) => Promise<string>;
  aoAtualizarNome: (nome: string) => Promise<string>;
  aoAtualizarBiografia: (biografia: string) => Promise<string>;
  aoSelecionarMoldura: (idMoldura: string) => Promise<string>;
};

export function CardUsuario({
  perfil,
  molduras,
  fotosCartas,
  aoSelecionarFotoCarta,
  aoAtualizarNome,
  aoAtualizarBiografia,
  aoSelecionarMoldura,
}: PropsCardUsuario) {
  const [copiado, setCopiado] = useState(false);
  const [editandoNome, setEditandoNome] = useState(false);
  const [modalPerfil, setModalPerfil] = useState<"bio" | "aparencia" | null>(null);
  const [abaAparencia, setAbaAparencia] = useState<"icone" | "moldura">("icone");
  const [paginaMolduras, setPaginaMolduras] = useState(1);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const ITENS_POR_PAGINA_MOLDURAS = 5;

  const moldurasOrdenadas = useMemo(() => {
    return molduras
      .filter((m) => m.obtida)
      .sort((a, b) => {
        const emUsoA = perfil.moldura === a.nome;
        const emUsoB = perfil.moldura === b.nome;
        if (emUsoA && !emUsoB) return -1;
        if (!emUsoA && emUsoB) return 1;

        const isPadraoA = a.id === "padrao" || a.nome.toLowerCase() === "padrão";
        const isPadraoB = b.id === "padrao" || b.nome.toLowerCase() === "padrão";
        if (isPadraoA && !isPadraoB) return -1;
        if (!isPadraoA && isPadraoB) return 1;

        return a.nome.localeCompare(b.nome, "pt-BR");
      });
  }, [molduras, perfil.moldura]);

  const totalPaginasMolduras = Math.ceil(moldurasOrdenadas.length / ITENS_POR_PAGINA_MOLDURAS) || 1;
  const moldurasPaginadas = moldurasOrdenadas.slice(
    (paginaMolduras - 1) * ITENS_POR_PAGINA_MOLDURAS,
    paginaMolduras * ITENS_POR_PAGINA_MOLDURAS,
  );

  function abrirAparencia() {
    setErro("");
    setAbaAparencia("icone");
    setPaginaMolduras(1);
    setModalPerfil("aparencia");
  }

  function escolherFoto(idCarta: string) {
    setSalvando(true);
    setErro("");
    void aoSelecionarFotoCarta(idCarta)
      .then(() => setModalPerfil(null))
      .catch((erroCapturado) => setErro(erroCapturado instanceof Error ? erroCapturado.message : "Não foi possível selecionar a foto."))
      .finally(() => setSalvando(false));
  }

  function escolherMoldura(idMoldura: string) {
    setSalvando(true);
    setErro("");
    void aoSelecionarMoldura(idMoldura)
      .then(() => setModalPerfil(null))
      .catch((erroCapturado) => setErro(erroCapturado instanceof Error ? erroCapturado.message : "Não foi possível selecionar a moldura."))
      .finally(() => setSalvando(false));
  }

  async function copiarId() {
    await navigator.clipboard.writeText(perfil.idUser);
    setCopiado(true);
    window.setTimeout(() => setCopiado(false), 1400);
  }

  return (
    <section className={styles.cardUsuario}>
      <div className={styles.identidadeUsuario}>
        <div className={styles.avatarArea}>
          <button
            type="button"
            aria-label="Personalizar ícone e moldura"
            title="Personalizar ícone e moldura"
            onClick={abrirAparencia}
            className={[
              styles.avatarUsuario,
              styles[perfil.molduraClasse] ?? "",
            ].join(" ")}
            style={
              { backgroundImage: `url("${perfil.avatarUrl ?? "/avatar-padrao.svg"}")` }
            }
          >
            <span className={styles.brilhoAvatar} />
          </button>
          {perfil.molduraUrl ? (
            <span
              className={styles.molduraCartaAvatar}
              style={{
                ...criarEstiloMolduraPerfil(perfil.molduraConfig),
                backgroundImage: `url("${perfil.molduraUrl}")`,
              }}
              aria-hidden="true"
            />
          ) : null}
          <button
            type="button"
            className={styles.btnEditarFoto}
            aria-label="Personalizar ícone e moldura"
            title="Personalizar ícone e moldura"
            onClick={abrirAparencia}
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

          <button type="button" className={styles.btnCopiarId} onClick={copiarId}>
            ID: {perfil.idUser}
            <Copy aria-hidden="true" />
            {copiado ? <small>Copiado</small> : null}
          </button>

        </div>
        <div className={styles.biografiaUsuario}>
          <span>Bio</span>
          <p>{perfil.biografia || "Adicione uma bio ao seu perfil."}</p>
          <button
            type="button"
            aria-label="Editar biografia"
            title="Editar biografia"
            onClick={() => setModalPerfil("bio")}
          >
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

      {modalPerfil === "aparencia" ? (
        <ModalEdicao
          titulo="Personalizar perfil"
          descricao="Escolha o ícone e a moldura do seu perfil."
          aoFechar={() => { if (!salvando) setModalPerfil(null); }}
        >
          <div className={styles.abasAparencia} role="tablist" aria-label="Personalização do perfil">
            <button type="button" role="tab" id="aba-icone" aria-controls="painel-icone" aria-selected={abaAparencia === "icone"} className={abaAparencia === "icone" ? styles.abaAtiva : ""} onClick={() => { setErro(""); setAbaAparencia("icone"); }}>Ícone</button>
            <button type="button" role="tab" id="aba-moldura" aria-controls="painel-moldura" aria-selected={abaAparencia === "moldura"} className={abaAparencia === "moldura" ? styles.abaAtiva : ""} onClick={() => { setErro(""); setPaginaMolduras(1); setAbaAparencia("moldura"); }}>Moldura</button>
          </div>
          {abaAparencia === "icone" ? <div id="painel-icone" role="tabpanel" aria-labelledby="aba-icone">
          <div className={styles.listaFotosCartas}>
              <button
                type="button"
                className={!perfil.avatarUrl ? styles.fotoSelecionada : ""}
                aria-pressed={!perfil.avatarUrl}
                disabled={salvando}
                onClick={() => escolherFoto("padrao")}
              >
                <img src="/avatar-padrao.svg" alt="" />
                <span>Foto padrão</span>
                <small>{!perfil.avatarUrl ? "Em uso" : "Disponível"}</small>
              </button>
              {fotosCartas.map((carta) => (
                <button
                  key={carta.id}
                  type="button"
                  className={perfil.avatarUrl === carta.fotoUrl ? styles.fotoSelecionada : ""}
                  aria-pressed={perfil.avatarUrl === carta.fotoUrl}
                  disabled={salvando}
                  onClick={() => escolherFoto(carta.id)}
                >
                  <img src={carta.fotoUrl} alt="" />
                  <span>{carta.nome}</span>
                  <small>{perfil.avatarUrl === carta.fotoUrl ? "Em uso" : "Carta obtida"}</small>
                </button>
              ))}
          </div>
          {fotosCartas.length === 0 ? <p className={styles.avisoFotos}>As fotos das cartas que você obtiver vão aparecer aqui.</p> : null}
          </div> : <div id="painel-moldura" role="tabpanel" aria-labelledby="aba-moldura">
            <div className={styles.listaMolduras}>
              {moldurasPaginadas.map((moldura) => (
                <button type="button" key={moldura.id} disabled={salvando} aria-pressed={perfil.moldura === moldura.nome} onClick={() => escolherMoldura(moldura.id)}>
                  <span className={[styles.amostraMoldura, styles[moldura.classeCss] ?? ""].join(" ")}>
                    {moldura.imagemUrl ? <i className={styles.imagemAmostraMoldura} style={{ ...criarEstiloMolduraPerfil(moldura.configVisual), backgroundImage: `url("${moldura.imagemUrl}")` }} aria-hidden="true" /> : null}
                  </span>
                  <strong>{moldura.nome}</strong>
                  <small>{perfil.moldura === moldura.nome ? "Em uso" : "Disponível"}</small>
                </button>
              ))}
            </div>
            {moldurasOrdenadas.length === 0 ? <p className={styles.avisoFotos}>As molduras que você obtiver vão aparecer aqui.</p> : null}

            {totalPaginasMolduras > 1 ? (
              <nav className={styles.paginacao} aria-label="Paginação de molduras">
                <button
                  type="button"
                  className={styles.btnPagina}
                  disabled={paginaMolduras <= 1 || salvando}
                  onClick={() => setPaginaMolduras((p) => p - 1)}
                >
                  <ChevronLeft aria-hidden="true" /> Anterior
                </button>
                <span>
                  Página {paginaMolduras} de {totalPaginasMolduras}
                </span>
                <button
                  type="button"
                  className={styles.btnPagina}
                  disabled={paginaMolduras >= totalPaginasMolduras || salvando}
                  onClick={() => setPaginaMolduras((p) => p + 1)}
                >
                  Próxima <ChevronRight aria-hidden="true" />
                </button>
              </nav>
            ) : null}
          </div>}
          {erro ? <p className={modalStyles.erroForm} role="alert">{erro}</p> : null}
        </ModalEdicao>
      ) : null}

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
            <VLabel8
              rotulo="Biografia"
              name="biografia"
              defaultValue={perfil.biografia}
              maxLength={280}
              rows={5}
              placeholder="Conte um pouco sobre você..."
            />
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

    </section>
  );
}
