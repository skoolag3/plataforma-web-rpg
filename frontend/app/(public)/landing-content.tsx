"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { login, register } from "../lib/auth";

type ModalType = "login" | "cadastro" | null;

type LandingContentProps = {
  initialModal?: ModalType;
};

const features = [
  ["Batalhas 1v1 contra bots", "Teste suas habilidades"],
  ["Monte seu deck", "Ate 6 cartas por deck"],
  ["Progressao RPG", "Evolua, desbloqueie e domine"],
  ["100% justo", "Todas as regras no servidor"],
];

const stats = [
  ["500+", "Cartas disponiveis"],
  ["10K+", "Jogadores ativos"],
  ["100%", "Justo e balanceado"],
];

export function LandingContent({ initialModal = null }: LandingContentProps) {
  const [modal, setModal] = useState<ModalType>(initialModal);

  useEffect(() => {
    setModal(initialModal);
  }, [initialModal]);

  return (
    <main className="relative min-h-[calc(100vh-65px)] overflow-hidden bg-[#05070f] text-zinc-50">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_68%_24%,rgba(126,34,206,0.42),transparent_28%),radial-gradient(circle_at_92%_72%,rgba(185,28,28,0.22),transparent_24%),linear-gradient(120deg,#05070f_0%,#070916_48%,#13051f_100%)]" />
      <div className="absolute inset-y-0 right-0 w-[62%] opacity-80">
        <div className="absolute right-[12%] top-[10%] h-[58%] w-[44%] rounded-full bg-violet-700/20 blur-3xl" />
        <div className="absolute bottom-[10%] right-[8%] grid w-[390px] max-w-[52vw] rotate-[-9deg] grid-cols-3 gap-4 opacity-90">
          {["Kael", "Nyra", "Riven", "Astra", "Valk", "Dante"].map((name, index) => (
            <div
              key={name}
              className="aspect-[3/4] rounded-lg border border-violet-400/40 bg-gradient-to-br from-zinc-950 via-violet-950 to-red-950 p-2 shadow-2xl shadow-violet-950/50"
              style={{ transform: `translateY(${index % 2 ? 32 : 0}px)` }}
            >
              <div className="flex h-full flex-col justify-end rounded-md border border-white/10 bg-[radial-gradient(circle_at_50%_26%,rgba(168,85,247,0.5),transparent_30%)] p-2">
                <span className="text-xs font-bold uppercase text-violet-100">{name}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <section className="relative mx-auto flex min-h-[calc(100vh-65px)] w-full max-w-7xl flex-col justify-between px-6 py-10 sm:px-10">
        <div className="grid flex-1 items-center gap-10 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="max-w-xl">
            <p className="text-lg font-extrabold uppercase tracking-wide text-zinc-200">
              Entre no mundo.
            </p>
            <h1 className="mt-3 text-5xl font-black uppercase leading-[0.95] text-white sm:text-7xl">
              Colecione.
              <br />
              Evolua.
              <br />
              <span className="text-violet-500">Domine!</span>
            </h1>
            <p className="mt-7 max-w-sm text-base leading-7 text-zinc-300">
              Jogo de cartas online com batalhas estrategicas, colecao de
              personagens incriveis e progressao estilo RPG.
            </p>

            <div className="mt-9 space-y-5">
              {features.map(([title, description]) => (
                <div key={title} className="flex items-center gap-4">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-violet-400/50 bg-violet-950/30 text-violet-200">
                    ✦
                  </span>
                  <div>
                    <p className="text-sm font-bold uppercase text-white">{title}</p>
                    <p className="text-sm text-zinc-400">{description}</p>
                  </div>
                </div>
              ))}
            </div>

            <Link
              href="/cadastro"
              className="mt-10 inline-flex h-14 min-w-56 items-center justify-center rounded-md bg-violet-600 px-8 text-sm font-extrabold uppercase text-white shadow-lg shadow-violet-950/40 transition hover:bg-violet-500"
            >
              Jogar agora
            </Link>
          </div>

          <div className="hidden min-h-[560px] items-center justify-center lg:flex">
            <div className="relative h-[520px] w-[380px]">
              <div className="absolute left-12 top-5 h-[430px] w-[250px] rounded-[42%_42%_32%_32%] bg-zinc-950 shadow-[0_0_120px_rgba(124,58,237,0.45)]" />
              <div className="absolute left-20 top-12 h-24 w-24 rounded-full bg-zinc-900 shadow-[34px_44px_0_50px_#111827]" />
              <div className="absolute left-36 top-32 h-4 w-28 rounded-full bg-violet-400 shadow-[0_0_34px_rgba(168,85,247,0.9)]" />
              <div className="absolute bottom-0 left-6 h-80 w-72 rounded-t-[44%] bg-gradient-to-b from-zinc-900 to-black" />
              <div className="absolute inset-x-0 bottom-14 h-48 rounded-full border border-violet-500/20 bg-violet-700/10 blur-2xl" />
            </div>
          </div>
        </div>

        <div className="relative mt-8 grid gap-3 rounded-lg border border-white/10 bg-black/30 p-5 backdrop-blur sm:grid-cols-3">
          {stats.map(([value, label]) => (
            <div key={label} className="flex items-center gap-4">
              <span className="grid h-12 w-12 place-items-center rounded-lg border border-violet-500/40 bg-violet-950/40 text-violet-200">
                ✧
              </span>
              <div>
                <p className="text-2xl font-black text-white">{value}</p>
                <p className="text-xs font-bold uppercase text-zinc-400">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {modal === "login" ? <LoginModal onClose={() => setModal(null)} /> : null}
      {modal === "cadastro" ? <CadastroModal onClose={() => setModal(null)} /> : null}
    </main>
  );
}

function ModalShell({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  const router = useRouter();

  function close() {
    onClose();
    router.push("/");
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/72 px-4 py-8 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-lg border border-zinc-700/80 bg-zinc-950/95 p-7 text-zinc-50 shadow-2xl shadow-black/60">
        <button
          type="button"
          onClick={close}
          className="absolute right-4 top-4 text-3xl leading-none text-zinc-400 transition hover:text-white"
          aria-label="Fechar"
        >
          ×
        </button>
        {children}
      </div>
    </div>
  );
}

function LoginModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro("");
    setCarregando(true);

    try {
      await login(email, senha);
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Erro ao fazer login.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <ModalShell onClose={onClose}>
      <div className="mx-auto mb-5 grid h-20 w-20 place-items-center rounded-2xl border border-violet-500/50 bg-violet-950/40 text-4xl text-violet-300">
        ↪
      </div>
      <h2 className="text-center text-2xl font-black uppercase">Bem-vindo de volta!</h2>
      <p className="mt-2 text-center text-sm text-zinc-400">Entre na sua conta para continuar</p>

      <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
        <Field label="E-mail">
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="auth-input"
            placeholder="seu@email.com"
            required
          />
        </Field>
        <Field label="Senha">
          <input
            type="password"
            value={senha}
            onChange={(event) => setSenha(event.target.value)}
            className="auth-input"
            placeholder="Sua senha"
            minLength={6}
            required
          />
        </Field>

        <div className="flex items-center justify-between gap-3 text-sm">
          <label className="flex items-center gap-2 text-zinc-300">
            <input type="checkbox" className="h-4 w-4 accent-violet-500" />
            Lembrar de mim
          </label>
          <Link href="/esqueci-senha" className="text-violet-300 hover:text-violet-200">
            Esqueci minha senha
          </Link>
        </div>

        {erro ? <Alert tone="error">{erro}</Alert> : null}

        <button type="submit" disabled={carregando} className="auth-submit">
          {carregando ? "Entrando..." : "Entrar"}
        </button>
      </form>

      <SocialButtons />
      <p className="mt-6 text-center text-sm text-zinc-300">
        Nao tem uma conta?{" "}
        <Link href="/cadastro" className="font-semibold text-violet-300 hover:text-violet-200">
          Registre-se
        </Link>
      </p>
    </ModalShell>
  );
}

function CadastroModal({ onClose }: { onClose: () => void }) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [aceitou, setAceitou] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro("");
    setSucesso("");

    if (senha !== confirmarSenha) {
      setErro("As senhas nao conferem.");
      return;
    }

    if (!aceitou) {
      setErro("Aceite os termos para criar sua conta.");
      return;
    }

    setCarregando(true);

    try {
      const response = await register(nome, email, senha);
      setSucesso(response.message);
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Erro ao criar conta.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <ModalShell onClose={onClose}>
      <div className="mx-auto mb-5 grid h-20 w-20 place-items-center rounded-2xl border border-violet-500/50 bg-violet-950/40 text-4xl text-violet-300">
        +
      </div>
      <h2 className="text-center text-2xl font-black uppercase">Crie sua conta</h2>
      <p className="mt-2 text-center text-sm text-zinc-400">Junte-se a batalha!</p>

      <form className="mt-7 space-y-4" onSubmit={handleSubmit}>
        <Field label="Nome de usuario">
          <input
            type="text"
            value={nome}
            onChange={(event) => setNome(event.target.value)}
            className="auth-input"
            placeholder="Seu nome de usuario"
            minLength={3}
            required
          />
        </Field>
        <Field label="E-mail">
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="auth-input"
            placeholder="seu@email.com"
            required
          />
        </Field>
        <Field label="Senha">
          <input
            type="password"
            value={senha}
            onChange={(event) => setSenha(event.target.value)}
            className="auth-input"
            placeholder="Minimo de 6 caracteres"
            minLength={6}
            required
          />
        </Field>
        <Field label="Confirmar senha">
          <input
            type="password"
            value={confirmarSenha}
            onChange={(event) => setConfirmarSenha(event.target.value)}
            className="auth-input"
            placeholder="Confirme sua senha"
            minLength={6}
            required
          />
        </Field>

        <label className="flex items-start gap-2 text-sm text-zinc-300">
          <input
            type="checkbox"
            checked={aceitou}
            onChange={(event) => setAceitou(event.target.checked)}
            className="mt-1 h-4 w-4 accent-violet-500"
          />
          <span>
            Li e aceito os{" "}
            <span className="text-violet-300">Termos de Uso e Politica de Privacidade</span>
          </span>
        </label>

        {erro ? <Alert tone="error">{erro}</Alert> : null}
        {sucesso ? <Alert tone="success">{sucesso}</Alert> : null}

        <button type="submit" disabled={carregando} className="auth-submit">
          {carregando ? "Registrando..." : "Registrar"}
        </button>
      </form>

      <SocialButtons />
      <p className="mt-5 text-center text-sm text-zinc-300">
        Ja tem uma conta?{" "}
        <Link href="/login" className="font-semibold text-violet-300 hover:text-violet-200">
          Entrar
        </Link>
      </p>
    </ModalShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold uppercase text-zinc-300">{label}</span>
      {children}
    </label>
  );
}

function Alert({
  tone,
  children,
}: {
  tone: "error" | "success";
  children: React.ReactNode;
}) {
  const styles =
    tone === "error"
      ? "border-red-500/40 bg-red-950/40 text-red-100"
      : "border-emerald-500/40 bg-emerald-950/40 text-emerald-100";

  return <p className={`rounded-md border px-3 py-2 text-sm ${styles}`}>{children}</p>;
}

function SocialButtons() {
  return (
    <div className="mt-6">
      <p className="text-center text-sm text-zinc-400">ou continue com</p>
      <div className="mt-4 grid grid-cols-3 gap-4">
        {["G", "Discord", "Twitch"].map((item) => (
          <button
            key={item}
            type="button"
            className="h-12 rounded-md border border-zinc-700 bg-zinc-900/80 text-sm font-bold text-zinc-200 transition hover:border-violet-400 hover:text-white"
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}
