"use client";

import { Check, Save, Search, X } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import type {
  AdminBanner,
  AdminCarta,
  SalvarAdminBannerPayload,
} from "../../lib/admin";
import styles from "../../styles/admin/adminBanners.module.css";

type Props = {
  banner: AdminBanner | null;
  cartas: AdminCarta[];
  salvando: boolean;
  onFechar: () => void;
  onSalvar: (payload: SalvarAdminBannerPayload) => void;
};

export function FormBanner({
  banner,
  cartas,
  salvando,
  onFechar,
  onSalvar,
}: Props) {
  const [nome, setNome] = useState(banner?.nome ?? "");
  const [custoGiro, setCustoGiro] = useState(banner?.custoGiro ?? 300);
  const [ativo, setAtivo] = useState(banner?.ativo ?? true);
  const [cartasIds, setCartasIds] = useState(
    () => new Set(banner?.cartas.map((carta) => carta.id) ?? []),
  );
  const [busca, setBusca] = useState("");
  const cartasFiltradas = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase();
    return cartas.filter(
      (carta) =>
        carta.ativo &&
        !carta.excluidoEm &&
        (!termo ||
          carta.nome.toLocaleLowerCase().includes(termo) ||
          carta.raridade.toLocaleLowerCase().includes(termo)),
    );
  }, [busca, cartas]);

  function alternarCarta(idCarta: string) {
    setCartasIds((atuais) => {
      const proximas = new Set(atuais);
      if (proximas.has(idCarta)) proximas.delete(idCarta);
      else proximas.add(idCarta);
      return proximas;
    });
  }

  function enviar(event: FormEvent) {
    event.preventDefault();
    onSalvar({
      nome: nome.trim(),
      custoGiro,
      ativo,
      cartasIds: [...cartasIds],
    });
  }

  return (
    <div className={styles.modalFundo} role="presentation">
      <form className={styles.formBanner} onSubmit={enviar}>
        <header>
          <div>
            <small>{banner ? "Editar banner" : "Novo banner"}</small>
            <h2>{banner?.nome ?? "Configurar invocação"}</h2>
          </div>
          <button
            type="button"
            onClick={onFechar}
            aria-label="Fechar formulário"
          >
            <X />
          </button>
        </header>

        <div className={styles.camposBanner}>
          <label>
            <span>Nome</span>
            <input
              value={nome}
              onChange={(event) => setNome(event.target.value)}
              minLength={3}
              maxLength={150}
              required
            />
          </label>
          <label>
            <span>Custo por giro</span>
            <input
              type="number"
              value={custoGiro}
              onChange={(event) => setCustoGiro(Number(event.target.value))}
              min={1}
              max={100000}
              required
            />
          </label>
          <label className={styles.statusBanner}>
            <input
              type="checkbox"
              checked={ativo}
              onChange={(event) => setAtivo(event.target.checked)}
            />
            <span>Banner ativo</span>
          </label>
        </div>

        <section className={styles.seletorCartas}>
          <header>
            <div>
              <strong>Cartas do banner</strong>
              <small>{cartasIds.size} selecionada(s)</small>
            </div>
            <label>
              <Search />
              <input
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
                placeholder="Buscar carta..."
              />
            </label>
          </header>
          <div>
            {cartasFiltradas.map((carta) => {
              const selecionada = cartasIds.has(carta.id);
              return (
                <button
                  type="button"
                  data-selecionada={selecionada || undefined}
                  onClick={() => alternarCarta(carta.id)}
                  key={carta.id}
                >
                  <span>
                    <strong>{carta.nome}</strong>
                    <small>
                      {carta.raridade} · {carta.elemento}
                    </small>
                  </span>
                  {selecionada ? <Check /> : null}
                </button>
              );
            })}
          </div>
        </section>

        <footer>
          <button type="button" onClick={onFechar}>
            Cancelar
          </button>
          <button
            type="submit"
            className={styles.btnSalvarBanner}
            disabled={salvando || !nome.trim() || cartasIds.size === 0}
          >
            <Save aria-hidden="true" />
            {salvando
              ? "Salvando..."
              : banner
                ? "Salvar alterações"
                : "Criar banner"}
          </button>
        </footer>
      </form>
    </div>
  );
}
