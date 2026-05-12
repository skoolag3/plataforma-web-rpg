"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { verifyEmail } from "../../lib/auth";

function ConteudoVerificarEmail() {
  const parametrosBusca = useSearchParams();
  const token = parametrosBusca.get("token");
  const [mensagem, setMensagem] = useState("Verificando e-mail...");
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (!token) {
      return;
    }

    verifyEmail(token)
      .then((resposta) => {
        setMensagem(resposta.message);
        setErro("");
      })
      .catch((erroCapturado) => {
        setErro(
          erroCapturado instanceof Error
            ? erroCapturado.message
            : "Nao foi possivel verificar o e-mail.",
        );
        setMensagem("");
      });
  }, [token]);

  const erroAtual = token ? erro : "Link de verificacao invalido.";
  const mensagemAtual = token ? mensagem : "";

  return (
    <main className="min-h-[calc(100vh-65px)] bg-zinc-950 px-6 py-12 text-zinc-50">
      <section className="mx-auto w-full max-w-md">
        <h1 className="text-3xl font-semibold">Verificar e-mail</h1>
        {mensagemAtual ? (
          <p className="mt-8 rounded-md border border-emerald-500/40 bg-emerald-950/40 px-3 py-2 text-sm text-emerald-100">
            {mensagemAtual}
          </p>
        ) : null}
        {erroAtual ? (
          <p className="mt-8 rounded-md border border-red-500/40 bg-red-950/40 px-3 py-2 text-sm text-red-100">
            {erroAtual}
          </p>
        ) : null}
        <Link
          href="/login"
          className="mt-6 inline-block rounded-md bg-red-500 px-4 py-2 font-medium text-white transition hover:bg-red-400"
        >
          Ir para login
        </Link>
      </section>
    </main>
  );
}

export default function VerificarEmailPage() {
  return (
    <Suspense fallback={null}>
      <ConteudoVerificarEmail />
    </Suspense>
  );
}
