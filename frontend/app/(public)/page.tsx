export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center px-6 py-16">
        <p className="text-sm font-medium uppercase tracking-widest text-red-400">
          Card Game RPG
        </p>
        <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight sm:text-6xl">
          Plataforma web para cartas, gacha, decks e ranking.
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-7 text-zinc-300 sm:text-lg">
          A rota inicial agora fica dentro do grupo publico do App Router.
        </p>
      </main>
    </div>
  );
}
