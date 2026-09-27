"use client";

import {
  FileText,
  ImagePlus,
  Link2,
  Pencil,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useState, type ChangeEvent } from "react";
import {
  atualizarAdminNoticia,
  criarAdminNoticia,
  listarAdminNoticias,
  removerAdminNoticia,
  uploadNoticiaImagem,
  type AdminNoticia,
  type AnexoNoticia,
  type SalvarAdminNoticiaPayload,
} from "../../lib/admin";
import { SelectPadrao } from "../../components/ui/controlesFormulario";
import styles from "../../styles/admin/adminNoticias.module.css";
import sharedStyles from "../../styles/admin/adminShared.module.css";
import {
  notificarErro,
  notificarSucesso,
} from "../../components/notificacoesGlobais";
import { AdminLayout } from "./adminShared";

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

  useEffect(() => {
    void carregar();
  }, []);

  useEffect(() => {
    if (erro) notificarErro(erro);
  }, [erro]);

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
    setEditorAberto(true);
  }

  function fecharEditor() {
    setEditando(null);
    setForm(formularioVazio);
    setErro("");
    setEditorAberto(false);
  }

  function editar(noticia: AdminNoticia) {
    setEditando(noticia.id);
    setEditorAberto(true);
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

  async function enviarImagem(event: ChangeEvent<HTMLInputElement>) {
    const arquivo = event.target.files?.[0];
    if (!arquivo) return;
    const dados = new FormData();
    dados.append("imagem", arquivo);
    setSalvando(true);
    try {
      atualizar("imagem", (await uploadNoticiaImagem(dados)).url);
      notificarSucesso("Imagem de capa enviada.");
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro no upload.");
    } finally {
      setSalvando(false);
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
      <div
        className={`${styles.layout} ${!editorAberto ? styles.layoutFechado : ""}`}
      >
        <section className={`${sharedStyles.cartasListaPanel} ${styles.lista}`}>
          <header className={sharedStyles.cartasListaTopo}>
            <div>
              <strong>Publicações</strong>
              <small>
                {noticias.length}{" "}
                {noticias.length === 1 ? "cadastrada" : "cadastradas"}
              </small>
            </div>
            <button className={sharedStyles.primaryBtn} onClick={novo}>
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
                    <td>
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
                          <strong>{noticia.titulo}</strong>
                          <small>{noticia.resumo}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={styles.categoria}>
                        {noticia.categoria}
                      </span>
                    </td>
                    <td>
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
                    <td>
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

        {editorAberto ? (
          <section className={styles.formulario}>
            <header>
              <div>
                <strong>
                  {editando ? "Editar publicação" : "Nova publicação"}
                </strong>
                <small>
                  O resumo aparece no banner; o conteúdo completo fica na página
                  interna.
                </small>
              </div>
              <button onClick={fecharEditor} title="Fechar editor">
                <X />
              </button>
            </header>
            <div className={styles.camposDuplos}>
              <label>
                <span>Título</span>
                <input
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
                    label: categoria,
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
            <div className={styles.imagemCampo}>
              <label>
                <ImagePlus />
                <span>Imagem de capa</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => void enviarImagem(e)}
                />
              </label>
              {form.imagem ? (
                <Image
                  src={form.imagem}
                  alt="Prévia"
                  width={220}
                  height={110}
                />
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
            <label className={styles.publicar}>
              <input
                type="checkbox"
                checked={form.publicada}
                onChange={(e) => atualizar("publicada", e.target.checked)}
              />
              <span>Publicar na página inicial</span>
            </label>
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
        ) : null}
      </div>

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
    </AdminLayout>
  );
}
