"use client";

import {
  Edit3,
  Eye,
  Home,
  ImagePlus,
  Layers,
  LogOut,
  MoreHorizontal,
  Newspaper,
  Sparkles,
  Map,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import {
  ADMIN_DATA_CHANGED_EVENT,
  obterAdminDashboard,
  type AdminDashboardResumo,
} from "../../lib/admin";
import {
  getStoredUser,
  getToken,
  subscribeAuthChange,
} from "../../lib/auth";
import { buscarPerfilApi } from "../../lib/perfil";
import {
  criarEstiloMolduraPerfil,
  type ConfigVisualCarta,
} from "../../components/cartaMontada";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "../../../components/ui/tooltip-07-utils/tooltip";
import styles from "../../styles/admin/adminShared.module.css";
import layoutStyles from "../../styles/admin/adminLayout.module.css";
import { RaridadesJogoProvider } from "../../components/raridadesJogo";

export function NomeComAlerta({
  nome,
  motivo,
  tom = "amarelo",
  className,
  style,
}: {
  nome: string;
  motivo?: string | null;
  tom?: "amarelo" | "vermelho";
  className?: string;
  style?: React.CSSProperties;
}) {
  if (!motivo) {
    return (
      <strong className={className} style={style}>
        {nome}
      </strong>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <strong
            className={`${className ?? ""} ${styles.nomeItemAlerta}`.trim()}
            data-tom={tom}
            style={style}
            tabIndex={0}
          >
            {nome}
          </strong>
        }
      />
      <TooltipContent>
        <strong>Alerta</strong> — {motivo}
      </TooltipContent>
    </Tooltip>
  );
}

const nav = [
  { href: "/admin", label: "Dashboard", icon: Home },
  { href: "/admin/cartas", label: "Cartas", icon: Layers },
  { href: "/admin/habilidades", label: "Habilidades", icon: Sparkles },
  { href: "/admin/usuarios", label: "Usuários", icon: Users },
  { href: "/admin/banners", label: "Banners", icon: ImagePlus },
  { href: "/admin/campanha", label: "Campanhas", icon: Map },
  { href: "/admin/noticias", label: "Notícias", icon: Newspaper },
];

type BadgeNav = {
  total: number;
  tom: "vermelho" | "amarelo";
  motivo: string;
};

function calcularBadgesNav(
  resumo: AdminDashboardResumo | null,
): Record<string, BadgeNav | undefined> {
  if (!resumo) return {};
  const { saudeCatalogo: saude, metricas } = resumo;

  const semSkill = saude?.cartasSemHabilidade ?? 0;
  const foraBanner = saude?.cartasForaDeBanner ?? 0;
  const rascunhoSkill = saude?.habilidadesRascunho ?? 0;
  const semTesteSkill = saude?.habilidadesNaoTestadas ?? 0;
  const bloqueados = metricas?.usuariosBloqueados ?? 0;
  const naoVerificados = metricas?.usuariosNaoVerificados ?? 0;
  const noticiasRasc = saude?.noticiasRascunho ?? 0;

  return {
    "/admin/cartas":
      semSkill > 0
        ? {
            total: semSkill,
            tom: "vermelho",
            motivo: `${semSkill} carta(s) ativa(s) sem habilidade (${saude.nomesSemHabilidade?.join(", ") || "verificar"})`,
          }
        : undefined,
    "/admin/habilidades":
      rascunhoSkill + semTesteSkill > 0
        ? {
            total: rascunhoSkill || semTesteSkill,
            tom: rascunhoSkill > 0 ? "amarelo" : "amarelo",
            motivo:
              rascunhoSkill > 0
                ? `${rascunhoSkill} habilidade(s) em rascunho (${saude.nomesSkillsRascunho?.join(", ") || "verificar"})`
                : `${semTesteSkill} habilidade(s) sem teste`,
          }
        : undefined,
    "/admin/usuarios":
      bloqueados + naoVerificados > 0
        ? {
            total: bloqueados + naoVerificados,
            tom: bloqueados > 0 ? "vermelho" : "amarelo",
            motivo: `${bloqueados} bloqueado(s) · ${naoVerificados} sem verificar e-mail`,
          }
        : undefined,
    "/admin/banners":
      (saude?.bannersAtivos ?? 1) === 0
        ? {
            total: 1,
            tom: "vermelho",
            motivo: "Nenhum banner ativo no Gacha",
          }
        : foraBanner > 0
          ? {
              total: foraBanner,
              tom: "amarelo",
              motivo: `${foraBanner} carta(s) fora de qualquer banner (${saude.nomesForaDeBanner?.join(", ") || "verificar"})`,
            }
          : undefined,
    "/admin/noticias":
      noticiasRasc > 0
        ? {
            total: noticiasRasc,
            tom: "amarelo",
            motivo: `${noticiasRasc} notícia(s) em rascunho`,
          }
        : undefined,
  };
}

function Status({ value }: { value: string }) {
  const ativo = value === "Ativo" || value === "Ativa";
  return (
    <span className={ativo ? styles.statusAtivo : styles.statusInativo}>
      {value}
    </span>
  );
}

type PerfilAdminNav = {
  nome: string;
  avatarUrl: string | null;
  molduraUrl: string | null;
  molduraConfig: ConfigVisualCarta | null;
  molduraClasse: string;
};

const perfilAdminVazio: PerfilAdminNav = {
  nome: "",
  avatarUrl: null,
  molduraUrl: null,
  molduraConfig: null,
  molduraClasse: "molduraPadrao",
};

let perfilAdminCache: { idUsuario: string; perfil: PerfilAdminNav } | null = null;

export function AdminLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [resumoNav, setResumoNav] = useState<AdminDashboardResumo | null>(null);
  const usuario = useSyncExternalStore(
    subscribeAuthChange,
    getStoredUser,
    () => null,
  );
  const [perfilAdmin, setPerfilAdmin] = useState<PerfilAdminNav>(
    () => perfilAdminCache?.perfil ?? perfilAdminVazio,
  );
  const perfilAdminVisivel = perfilAdminCache?.idUsuario === usuario?.id
    ? perfilAdmin
    : perfilAdminVazio;

  useEffect(() => {
    let ativo = true;
    const idUsuario = usuario?.id;

    function carregarPerfilAdmin() {
      const token = getToken();
      if (!token || !idUsuario) return;
      void buscarPerfilApi(token)
        .then((perfil) => {
          if (!ativo) return;
          const atualizado: PerfilAdminNav = {
            nome: perfil.user,
            avatarUrl: perfil.avatarUrl ?? null,
            molduraUrl: perfil.molduraUrl ?? null,
            molduraConfig: perfil.molduraConfig ?? null,
            molduraClasse: perfil.molduraClasse,
          };
          perfilAdminCache = { idUsuario, perfil: atualizado };
          setPerfilAdmin(atualizado);
        })
        .catch(() => undefined);
    }

    if (!idUsuario || perfilAdminCache?.idUsuario !== idUsuario) carregarPerfilAdmin();
    window.addEventListener("perfil-atualizado", carregarPerfilAdmin);
    return () => {
      ativo = false;
      window.removeEventListener("perfil-atualizado", carregarPerfilAdmin);
    };
  }, [usuario?.id]);

  useEffect(() => {
    let ativo = true;
    const atualizarResumo = () => {
      obterAdminDashboard("7d")
        .then((dados) => {
          if (ativo) setResumoNav(dados);
        })
        .catch(() => null);
    };

    atualizarResumo();
    window.addEventListener(ADMIN_DATA_CHANGED_EVENT, atualizarResumo);
    return () => {
      ativo = false;
      window.removeEventListener(ADMIN_DATA_CHANGED_EVENT, atualizarResumo);
    };
  }, [pathname]);

  const badges = calcularBadgesNav(resumoNav);

  return (
    <RaridadesJogoProvider>
      <main className={layoutStyles.adminPage}>
        <aside className={layoutStyles.adminNavbar}>
          <div className={layoutStyles.brand}>
            <span>
              AC
            </span>
            <div>
              <strong>Anime Cards</strong>
              <small>Admin</small>
            </div>
          </div>

          <nav
            className={layoutStyles.nav}
            aria-label="Navegação administrativa"
          >
            {nav.map((item) => {
              const Icone = item.icon;
              const ativa =
                item.href === "/admin"
                  ? pathname === item.href
                  : pathname.startsWith(item.href);
              const badge = badges[item.href];

              return (
                <Link
                  href={item.href}
                  className={ativa ? layoutStyles.navAtiva : undefined}
                  aria-current={ativa ? "page" : undefined}
                  title={badge?.motivo}
                  key={item.href}
                >
                  <Icone aria-hidden="true" />
                  <span>{item.label}</span>
                  {badge ? (
                    <b
                      className={layoutStyles.navBadge}
                      data-tom={badge.tom}
                      aria-label={badge.motivo}
                    >
                      {badge.total}
                    </b>
                  ) : null}
                </Link>
              );
            })}
          </nav>

          <div className={layoutStyles.navAcoes}>
            <Link href="/perfil" className={layoutStyles.adminUser}>
              <span
                className={`${layoutStyles.adminAvatarVisual} ${layoutStyles[perfilAdminVisivel.molduraClasse] ?? ""}`}
              >
                <span
                  className={layoutStyles.adminFotoAvatar}
                  style={{
                    backgroundImage: `url("${perfilAdminVisivel.avatarUrl ?? "/avatar-padrao.svg"}")`,
                  }}
                />
                {perfilAdminVisivel.molduraUrl ? (
                  <i
                    className={layoutStyles.adminMolduraImagem}
                    style={{
                      ...criarEstiloMolduraPerfil(perfilAdminVisivel.molduraConfig),
                      backgroundImage: `url("${perfilAdminVisivel.molduraUrl}")`,
                    }}
                    aria-hidden="true"
                  />
                ) : null}
              </span>
              <div>
                <strong>{perfilAdminVisivel.nome || usuario?.nome || "Admin"}</strong>
                <small>Modo admin</small>
              </div>
            </Link>
            <Link
              href="/home"
              className={layoutStyles.logout}
              title="Voltar ao jogo"
            >
              <LogOut aria-hidden="true" />
              <span>Jogo</span>
            </Link>
          </div>
        </aside>

        <section className={layoutStyles.content}>
          <header className={layoutStyles.topbar}>
            <div>
              <h1>{title}</h1>
              <p>{subtitle}</p>
            </div>
            <span className={layoutStyles.areaTag}>Painel administrativo</span>
          </header>
          {children}
        </section>
      </main>
    </RaridadesJogoProvider>
  );
}

export function DataTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: string[][];
}) {
  return (
    <div className={styles.tableWrap}>
      <table>
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header}>{header}</th>
            ))}
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.join("-")}>
              {row.map((cell, index) => (
                <td key={`${cell}-${index}`}>
                  {index === row.length - 1 ? <Status value={cell} /> : cell}
                </td>
              ))}
              <td>
                <span className={styles.rowActions}>
                  <Eye aria-hidden="true" />
                  <Edit3 aria-hidden="true" />
                  <MoreHorizontal aria-hidden="true" />
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export {
  AdminPaginacao,
  paginasVisiveis,
  type AdminPaginacaoProps,
} from "./adminPaginacao";

