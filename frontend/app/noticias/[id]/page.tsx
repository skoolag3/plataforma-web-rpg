"use client";

import { nomeCategoriaNoticia } from "../../lib/noticias";
import { ArrowLeft, ExternalLink, FileText, Menu } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { buscarNoticia, listarNoticias, type NoticiaPublica } from "../../lib/noticias";
import styles from "../../styles/noticiaDetalhe.module.css";

export default function NoticiaDetalhePage() {
  const { id } = useParams<{ id: string }>();
  const [noticia, setNoticia] = useState<NoticiaPublica | null>(null);
  const [catalogo, setCatalogo] = useState<NoticiaPublica[]>([]);
  const [catalogoAberto, setCatalogoAberto] = useState(false);
  const [erro, setErro] = useState("");
  const [erroCatalogo, setErroCatalogo] = useState("");

  useEffect(() => {
    let ativo = true;
    buscarNoticia(id)
      .then((dados) => {
        if (!ativo) return;
        setNoticia(dados);
        setErro("");
      })
      .catch((e) => {
        if (ativo) setErro(e instanceof Error ? e.message : "Notícia não encontrada.");
      });
    return () => { ativo = false; };
  }, [id]);

  useEffect(() => {
    listarNoticias()
      .then((itens) => setCatalogo([...itens].sort((a, b) =>
        new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime(),
      )))
      .catch(() => setErroCatalogo("Não foi possível carregar o catálogo."));
  }, []);

  function alternarCatalogo() {
    setCatalogoAberto((aberto) => !aberto);
  }

  if (erro)
    return (
      <main className={styles.estado}>
        <p>{erro}</p>
        <Link href="/">Voltar ao início</Link>
      </main>
    );
  if (!noticia || noticia.id !== id)
    return <main className={styles.estado}>Carregando publicação...</main>;

  return (
    <main className={styles.pagina}>
      <nav className={styles.navegacaoTopo}>
        <Link href="/#noticias">
          <ArrowLeft /> Voltar às notícias
        </Link>
      </nav>
      <div className={styles.layout} data-aberto={catalogoAberto}>
        <aside id="catalogo-noticias" className={styles.catalogo} data-aberto={catalogoAberto}>
          <button type="button" className={styles.botaoCatalogo} onClick={alternarCatalogo} aria-label={catalogoAberto ? "Fechar catálogo de notícias" : "Abrir catálogo de notícias"} aria-expanded={catalogoAberto} aria-controls="conteudo-catalogo-noticias"><Menu aria-hidden="true" /></button>
          <div id="conteudo-catalogo-noticias" className={styles.catalogoConteudo} hidden={!catalogoAberto}>
          <h2>Notícias</h2>
          <p className={styles.catalogoDescricao}>Todas as publicações, das mais recentes às mais antigas.</p>
          {erroCatalogo ? <p>{erroCatalogo}</p> : catalogo.length === 0 ? <p>Carregando notícias...</p> : (
            <ol>
              {catalogo.map((item) => (
                <li key={item.id}>
                  <Link href={`/noticias/${item.id}`} aria-current={item.id === id ? "page" : undefined} onClick={() => setCatalogoAberto(false)}>
                    {item.imagem ? <Image src={item.imagem} alt="" width={84} height={64} /> : <span className={styles.semImagem} aria-hidden="true" />}
                    <span className={styles.dadosNoticia}>
                      <span>{nomeCategoriaNoticia(item.categoria)}</span>
                      <strong>{item.titulo}</strong>
                      <time dateTime={item.criado_em}>{new Date(item.criado_em).toLocaleDateString("pt-BR")}</time>
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          )}
          </div>
        </aside>
      <article>
        <header>
          <span>{nomeCategoriaNoticia(noticia.categoria)}</span>
          <h1>{noticia.titulo}</h1>
          <p>{noticia.resumo}</p>
          <time>
            {new Date(noticia.criado_em).toLocaleDateString("pt-BR", {
              dateStyle: "long",
            })}
          </time>
        </header>
        {noticia.imagem ? (
          <Image
            src={noticia.imagem}
            alt=""
            width={1200}
            height={560}
            priority
          />
        ) : null}
        <div className={styles.conteudo}>{noticia.conteudo}</div>
        {noticia.anexos?.length ? (
          <section className={styles.anexos}>
            <h2>
              <FileText /> Anexos
            </h2>
            {noticia.anexos.map((anexo) => (
              <a
                href={anexo.url}
                target="_blank"
                rel="noreferrer"
                key={anexo.url}
              >
                <span>{anexo.titulo}</span>
                <ExternalLink />
              </a>
            ))}
          </section>
        ) : null}
      </article>
      </div>
    </main>
  );
}
