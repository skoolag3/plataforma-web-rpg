"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { solicitarRedefinicaoSenha } from "../../lib/auth";

export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState("");
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro("");
    setSucesso("");
    setCarregando(true);

    try {
      const response = await solicitarRedefinicaoSenha(email);
      setSucesso(response.message);
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Nao foi possivel solicitar a alteracao de senha.",
      );
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main className="min-h-[calc(100vh-65px)] bg-zinc-950 px-6 py-12 text-zinc-50">
      <section className="mx-auto w-full max-w-md">
        <h1 className="text-3xl font-semibold">Esqueci minha senha</h1>
        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <label className="block">
            <span className="text-sm text-zinc-300">E-mail</span>
            <input
              type="email"
              name="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-50 outline-none focus:border-red-400"
              placeholder="voce@email.com"
              required
            />
          </label>
          {erro ? (
            <p className="rounded-md border border-red-500/40 bg-red-950/40 px-3 py-2 text-sm text-red-100">
              {erro}
            </p>
          ) : null}
          {sucesso ? (
            <p className="rounded-md border border-emerald-500/40 bg-emerald-950/40 px-3 py-2 text-sm text-emerald-100">
              {sucesso}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={carregando}
            className="w-full rounded-md bg-red-500 px-4 py-2 font-medium text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {carregando ? "Enviando..." : "Enviar link"}
          </button>
        </form>
        <Link
          href="/login"
          className="mt-6 inline-block text-sm text-zinc-300 transition hover:text-zinc-100"
        >
          Voltar para login
        </Link>
      </section>
    </main>
  );
}
