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
import styles from "../../styles/admin/adminNoticias.module.css";
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
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    void carregar();
  }, []);

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
  }

  function editar(noticia: AdminNoticia) {
    setEditando(noticia.id);
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
      novo();
      await carregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao salvar notícia.");
    } finally {
      setSalvando(false);
    }
  }

  async function remover(id: string) {
    if (!window.confirm("Remover esta notícia definitivamente?")) return;
    await removerAdminNoticia(id);
    if (editando === id) novo();
    await carregar();
  }

  return (
    <AdminLayout
      title="Notícias e propaganda"
      subtitle="Crie chamadas para a página inicial e conteúdos completos por assunto."
    >
      <div className={styles.layout}>
        <section className={styles.lista}>
          <header>
            <div>
              <strong>Publicações</strong>
              <small>{noticias.length} cadastradas</small>
            </div>
            <button onClick={novo}>
              <Plus /> Nova
            </button>
          </header>
          <div>
            {noticias.map((noticia) => (
              <article key={noticia.id}>
                {noticia.imagem ? (
                  <Image src={noticia.imagem} alt="" width={100} height={64} />
                ) : (
                  <span>
                    <FileText />
                  </span>
                )}
                <div>
                  <small>
                    {noticia.categoria} ·{" "}
                    {noticia.publicada ? "Publicada" : "Rascunho"}
                  </small>
                  <strong>{noticia.titulo}</strong>
                  <p>{noticia.resumo}</p>
                </div>
                <nav>
                  <button onClick={() => editar(noticia)} title="Editar">
                    <Pencil />
                  </button>
                  <button
                    onClick={() => void remover(noticia.id)}
                    title="Remover"
                  >
                    <Trash2 />
                  </button>
                </nav>
              </article>
            ))}
            {!noticias.length ? (
              <p className={styles.vazio}>Nenhuma notícia cadastrada.</p>
            ) : null}
          </div>
        </section>

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
            {editando ? (
              <button onClick={novo}>
                <X />
              </button>
            ) : null}
          </header>
          <div className={styles.camposDuplos}>
            <label>
              <span>Título</span>
              <input
                value={form.titulo}
                onChange={(e) => atualizar("titulo", e.target.value)}
              />
            </label>
            <label>
              <span>Categoria</span>
              <select
                value={form.categoria}
                onChange={(e) =>
                  atualizar(
                    "categoria",
                    e.target.value as SalvarAdminNoticiaPayload["categoria"],
                  )
                }
              >
                <option>NOVIDADE</option>
                <option>BALANCE</option>
                <option>EVENTO</option>
                <option>AVISO</option>
              </select>
            </label>
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
              rows={8}
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
              <Image src={form.imagem} alt="Prévia" width={220} height={110} />
            ) : null}
          </div>
          <div className={styles.anexos}>
            <header>
              <strong>
                <Link2 /> Anexos
              </strong>
              <button
                onClick={() =>
                  atualizar("anexos", [...form.anexos, { titulo: "", url: "" }])
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
          {erro ? <p className={styles.erro}>{erro}</p> : null}
          <button
            className={styles.salvar}
            disabled={salvando}
            onClick={() => void salvar()}
          >
            <Save /> {salvando ? "Salvando..." : "Salvar publicação"}
          </button>
        </section>
      </div>
    </AdminLayout>
  );
}
