"use client";

import { ArrowLeft, ExternalLink, FileText } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { buscarNoticia, type NoticiaPublica } from "../../lib/noticias";
import styles from "../../styles/noticiaDetalhe.module.css";

export default function NoticiaDetalhePage() {
  const { id } = useParams<{ id: string }>();
  const [noticia, setNoticia] = useState<NoticiaPublica | null>(null);
  const [erro, setErro] = useState("");

  useEffect(() => {
    buscarNoticia(id)
      .then(setNoticia)
      .catch((e) =>
        setErro(e instanceof Error ? e.message : "Notícia não encontrada."),
      );
  }, [id]);

  if (erro)
    return (
      <main className={styles.estado}>
        <p>{erro}</p>
        <Link href="/">Voltar ao início</Link>
      </main>
    );
  if (!noticia)
    return <main className={styles.estado}>Carregando publicação...</main>;

  return (
    <main className={styles.pagina}>
      <nav>
        <Link href="/#noticias">
          <ArrowLeft /> Voltar às notícias
        </Link>
      </nav>
      <article>
        <header>
          <span>{noticia.categoria}</span>
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
    </main>
  );
}
