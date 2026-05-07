"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { register } from "../../lib/auth";

export default function CadastroPage() {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro("");
    setCarregando(true);

    try {
      await register(nome, email, senha);
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Erro ao criar conta.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main className="min-h-[calc(100vh-65px)] bg-zinc-950 px-6 py-12 text-zinc-50">
      <section className="mx-auto w-full max-w-md">
        <h1 className="text-3xl font-semibold">Cadastro</h1>
        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <label className="block">
            <span className="text-sm text-zinc-300">Nome</span>
            <input
              type="text"
              name="nome"
              value={nome}
              onChange={(event) => setNome(event.target.value)}
              className="mt-2 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-50 outline-none focus:border-red-400"
              placeholder="Seu nome"
              minLength={3}
              required
            />
          </label>
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
          <label className="block">
            <span className="text-sm text-zinc-300">Senha</span>
            <input
              type="password"
              name="senha"
              value={senha}
              onChange={(event) => setSenha(event.target.value)}
              className="mt-2 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-50 outline-none focus:border-red-400"
              placeholder="Minimo de 6 caracteres"
              minLength={6}
              required
            />
          </label>
          {erro ? (
            <p className="rounded-md border border-red-500/40 bg-red-950/40 px-3 py-2 text-sm text-red-100">
              {erro}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={carregando}
            className="w-full rounded-md bg-red-500 px-4 py-2 font-medium text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {carregando ? "Criando..." : "Criar conta"}
          </button>
        </form>
      </section>
    </main>
  );
}
