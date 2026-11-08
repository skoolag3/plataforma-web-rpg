"use client";

import { nomeCategoriaNoticia } from "../../../lib/noticias";
import {
  Download,
  FileText,
  Link2,
  Pencil,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  atualizarAdminNoticia,
  criarAdminNoticia,
  listarAdminNoticias,
  removerAdminNoticia,
  uploadNoticiaImagem,
  type AdminNoticia,
  type AnexoNoticia,
  type SalvarAdminNoticiaPayload,
} from "../../../lib/admin";
import { SelectPadrao } from "../../../components/ui/controlesFormulario";
import { SwitchToggle } from "../../../../components/ui/switch";
import AnimatedFileUpload from "@/components/ui/animated-file-upload";
import styles from "../../../styles/admin/adminNoticias.module.css";
import sharedStyles from "../../../styles/admin/adminShared.module.css";
import {
  notificarErro,
  notificarSucesso,
} from "../../../components/notificacoesGlobais";
import { AdminLayout, NomeComAlerta } from "../shared/adminShared";

const formularioVazio: SalvarAdminNoticiaPayload = {
  titulo: "",
  resumo: "",
  conteudo: "",
  categoria: "NOVIDADE",
  anexos: [],
  publicada: false,
};

export function AdminNoticias() {
  const [noticias, setNoticias] = useState<AdminNoticia[]>([]);
  const [form, setForm] = useState(formularioVazio);
  const [editando, setEditando] = useState<string | null>(null);
  const [editorAberto, setEditorAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [excluindo, setExcluindo] = useState<AdminNoticia | null>(null);
  const [imagemInputVersao, setImagemInputVersao] = useState(0);
  const [confirmarRemoverImagem, setConfirmarRemoverImagem] = useState(false);
  const [portalPronto, setPortalPronto] = useState(false);
  const campoTituloRef = useRef<HTMLInputElement>(null);
  const btnCriarRef = useRef<HTMLButtonElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPortalPronto(true);
    void carregar();
  }, []);

  useEffect(() => {
    if (erro) notificarErro(erro);
  }, [erro]);

  useEffect(() => {
    if (!editorAberto) return;
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    campoTituloRef.current?.focus();
    function fecharComEscape(evento: KeyboardEvent) {
      if (evento.key === "Escape") {
        if (confirmarRemoverImagem) {
          setConfirmarRemoverImagem(false);
          return;
        }
        fecharEditor();
      }
    }
    document.addEventListener("keydown", fecharComEscape);
    return () => {
      document.body.style.overflow = overflowAnterior;
      document.removeEventListener("keydown", fecharComEscape);
    };
  }, [editorAberto, confirmarRemoverImagem]);

  async function carregar() {
    try {
      setNoticias(await listarAdminNoticias());
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao carregar notícias.");
    }
  }

  function atualizar<K extends keyof SalvarAdminNoticiaPayload>(
    campo: K,
    valor: SalvarAdminNoticiaPayload[K],
  ) {
    setForm((atual) => ({ ...atual, [campo]: valor }));
  }

  function novo() {
    setEditando(null);
    setForm(formularioVazio);
    setErro("");
    setConfirmarRemoverImagem(false);
    setImagemInputVersao((versao) => versao + 1);
    setEditorAberto(true);
  }

  function fecharEditor() {
    setEditando(null);
    setForm(formularioVazio);
    setErro("");
    setConfirmarRemoverImagem(false);
    setEditorAberto(false);
    btnCriarRef.current?.focus();
  }

  function editar(noticia: AdminNoticia) {
    setEditando(noticia.id);
    setEditorAberto(true);
    setConfirmarRemoverImagem(false);
    setImagemInputVersao((versao) => versao + 1);
    setForm({
      titulo: noticia.titulo,
      resumo: noticia.resumo,
      conteudo: noticia.conteudo,
      imagem: noticia.imagem ?? undefined,
      categoria: noticia.categoria,
      anexos: noticia.anexos ?? [],
      publicada: noticia.publicada,
    });
  }

  async function enviarImagem(arquivos: File[]) {
    const arquivo = arquivos[0];
    if (!arquivo) return;
    const dados = new FormData();
    dados.append("imagem", arquivo);
    setSalvando(true);
    try {
      const resposta = await uploadNoticiaImagem(dados);
      atualizar("imagem", resposta.url);
      setImagemInputVersao((versao) => versao + 1);
      notificarSucesso("Imagem de capa atualizada.");
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro no upload.");
    } finally {
      setSalvando(false);
    }
  }

  function removerImagemCapa() {
    atualizar("imagem", undefined);
    setImagemInputVersao((versao) => versao + 1);
    setConfirmarRemoverImagem(false);
    notificarSucesso("Imagem de capa removida da publicação.");
  }

  async function baixarImagem(url: string, nome: string) {
    try {
      const resposta = await fetch(url);
      if (!resposta.ok) throw new Error();
      const arquivo = URL.createObjectURL(await resposta.blob());
      const link = document.createElement("a");
      link.href = arquivo;
      const tipo = resposta.headers.get("content-type") ?? "";
      const extensao = tipo.includes("jpeg")
        ? "jpg"
        : tipo.includes("webp")
          ? "webp"
          : "png";
      const nomeLimpo = nome
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9_-]+/g, "-")
        .replace(/^-+|-+$/g, "");
      link.download = `${nomeLimpo || "noticia-capa"}.${extensao}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(arquivo), 1000);
      notificarSucesso("Download iniciado.");
    } catch {
      const link = document.createElement("a");
      link.href = url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.download = `${nome || "noticia-capa"}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    }
  }

  function atualizarAnexo(
    indice: number,
    campo: keyof AnexoNoticia,
    valor: string,
  ) {
    atualizar(
      "anexos",
      form.anexos.map((item, i) =>
        i === indice ? { ...item, [campo]: valor } : item,
      ),
    );
  }

  async function salvar() {
    setSalvando(true);
    setErro("");
    try {
      if (editando) await atualizarAdminNoticia(editando, form);
      else await criarAdminNoticia(form);
      notificarSucesso(
        editando ? "Publicação atualizada." : "Publicação criada.",
      );
      fecharEditor();
      await carregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao salvar notícia.");
    } finally {
      setSalvando(false);
    }
  }

  async function remover() {
    if (!excluindo) return;
    setSalvando(true);
    try {
      await removerAdminNoticia(excluindo.id);
      notificarSucesso("Publicação removida.");
      if (editando === excluindo.id) fecharEditor();
      setExcluindo(null);
      await carregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao remover publicação.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <AdminLayout
      title="Notícias e propaganda"
      subtitle="Crie chamadas para a página inicial e conteúdos completos por assunto."
    >
      <div className={styles.layout}>
        <section className={`${sharedStyles.cartasListaPanel} ${styles.lista}`}>
          <header className={sharedStyles.cartasListaTopo}>
            <div>
              <strong>Publicações</strong>
              <small>
                {noticias.length}{" "}
                {noticias.length === 1 ? "cadastrada" : "cadastradas"}
              </small>
            </div>
            <button ref={btnCriarRef} className={sharedStyles.primaryBtn} onClick={novo}>
              <Plus /> Criar publicação
            </button>
          </header>
          <div className={sharedStyles.tableWrap}>
            {erro && !editorAberto ? (
              <p className={styles.erroLista}>{erro}</p>
            ) : null}
            <table className={styles.tabelaNoticias}>
              <thead>
                <tr>
                  <th>Publicação</th>
                  <th>Categoria</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {noticias.map((noticia) => (
                  <tr key={noticia.id}>
                    <td data-label="Publicação">
                      <div className={styles.noticiaPrincipal}>
                        {noticia.imagem ? (
                          <Image
                            src={noticia.imagem}
                            alt=""
                            width={52}
                            height={36}
                          />
                        ) : (
                          <span>
                            <FileText />
                          </span>
                        )}
                        <div>
                          <NomeComAlerta
                            nome={noticia.titulo}
                            tom="amarelo"
                            motivo={
                              !noticia.publicada
                                ? "Notícia em rascunho (não visível na página inicial)."
                                : null
                            }
                          />
                          <small>{noticia.resumo}</small>
                        </div>
                      </div>
                    </td>
                    <td data-label="Categoria">
                      <span className={styles.categoria}>
                        {nomeCategoriaNoticia(noticia.categoria)}
                      </span>
                    </td>
                    <td data-label="Status">
                      <span
                        className={
                          noticia.publicada
                            ? sharedStyles.statusAtivo
                            : sharedStyles.statusInativo
                        }
                      >
                        {noticia.publicada ? "Publicada" : "Rascunho"}
                      </span>
                    </td>
                    <td data-label="Ações">
                      <nav className={sharedStyles.rowActions}>
                        <button onClick={() => editar(noticia)} title="Editar">
                          <Pencil />
                        </button>
                        <button
                          onClick={() => setExcluindo(noticia)}
                          title="Remover"
                        >
                          <Trash2 />
                        </button>
                      </nav>
                    </td>
                  </tr>
                ))}
                {!noticias.length ? (
                  <tr className={sharedStyles.emptyTableRow}>
                    <td colSpan={4}>Nenhuma notícia cadastrada.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>

      </div>

        {editorAberto ? (
          <div className={styles.modalFundo} role="presentation">
          <section className={styles.formulario} role="dialog" aria-modal="true" aria-labelledby="titulo-editor-noticia">
            <header>
              <div>
                <strong id="titulo-editor-noticia">
                  {editando ? "Editar publicação" : "Nova publicação"}
                </strong>
                <small>
                  O resumo aparece no banner; o conteúdo completo fica na página
                  interna.
                </small>
              </div>
              <button type="button" onClick={fecharEditor} title="Fechar editor" aria-label="Fechar editor">
                <X />
              </button>
            </header>
            <div className={styles.camposDuplos}>
              <label>
                <span>Título</span>
                <input
                  ref={campoTituloRef}
                  value={form.titulo}
                  onChange={(e) => atualizar("titulo", e.target.value)}
                />
              </label>
              <div className={styles.campoDropdown}>
                <span>Categoria</span>
                <SelectPadrao
                  valor={form.categoria}
                  aoAlterar={(valor) =>
                    atualizar(
                      "categoria",
                      valor as SalvarAdminNoticiaPayload["categoria"],
                    )
                  }
                  placeholder="Categoria"
                  opcoes={[
                    "NOVIDADE",
                    "BALANCE",
                    "EVENTO",
                    "PROMOCAO",
                    "AVISO",
                  ].map((categoria) => ({
                    valor: categoria,
                    label: nomeCategoriaNoticia(categoria),
                  }))}
                />
              </div>
            </div>
            <label>
              <span>Resumo do banner</span>
              <textarea
                rows={2}
                maxLength={320}
                value={form.resumo}
                onChange={(e) => atualizar("resumo", e.target.value)}
              />
            </label>
            <label>
              <span>Conteúdo completo</span>
              <textarea
                rows={6}
                value={form.conteudo}
                onChange={(e) => atualizar("conteudo", e.target.value)}
              />
            </label>
            <div className={styles.campoImagemEditor}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                style={{ display: "none" }}
                onChange={(e) => {
                  const files = Array.from(e.target.files ?? []);
                  if (files.length) void enviarImagem(files);
                  e.target.value = "";
                }}
              />
              <div className={styles.imagemCampo}>
                <AnimatedFileUpload
                  key={imagemInputVersao}
                  accept="image/png,image/jpeg,image/webp"
                  maxSize={5 * 1024 * 1024}
                  rotulo={form.imagem ? "Modificar imagem" : "Imagem de capa"}
                  ajuda={
                    form.imagem
                      ? "Arraste ou clique para trocar a imagem de capa · PNG, JPG ou WEBP"
                      : "Arraste ou clique para escolher · PNG, JPG ou WEBP · Até 5 MB"
                  }
                  disabled={salvando}
                  onFilesSelected={(arquivos) => {
                    if (arquivos.length) void enviarImagem(arquivos);
                  }}
                />
                {form.imagem ? (
                  <div className={styles.previaImagemWrapper}>
                    <Image
                      src={form.imagem}
                      alt="Prévia da capa"
                      width={220}
                      height={110}
                    />
                  </div>
                ) : null}
              </div>
              {form.imagem ? (
                <div className={styles.acoesImagem}>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    title="Escolher outra imagem para substituir a capa"
                  >
                    <Pencil size={13} aria-hidden="true" />
                    Trocar imagem
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      void baixarImagem(
                        form.imagem!,
                        `${form.titulo || "noticia"}-capa`,
                      )
                    }
                    title="Baixar imagem atual para o seu dispositivo"
                  >
                    <Download size={13} aria-hidden="true" />
                    Baixar imagem
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmarRemoverImagem(true)}
                    title="Remover imagem de capa desta publicação"
                  >
                    <Trash2 size={13} aria-hidden="true" />
                    Remover imagem
                  </button>
                </div>
              ) : null}
            </div>
            <div className={styles.anexos}>
              <header>
                <strong>
                  <Link2 /> Anexos
                </strong>
                <button
                  onClick={() =>
                    atualizar("anexos", [
                      ...form.anexos,
                      { titulo: "", url: "" },
                    ])
                  }
                >
                  <Plus /> Adicionar
                </button>
              </header>
              {form.anexos.map((anexo, indice) => (
                <div key={indice}>
                  <input
                    placeholder="Nome do anexo"
                    value={anexo.titulo}
                    onChange={(e) =>
                      atualizarAnexo(indice, "titulo", e.target.value)
                    }
                  />
                  <input
                    placeholder="https://..."
                    value={anexo.url}
                    onChange={(e) =>
                      atualizarAnexo(indice, "url", e.target.value)
                    }
                  />
                  <button
                    onClick={() =>
                      atualizar(
                        "anexos",
                        form.anexos.filter((_, i) => i !== indice),
                      )
                    }
                  >
                    <X />
                  </button>
                </div>
              ))}
            </div>
            <div className={styles.publicar}>
              <SwitchToggle checked={form.publicada} onChange={(publicada) => atualizar("publicada", publicada)} label="Publicar na página inicial" />
            </div>
            <button
              className={styles.salvar}
              disabled={salvando}
              onClick={() => void salvar()}
            >
              <Save />
              {salvando
                ? "Salvando..."
                : editando
                  ? "Salvar alterações"
                  : "Criar publicação"}
            </button>
          </section>
          </div>
        ) : null}

      {excluindo ? (
        <div className={styles.modalFundo} role="presentation">
          <section
            className={styles.confirmarExclusao}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="titulo-excluir-noticia"
          >
            <Trash2 aria-hidden="true" />
            <h2 id="titulo-excluir-noticia">Excluir publicação?</h2>
            <p>“{excluindo.titulo}” será removida definitivamente.</p>
            <div>
              <button type="button" onClick={() => setExcluindo(null)}>
                Cancelar
              </button>
              <button
                type="button"
                disabled={salvando}
                onClick={() => void remover()}
              >
                {salvando ? "Excluindo..." : "Excluir publicação"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
      {confirmarRemoverImagem && portalPronto
        ? createPortal(
            <div
              className={styles.fundoConfirmacaoImagem}
              onMouseDown={(event) => {
                if (event.target === event.currentTarget)
                  setConfirmarRemoverImagem(false);
              }}
            >
              <section
                className={styles.confirmacaoImagem}
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="titulo-confirmar-remocao-capa"
                aria-describedby="descricao-confirmar-remocao-capa"
              >
                <h2 id="titulo-confirmar-remocao-capa">
                  Remover imagem de capa?
                </h2>
                <p id="descricao-confirmar-remocao-capa">
                  A prévia ficará sem essa imagem. A alteração será aplicada à publicação quando você clicar em Salvar.
                </p>
                <div className={styles.acoesConfirmacaoImagem}>
                  <button
                    type="button"
                    autoFocus
                    onClick={() => setConfirmarRemoverImagem(false)}
                  >
                    Cancelar
                  </button>
                  <button type="button" onClick={removerImagemCapa}>
                    Remover imagem
                  </button>
                </div>
              </section>
            </div>,
            document.body,
          )
        : null}
    </AdminLayout>
  );
}
