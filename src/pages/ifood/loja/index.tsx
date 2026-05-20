import { useContext, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/router";
import {
  FiCheckCircle, FiXCircle, FiAlertCircle,
  FiArrowLeft, FiPause, FiPlay, FiRefreshCw
} from "react-icons/fi";
import { useForm, Controller } from "react-hook-form";
import { ifoodService } from "../../../services/ifoodService";
import { IFoodStatusLoja, IFoodInterrupcao } from "../../../interfaces/ifood";
import { AuthContext } from "@/contexts/AuthContext";
import CustomButton from "@/components/ui/Buttons";
import BaseModal from "@/components/Modals/Base/Index";
import KRDInput from "@/components/ui/KRDInput";
import { LabelGroup } from "@/components/ui/LabelGroup";
import styles from "../styles.module.scss";

type PausaForm = { description: string; start: string; end: string };

export default function IFoodLojaPage() {
  const router = useRouter();
  const { getUser } = useContext(AuthContext);
  const [empresaId, setEmpresaId] = useState<number>(0);
  const [statusList, setStatusList] = useState<IFoodStatusLoja[]>([]);
  const [interrupcoes, setInterrupcoes] = useState<IFoodInterrupcao[]>([]);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [loadingPausa, setLoadingPausa] = useState(false);
  const [loadingRemover, setLoadingRemover] = useState<string | null>(null);
  const [modalPausa, setModalPausa] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState<Date | null>(null);

  const { control, handleSubmit, reset } = useForm<PausaForm>();

  useEffect(() => { carregarEmpresaId(); }, []);

  useEffect(() => {
    if (empresaId === 0) return;
    carregarTudo();
    const interval = setInterval(carregarStatus, 30000);
    return () => clearInterval(interval);
  }, [empresaId]);

  async function carregarEmpresaId() {
    const user = await getUser();
    if (user) setEmpresaId(user.empresaSelecionada);
  }

  async function carregarTudo() {
    await Promise.all([carregarStatus(), carregarInterrupcoes()]);
  }

  async function carregarStatus() {
    setLoadingStatus(true);
    try {
      const result = await ifoodService.getStatusLoja(empresaId);
      if (result.sucesso) {
        setStatusList(result.dados);
        setUltimaAtualizacao(new Date());
      }
    } finally {
      setLoadingStatus(false);
    }
  }

  async function carregarInterrupcoes() {
    try {
      const result = await ifoodService.getInterrupcoes(empresaId);
      if (result.sucesso) setInterrupcoes(result.dados);
    } catch { }
  }

  async function onCriarPausa(form: PausaForm) {
    setLoadingPausa(true);
    setErro(null);
    try {
      const result = await ifoodService.criarInterrupcao(empresaId, {
        description: form.description,
        start: new Date(form.start).toISOString(),
        end: new Date(form.end).toISOString(),
      });
      if (result.sucesso) {
        setInterrupcoes(prev => [...prev, result.dados]);
        setModalPausa(false);
        reset();
        await carregarStatus();
      } else {
        setErro(result.erro);
      }
    } catch {
      setErro("Erro ao criar pausa.");
    } finally {
      setLoadingPausa(false);
    }
  }

  async function onRemoverPausa(id: string) {
    setLoadingRemover(id);
    try {
      const result = await ifoodService.removerInterrupcao(empresaId, id);
      if (result.sucesso) {
        setInterrupcoes(prev => prev.filter(x => x.id !== id));
        await carregarStatus();
      }
    } finally {
      setLoadingRemover(null);
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backButton} onClick={() => router.push("/ifood")}>
          <FiArrowLeft size={16} /> Voltar
        </button>
        <h1>Status da loja</h1>
        <div className={styles.headerActions}>
          {ultimaAtualizacao && (
            <span className={styles.ultimaAtualizacao}>
              Atualizado às {ultimaAtualizacao.toLocaleTimeString("pt-BR")}
            </span>
          )}
          <CustomButton
            typeButton="secondary"
            size="sm"
            loading={loadingStatus}
            onClick={carregarTudo}
          >
            <FiRefreshCw size={13} /> Atualizar
          </CustomButton>
        </div>
      </div>

      {/* Cards de status por operação */}
      <div className={styles.statusGrid}>
        {statusList.length === 0 && !loadingStatus && (
          <p className={styles.semDados}>Nenhum status disponível.</p>
        )}
        {statusList.map((s, i) => (
          <div key={i} className={styles.statusCard}>
            <div className={styles.statusCardHeader}>
              <div>
                <span className={styles.operacao}>{s.operation}</span>
                <span className={styles.canal}>{s.salesChannel}</span>
              </div>
              <StateBadge state={s.state} />
            </div>
            <div className={styles.statusCardBody}>
              <p className={styles.statusTitle}>{s.message.title}</p>
              <p className={styles.statusSubtitle}>{s.message.subtitle}</p>
            </div>
            {s.validations.filter(v => v.state !== "OK").length > 0 && (
              <div className={styles.validacoes}>
                {s.validations
                  .filter(v => v.state !== "OK")
                  .map(v => (
                    <div key={v.id} className={styles.validacaoItem}>
                      <FiXCircle size={12} />
                      <span>{v.message?.title ?? v.code}</span>
                      {v.message?.description && (
                        <p className={styles.validacaoDesc}>{v.message.description}</p>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Pausas ativas */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <span className={styles.cardTitle}>
            Pausas ativas
            {interrupcoes.length > 0 && (
              <span className={styles.badge}>{interrupcoes.length}</span>
            )}
          </span>
          <CustomButton
            typeButton="warning"
            size="sm"
            onClick={() => setModalPausa(true)}
          >
            <FiPause size={13} /> Nova pausa
          </CustomButton>
        </div>
        <div className={styles.cardBody}>
          {interrupcoes.length === 0 ? (
            <p className={styles.semDados}>Nenhuma pausa ativa.</p>
          ) : (
            <div className={styles.interrupcoesList}>
              {interrupcoes.map(i => (
                <div key={i.id} className={styles.interrupcaoItem}>
                  <div className={styles.interrupcaoInfo}>
                    <span className={styles.interrupcaoDesc}>{i.description}</span>
                    <span className={styles.interrupcaoPeriodo}>
                      {new Date(i.start).toLocaleString("pt-BR")} até{" "}
                      {new Date(i.end).toLocaleString("pt-BR")}
                    </span>
                  </div>
                  <CustomButton
                    typeButton="success"
                    size="sm"
                    loading={loadingRemover === i.id}
                    onClick={() => onRemoverPausa(i.id)}
                  >
                    <FiPlay size={13} /> Reabrir
                  </CustomButton>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal nova pausa */}
      <BaseModal
        isOpen={modalPausa}
        title="Criar pausa"
        setClose={() => { setModalPausa(false); setErro(null); reset(); }}
        width="480px"
      >
        <form onSubmit={handleSubmit(onCriarPausa)} className={styles.form}>
          <KRDInput
            label="Motivo"
            name="description"
            control={control}
            placeholder="Ex: Manutenção do equipamento"
          />
          <div className={styles.dateRow}>
            <KRDInput
              label="Início"
              name="start"
              type="datetime-local"
              control={control}
              width="50%"
            />
            <KRDInput
              label="Fim"
              name="end"
              type="datetime-local"
              control={control}
              width="50%"
            />
          </div>
          {erro && <span className={styles.erro}>{erro}</span>}
          <div className={styles.formActions}>
            <CustomButton
              typeButton="outline-main"
              type="button"
              onClick={() => { setModalPausa(false); setErro(null); reset(); }}
            >
              Cancelar
            </CustomButton>
            <CustomButton typeButton="warning" type="submit" loading={loadingPausa}>
              Confirmar pausa
            </CustomButton>
          </div>
        </form>
      </BaseModal>
    </div>
  );
}

function StateBadge({ state }: { state: string }) {
  const map = {
    OK:      { cls: styles.badgeOk,      icon: <FiCheckCircle size={13} />, label: "Online" },
    WARNING: { cls: styles.badgeWarning, icon: <FiAlertCircle size={13} />, label: "Atenção" },
    CLOSED:  { cls: styles.badgeClosed,  icon: <FiAlertCircle size={13} />, label: "Fechado" },
    ERROR:   { cls: styles.badgeError,   icon: <FiXCircle size={13} />,     label: "Erro" },
  };
  const item = map[state] ?? map.ERROR;
  return (
    <span className={`${styles.stateBadge} ${item.cls}`}>
      {item.icon} {item.label}
    </span>
  );
}