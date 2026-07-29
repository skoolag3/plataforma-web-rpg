"use client";

import { Bot, Shield, Sparkles, Swords } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  buscarProvocacaoBot,
  iniciarPartidaBot,
  type ResultadoPartida,
} from "../../lib/jogo";

export default function DashboardPage() {
  const [provocacao, setProvocacao] = useState({ personalidade: "", pergunta: "" });
  const [resposta, setResposta] = useState("");
  const [resultado, setResultado] = useState<ResultadoPartida | null>(null);
  const [erro, setErro] = useState("");
  const [lutando, setLutando] = useState(false);

  useEffect(() => {
    buscarProvocacaoBot().then(setProvocacao).catch((e) => setErro(e.message));
  }, []);

  async function batalhar() {
    setLutando(true);
    setErro("");
    try {
      setResultado(await iniciarPartidaBot(resposta));
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao iniciar a batalha.");
    } finally {
      setLutando(false);
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#27134d,#080b12_55%)] px-5 py-10 text-zinc-100">
      <section className="mx-auto max-w-5xl">
        <header className="mb-8 flex items-center justify-between gap-4">
          <div><p className="text-sm font-bold uppercase tracking-widest text-violet-400">Arena sombria</p><h1 className="text-4xl font-black">Partida 1v1 contra Bot</h1></div>
          <Link href="/decks" className="rounded-lg border border-violet-500/50 px-4 py-2 text-violet-200">Gerenciar deck</Link>
        </header>

        {!resultado ? (
          <section className="rounded-2xl border border-violet-500/30 bg-zinc-950/80 p-7 shadow-2xl">
            <div className="mb-5 flex items-center gap-4"><span className="grid size-14 place-items-center rounded-full bg-violet-700"><Bot /></span><div><strong className="text-xl">{provocacao.personalidade || "Carregando oponente..."}</strong><p className="text-zinc-400">A resposta define como o bot enfrentará você.</p></div></div>
            <blockquote className="mb-5 border-l-4 border-violet-500 bg-violet-950/40 p-5 text-lg italic">“{provocacao.pergunta}”</blockquote>
            <textarea value={resposta} onChange={(e) => setResposta(e.target.value)} maxLength={500} placeholder="Responda ao vilão..." className="min-h-28 w-full rounded-xl border border-zinc-700 bg-zinc-900 p-4 outline-none focus:border-violet-500" />
            {erro && <p className="mt-3 text-red-400">{erro}</p>}
            <button onClick={() => void batalhar()} disabled={lutando || resposta.trim().length < 2} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 font-bold disabled:opacity-40"><Swords />{lutando ? "Simulando turnos..." : "Aceitar duelo"}</button>
          </section>
        ) : (
          <section className="grid gap-5 lg:grid-cols-[280px_1fr]">
            <aside className="rounded-2xl border border-zinc-700 bg-zinc-950/80 p-6">
              <Sparkles className="mb-3 text-violet-400" />
              <h2 className="text-3xl font-black">{resultado.resultado}</h2>
              <p className="mt-2 text-zinc-400">Dificuldade: {resultado.dificuldade}</p>
              <p className="text-zinc-400">Turnos: {resultado.estado.turno}</p>
              <p className={resultado.variacaoPontos >= 0 ? "text-green-400" : "text-red-400"}>{resultado.variacaoPontos >= 0 ? "+" : ""}{resultado.variacaoPontos} pontos</p>
              <button onClick={() => { setResultado(null); setResposta(""); }} className="mt-6 w-full rounded-lg bg-violet-600 py-2 font-bold">Nova partida</button>
            </aside>
            <div className="max-h-[650px] overflow-auto rounded-2xl border border-zinc-700 bg-zinc-950/80 p-6">
              <h2 className="mb-4 flex items-center gap-2 text-xl font-bold"><Shield /> Log da partida</h2>
              {resultado.estado.eventos.map((evento, i) => <div key={i} className="mb-2 rounded-lg bg-zinc-900 p-3"><span className="mr-3 text-xs font-bold text-violet-400">T{evento.turno}</span>{evento.texto}</div>)}
            </div>
          </section>
        )}
      </section>
    </main>
  );
}
