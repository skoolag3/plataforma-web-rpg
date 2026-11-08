"use client";

import { AlertCircle, Plus, Save, X } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { NeonCheckbox } from "@/components/ui/animated-check-box";
import { SwitchToggle } from "@/components/ui/switch";
import type {
  AdminBanner,
  AdminCarta,
  SalvarAdminBannerPayload,
} from "../../../lib/admin";
import styles from "../../../styles/admin/adminBanners.module.css";
import { ModalCartasBanner } from "./modalCartasBanner";

type Props = {
  banner: AdminBanner | null;
  cartas: AdminCarta[];
  raridades: { codigo: string; nome: string; cor: string }[];
  salvando: boolean;
  onFechar: () => void;
  onSalvar: (payload: SalvarAdminBannerPayload) => void;
};

export function FormBanner({
  banner,
  cartas,
  raridades,
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
  const [chances, setChances] = useState(banner?.chances ?? []);
  const [pities, setPities] = useState(banner?.pities ?? []);
  const [inicioEm, setInicioEm] = useState(banner?.inicioEm ? new Date(banner.inicioEm).toLocaleString("sv-SE").replace(" ", "T").slice(0, 16) : "");
  const [fimEm, setFimEm] = useState(banner?.fimEm ? new Date(banner.fimEm).toLocaleString("sv-SE").replace(" ", "T").slice(0, 16) : "");
  const [agendado, setAgendado] = useState(Boolean(banner?.inicioEm || banner?.fimEm));
  const [raridadeAberta, setRaridadeAberta] = useState<string | null>(null);
  const [menuGarantiasAberto, setMenuGarantiasAberto] = useState(false);
  const btnCartasAtual = useRef<HTMLButtonElement | null>(null);
  const totalChance = Math.round(chances.reduce((total, item) => total + Number(item.percentual) * 100, 0)) / 100;
  const diferencaChance = Math.round(Math.abs(100 - totalChance) * 100) / 100;
  const formatarChance = (valor: number) => valor.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
  const avisoChance = totalChance < 100
    ? `Faltam ${formatarChance(diferencaChance)}% para completar as chances. A soma precisa ser 100%.`
    : totalChance > 100
      ? `As chances excedem 100% em ${formatarChance(diferencaChance)}%. Reduza os valores para salvar.`
      : null;
  const raridadesSemCartas = chances.filter((item) => !cartas.some((carta) => carta.raridade === item.raridade && cartasIds.has(carta.id)));
  const garantiasDisponiveis = chances.filter((item) => !pities.some((regra) => regra.raridade === item.raridade));
  const avisoRaridades = !chances.length
    ? "Marque ao menos uma raridade para o banner."
    : avisoChance
      ?? (raridadesSemCartas.length
        ? `Selecione ao menos uma carta em ${raridadesSemCartas.map((item) => raridades.find((raridade) => raridade.codigo === item.raridade)?.nome ?? item.raridade).join(", ")}.`
        : null);
  const avisoSalvar = !nome.trim()
    ? "Informe o nome do banner."
    : agendado && (!inicioEm || !fimEm || inicioEm >= fimEm)
      ? "Defina um início e um fim válidos para o agendamento."
      : null;

  useEffect(() => {
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = overflowAnterior; };
  }, []);

  function alternarRaridade(codigo: string) {
    if (chances.some((item) => item.raridade === codigo)) {
      setChances((atuais) => atuais.filter((item) => item.raridade !== codigo));
      setPities((atuais) => atuais.filter((item) => item.raridade !== codigo));
      setMenuGarantiasAberto(false);
      setCartasIds((atuais) => new Set([...atuais].filter((id) => cartas.find((carta) => carta.id === id)?.raridade !== codigo)));
      if (raridadeAberta === codigo) setRaridadeAberta(null);
    } else {
      setChances((atuais) => [...atuais, { raridade: codigo, percentual: 0 }]);
    }
  }

  function aplicarCartasRaridade(codigo: string, selecionadas: Set<string>) {
    setCartasIds((atuais) => {
      const outras = [...atuais].filter((id) => cartas.find((carta) => carta.id === id)?.raridade !== codigo);
      return new Set([...outras, ...selecionadas]);
    });
    fecharModalCartas();
  }

  function fecharModalCartas() {
    setRaridadeAberta(null);
    requestAnimationFrame(() => btnCartasAtual.current?.focus());
  }

  function enviar(event: FormEvent) {
    event.preventDefault();
    onSalvar({
      nome: nome.trim(),
      custoGiro,
      ativo,
      cartasIds: [...cartasIds],
      chances,
      pities,
      inicioEm: agendado && inicioEm ? new Date(inicioEm).toISOString() : null,
      fimEm: agendado && fimEm ? new Date(fimEm).toISOString() : null,
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
          <div className={styles.statusBanner}><SwitchToggle checked={ativo} onChange={setAtivo} label="Banner ativo" /></div>
        </div>

        <section className={styles.configBanner}>
          <header><strong>Raridades e chances</strong><small>Marque as raridades do banner, defina a chance e escolha ao menos uma carta em cada uma.</small></header>
          <div className={styles.resumoChances} aria-live="polite">
            <div className={styles.totalChances} data-valido={totalChance === 100}>{formatarChance(totalChance)}% de 100% distribuídos</div>
            {avisoRaridades ? <p className={styles.avisoChance}><AlertCircle aria-hidden="true" />{avisoRaridades}</p> : null}
          </div>
          <div className={styles.gradeRaridades}>
            {raridades.map((raridade) => {
              const chance = chances.find((item) => item.raridade === raridade.codigo);
              const quantidade = cartas.filter((carta) => carta.raridade === raridade.codigo && cartasIds.has(carta.id)).length;
              return <div key={raridade.codigo} className={styles.itemRaridade} data-ativo={Boolean(chance)} style={{ "--corRaridade": raridade.cor } as React.CSSProperties}>
                <NeonCheckbox checked={Boolean(chance)} onChange={() => alternarRaridade(raridade.codigo)} label={raridade.nome} cor={raridade.cor} aria-label={`Incluir raridade ${raridade.nome}`} />
                <label className={styles.chanceRaridade}>Chance <span>%</span><input type="number" min="0" max="100" step="0.01" disabled={!chance} value={chance?.percentual ?? ""} onChange={(event) => setChances((atuais) => atuais.map((item) => item.raridade === raridade.codigo ? { ...item, percentual: Number(event.target.value) } : item))} /></label>
                <button className={styles.btnCartasRaridade} type="button" disabled={!chance} aria-haspopup="dialog" aria-label={`Selecionar cartas ${raridade.nome}: ${quantidade} selecionadas`} onClick={(evento) => { btnCartasAtual.current = evento.currentTarget; setRaridadeAberta(raridade.codigo); }}>{chance ? `${quantidade} ${quantidade === 1 ? "carta" : "cartas"}` : "—"}</button>
              </div>;
            })}
          </div>
        </section>

        <section className={styles.configBanner}>
          <header className={styles.garantiasTopo}>
            <div><strong>Garantias</strong><small>Opcional: defina em quantos giros cada raridade será garantida.</small></div>
            <button type="button" className={styles.btnAdicionarGarantia} disabled={!garantiasDisponiveis.length} aria-expanded={menuGarantiasAberto} onClick={() => setMenuGarantiasAberto((aberto) => !aberto)}><Plus aria-hidden="true" />Adicionar garantia</button>
          </header>
          {menuGarantiasAberto ? <div className={styles.opcoesGarantia} aria-label="Escolher raridade da garantia">
            {garantiasDisponiveis.map((chance) => {
              const raridade = raridades.find((item) => item.codigo === chance.raridade);
              return <button key={chance.raridade} type="button" onClick={() => { setPities((atuais) => [...atuais, { raridade: chance.raridade, limite: 80 }]); setMenuGarantiasAberto(false); }}><Plus aria-hidden="true" />{raridade?.nome ?? chance.raridade}</button>;
            })}
          </div> : null}
          <div className={styles.gradeGarantias}>{pities.map((regra) => {
            const raridade = raridades.find((item) => item.codigo === regra.raridade);
            return <div key={regra.raridade} className={styles.linhaPity}>
              <strong>{raridade?.nome ?? regra.raridade}</strong>
              <label className={styles.limitePity}>Garantir em até<input type="number" min="1" max="10000" required aria-label={`Giros para garantir ${raridade?.nome ?? regra.raridade}`} value={regra.limite} onChange={(event) => setPities((atuais) => atuais.map((item) => item.raridade === regra.raridade ? { ...item, limite: Number(event.target.value) } : item))} /><span>giros</span></label>
              <button type="button" className={styles.btnRemoverGarantia} aria-label={`Remover garantia ${raridade?.nome ?? regra.raridade}`} onClick={() => setPities((atuais) => atuais.filter((item) => item.raridade !== regra.raridade))}><X aria-hidden="true" /></button>
            </div>;
          })}</div>
          {!pities.length ? <p className={styles.ajudaBanner}>{chances.length ? "Nenhuma garantia configurada. Use + Adicionar garantia se quiser definir uma." : "Marque uma raridade acima para configurar a garantia."}</p> : null}
        </section>

        <section className={styles.configBanner}>
          <header className={styles.agendamentoTopo}>
            <div><strong>Agendamento</strong><small>Ative para definir quando este banner começa e termina.</small></div>
            <SwitchToggle checked={agendado} onChange={setAgendado} aria-label="Ativar agendamento" />
          </header>
          {agendado ? <div className={styles.datasBanner}>
            <label>Início<input type="datetime-local" required value={inicioEm} onChange={(event) => setInicioEm(event.target.value)} /></label>
            <label>Fim<input type="datetime-local" required value={fimEm} min={inicioEm || undefined} onChange={(event) => setFimEm(event.target.value)} /></label>
          </div> : null}
        </section>

        <footer>
          {avisoSalvar ? <p className={styles.avisoSalvar} role="status"><AlertCircle aria-hidden="true" />{avisoSalvar}</p> : null}
          <button type="button" onClick={onFechar}>
            Cancelar
          </button>
          <button
            type="submit"
            className={styles.btnSalvarBanner}
            disabled={salvando || Boolean(avisoRaridades || avisoSalvar)}
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
      {raridadeAberta ? <ModalCartasBanner
        key={raridadeAberta}
        raridade={raridades.find((item) => item.codigo === raridadeAberta) ?? { codigo: raridadeAberta, nome: raridadeAberta, cor: "#a78bfa" }}
        cartas={cartas.filter((carta) => carta.raridade === raridadeAberta && carta.ativo && !carta.excluidoEm)}
        selecionadas={new Set([...cartasIds].filter((id) => cartas.find((carta) => carta.id === id)?.raridade === raridadeAberta))}
        onFechar={fecharModalCartas}
        onAplicar={(selecionadas) => aplicarCartasRaridade(raridadeAberta, selecionadas)}
      /> : null}
    </div>
  );
}
