"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { redefinirSenha } from "../../lib/auth";

function ConteudoAlterarSenha() {
  const parametrosBusca = useSearchParams();
  const token = parametrosBusca.get("token");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function aoEnviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro("");
    setSucesso("");

    if (!token) {
      setErro("Link de redefinicao invalido.");
      return;
    }

    if (senha !== confirmarSenha) {
      setErro("As senhas nao conferem.");
      return;
    }

    setCarregando(true);

    try {
      const resposta = await redefinirSenha(token, senha);
      setSucesso(resposta.message);
      setSenha("");
      setConfirmarSenha("");
    } catch (erroCapturado) {
      setErro(
        erroCapturado instanceof Error
          ? erroCapturado.message
          : "Nao foi possivel alterar a senha.",
      );
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main className="min-h-[calc(100vh-65px)] bg-zinc-950 px-6 py-12 text-zinc-50">
      <section className="mx-auto w-full max-w-md">
        <h1 className="text-3xl font-semibold">Alterar senha</h1>
        <form className="mt-8 space-y-5" onSubmit={aoEnviar}>
          <label className="block">
            <span className="text-sm text-zinc-300">Nova senha</span>
            <input
              type="password"
              name="senha"
              value={senha}
              onChange={(event) => setSenha(event.target.value)}
              className="mt-2 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-50 outline-none focus:border-red-400"
              placeholder="Minimo de 6 caracteres"
              minLength={6}
              required
              disabled={!token}
            />
          </label>
          <label className="block">
            <span className="text-sm text-zinc-300">Confirmar senha</span>
            <input
              type="password"
              name="confirmarSenha"
              value={confirmarSenha}
              onChange={(event) => setConfirmarSenha(event.target.value)}
              className="mt-2 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-50 outline-none focus:border-red-400"
              placeholder="Repita a nova senha"
              minLength={6}
              required
              disabled={!token}
            />
          </label>
          {erro || !token ? (
            <p className="rounded-md border border-red-500/40 bg-red-950/40 px-3 py-2 text-sm text-red-100">
              {erro || "Link de redefinicao invalido."}
            </p>
          ) : null}
          {sucesso ? (
            <p className="rounded-md border border-emerald-500/40 bg-emerald-950/40 px-3 py-2 text-sm text-emerald-100">
              {sucesso}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={carregando || !token}
            className="w-full rounded-md bg-red-500 px-4 py-2 font-medium text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {carregando ? "Alterando..." : "Alterar senha"}
          </button>
        </form>
        <Link
          href="/login"
          className="mt-6 inline-block text-sm text-zinc-300 transition hover:text-zinc-100"
        >
          Ir para login
        </Link>
      </section>
    </main>
  );
}

export default function AlterarSenhaPage() {
  return (
    <Suspense fallback={null}>
      <ConteudoAlterarSenha />
    </Suspense>
  );
}
