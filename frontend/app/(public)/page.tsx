export default function Home() {
  return (
    <main className="min-h-[calc(100vh-65px)] bg-zinc-950 text-zinc-50">
      <section className="mx-auto flex w-full max-w-6xl flex-col justify-center px-6 py-20">
        <p className="text-sm font-medium uppercase tracking-widest text-red-400">
          Card Game RPG
        </p>
        <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight sm:text-6xl">
          Base inicial para login, cadastro e areas do jogo.
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-7 text-zinc-300 sm:text-lg">
          Use a barra de navegacao para testar os caminhos publicos e privados
          enquanto o fluxo JWT entra no backend.
        </p>
      </section>
    </main>
  );
}
