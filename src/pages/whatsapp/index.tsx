import { useContext, useEffect, useRef, useState } from "react";
import {
    FiCheckCircle, FiXCircle, FiAlertCircle, FiClock, FiRefreshCw, FiAlertTriangle,
} from "react-icons/fi";
import { toast } from "react-toastify";
import { whatsappService } from "../../services/whatsappService";
import {
    WhatsappIntegracao,
    WhatsappIntegracaoStatus,
    WhatsappIntegracaoTipo,
} from "../../interfaces/whatsapp";
import styles from "./styles.module.scss";
import { LabelGroup } from "@/components/ui/LabelGroup";
import CustomButton from "@/components/ui/Buttons";
import BaseModal from "@/components/Modals/Base/Index";
import { AuthContext } from "@/contexts/AuthContext";

const STATUS_LABEL: Record<WhatsappIntegracaoStatus, string> = {
    [WhatsappIntegracaoStatus.NaoConfigurado]: "Não configurado",
    [WhatsappIntegracaoStatus.AguardandoQrCode]: "Aguardando QR Code",
    [WhatsappIntegracaoStatus.Conectado]: "Conectado",
    [WhatsappIntegracaoStatus.Desconectado]: "Desconectado",
    [WhatsappIntegracaoStatus.Erro]: "Erro",
};

const TIPO_LABEL: Record<WhatsappIntegracaoTipo, string> = {
    [WhatsappIntegracaoTipo.Oficial]: "Oficial (Meta)",
    [WhatsappIntegracaoTipo.NaoOficial]: "Não oficial (Evolution)",
};

export default function WhatsappPage() {
    const { getUser } = useContext(AuthContext);
    const [empresaId, setEmpresaId] = useState<number>(0);
    const [integracao, setIntegracao] = useState<WhatsappIntegracao | null>(null);
    const [carregando, setCarregando] = useState(true);
    const [loadingCriar, setLoadingCriar] = useState(false);
    const [loadingStatus, setLoadingStatus] = useState(false);
    const [loadingDesconectar, setLoadingDesconectar] = useState(false);
    const [loadingExcluir, setLoadingExcluir] = useState(false);
    const [modalExcluir, setModalExcluir] = useState(false);
    const [modalQrCode, setModalQrCode] = useState(false);
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [loadingQrCode, setLoadingQrCode] = useState(false);

    const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => { carregarEmpresaId(); }, []);
    useEffect(() => { if (empresaId > 0) carregarIntegracao(); }, [empresaId]);

    useEffect(() => {
        pararPolling();
        if (modalQrCode && integracao?.status === WhatsappIntegracaoStatus.AguardandoQrCode) {
            pollingRef.current = setInterval(() => atualizarStatus(true), 5000);
        }
        return pararPolling;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [modalQrCode, integracao?.status]);

    function pararPolling() {
        if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
        }
    }

    async function carregarEmpresaId() {
        const user = await getUser();
        if (user) setEmpresaId(user.empresaSelecionada);
    }

    async function carregarIntegracao() {
        setCarregando(true);
        try {
            const data = await whatsappService.getIntegracao(empresaId);
            setIntegracao(data);
        } catch (err: any) {
            if (err.response?.status === 404) {
                setIntegracao(null);
            } else {
                toast.error(`Erro ao carregar integração. ${err.response?.data || err.message}`);
            }
        } finally {
            setCarregando(false);
        }
    }

    async function onCriar(tipo: WhatsappIntegracaoTipo) {
        setLoadingCriar(true);
        try {
            const data = await whatsappService.criar({ empresaId, tipo });
            setIntegracao(data);
            await abrirQrCode();
        } catch (err: any) {
            toast.error(`Erro ao criar integração. ${err.response?.data || err.message}`);
        } finally {
            setLoadingCriar(false);
        }
    }

    async function atualizarStatus(silencioso = false) {
        if (!silencioso) setLoadingStatus(true);
        try {
            const data = await whatsappService.getStatus(empresaId);
            setIntegracao(data);
            if (data.status === WhatsappIntegracaoStatus.Conectado) {
                setModalQrCode(false);
                if (!silencioso) toast.success("WhatsApp conectado!");
            }
        } catch (err: any) {
            if (!silencioso) toast.error(`Erro ao atualizar status. ${err.response?.data || err.message}`);
        } finally {
            if (!silencioso) setLoadingStatus(false);
        }
    }

    async function abrirQrCode() {
        setModalQrCode(true);
        setLoadingQrCode(true);
        try {
            const qr = await whatsappService.getQrCode(empresaId);
            setQrCode(qr);
        } catch (err: any) {
            toast.error(`Erro ao gerar QR Code. ${err.response?.data || err.message}`);
            setModalQrCode(false);
        } finally {
            setLoadingQrCode(false);
        }
    }

    async function onDesconectar() {
        setLoadingDesconectar(true);
        try {
            await whatsappService.desconectar(empresaId);
            await carregarIntegracao();
            toast.success("WhatsApp desconectado.");
        } catch (err: any) {
            toast.error(`Erro ao desconectar. ${err.response?.data || err.message}`);
        } finally {
            setLoadingDesconectar(false);
        }
    }

    async function onExcluir() {
        setLoadingExcluir(true);
        try {
            await whatsappService.excluir(empresaId);
            setIntegracao(null);
            setModalExcluir(false);
            toast.success("Integração excluída.");
        } catch (err: any) {
            toast.error(`Erro ao excluir integração. ${err.response?.data || err.message}`);
        } finally {
            setLoadingExcluir(false);
        }
    }

    const conectado = integracao?.status === WhatsappIntegracaoStatus.Conectado;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>Integração WhatsApp</h1>
            </div>

            {(!integracao || integracao.tipo === WhatsappIntegracaoTipo.NaoOficial) && (
                <div className={styles.warningBox}>
                    <FiAlertTriangle size={18} />
                    <span>
                        A integração não oficial (Evolution) usa uma conexão não homologada
                        pela Meta/WhatsApp e pode resultar em <b>banimento do número</b> a
                        qualquer momento. O uso é por sua conta e risco — não nos
                        responsabilizamos por bloqueios, banimentos ou perda de acesso ao
                        número conectado.
                    </span>
                </div>
            )}

            <div className={styles.card}>
                <div className={styles.cardHeader}>
                    <span className={styles.cardTitle}>Status da conexão</span>
                    <StatusBadge status={integracao} />
                </div>

                <div className={styles.cardBody}>
                    {carregando ? (
                        <p className={styles.semIntegracao}>Carregando...</p>
                    ) : integracao ? (
                        <div className={styles.infoGrid}>
                            <LabelGroup title="Tipo" value={TIPO_LABEL[integracao.tipo]} width="200px" />
                            <LabelGroup title="Status" value={STATUS_LABEL[integracao.status]} width="160px" />
                            <LabelGroup title="Número" value={integracao.numeroWhatsapp ?? "—"} width="160px" />
                            <LabelGroup
                                title="Conectado em"
                                value={integracao.conectadoEm ? new Date(integracao.conectadoEm).toLocaleString("pt-BR") : "—"}
                                width="200px"
                            />
                            {integracao.ultimoErro && (
                                <LabelGroup title="Último erro" value={integracao.ultimoErro} width="100%" color="var(--danger)" />
                            )}
                        </div>
                    ) : (
                        <p className={styles.semIntegracao}>
                            Nenhuma integração de WhatsApp configurada para esta empresa.
                        </p>
                    )}
                </div>

                <div className={styles.cardFooter}>
                    {!integracao ? (
                        <div className={styles.footerActions}>
                            <CustomButton
                                typeButton="outline-main"
                                disabled
                                title="Integração oficial via Meta ainda não está disponível"
                            >
                                Conectar oficial (em breve)
                            </CustomButton>
                            <CustomButton
                                typeButton="main"
                                loading={loadingCriar}
                                onClick={() => onCriar(WhatsappIntegracaoTipo.NaoOficial)}
                            >
                                Conectar via Evolution
                            </CustomButton>
                        </div>
                    ) : (
                        <div className={styles.footerActions}>
                            <div className={styles.footerLinks}>
                                <button className={styles.linkButton} onClick={() => atualizarStatus()}>
                                    <FiRefreshCw size={14} className={loadingStatus ? styles.spin : ""} /> Atualizar status
                                </button>
                                {!conectado && (
                                    <button className={styles.linkButton} onClick={abrirQrCode}>
                                        <FiClock size={14} /> Ver QR Code
                                    </button>
                                )}
                            </div>
                            <div className={styles.footerActions}>
                                {conectado && (
                                    <CustomButton
                                        typeButton="danger"
                                        loading={loadingDesconectar}
                                        onClick={onDesconectar}
                                    >
                                        Desconectar
                                    </CustomButton>
                                )}
                                <CustomButton
                                    typeButton="outline-main"
                                    onClick={() => setModalExcluir(true)}
                                >
                                    Excluir
                                </CustomButton>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <BaseModal
                isOpen={modalQrCode}
                title="Conectar WhatsApp"
                setClose={() => { setModalQrCode(false); setQrCode(null); }}
                width="400px"
            >
                <div className={styles.form}>
                    <p className={styles.formDesc}>
                        Abra o WhatsApp no celular, vá em Aparelhos conectados e escaneie o
                        código abaixo.
                    </p>
                    <div className={styles.qrCodeBox}>
                        {loadingQrCode ? (
                            <p className={styles.semDados}>Gerando QR Code...</p>
                        ) : qrCode ? (
                            <img src={qrCode} alt="QR Code do WhatsApp" className={styles.qrCodeImg} />
                        ) : (
                            <p className={styles.semDados}>Não foi possível gerar o QR Code.</p>
                        )}
                    </div>
                    <div className={styles.formActions}>
                        <CustomButton typeButton="outline-main" onClick={abrirQrCode} loading={loadingQrCode}>
                            Gerar novo código
                        </CustomButton>
                    </div>
                </div>
            </BaseModal>

            <BaseModal
                isOpen={modalExcluir}
                title="Excluir integração"
                setClose={() => setModalExcluir(false)}
                width="400px"
            >
                <div className={styles.form}>
                    <p className={styles.formDesc}>
                        Tem certeza que deseja excluir a integração de WhatsApp? A instância
                        será removida e será necessário criar e parear novamente.
                    </p>
                    <div className={styles.formActions}>
                        <CustomButton typeButton="outline-main" onClick={() => setModalExcluir(false)}>
                            Cancelar
                        </CustomButton>
                        <CustomButton typeButton="danger" loading={loadingExcluir} onClick={onExcluir}>
                            Excluir
                        </CustomButton>
                    </div>
                </div>
            </BaseModal>
        </div>
    );
}

function StatusBadge({ status }: { status: WhatsappIntegracao | null }) {
    if (!status) return (
        <span className={`${styles.badge} ${styles.badgeNeutro}`}>
            <FiAlertCircle size={14} /> Não configurado
        </span>
    );
    if (status.status === WhatsappIntegracaoStatus.Conectado) return (
        <span className={`${styles.badge} ${styles.badgeAtivo}`}>
            <FiCheckCircle size={14} /> Conectado
        </span>
    );
    if (status.status === WhatsappIntegracaoStatus.Erro) return (
        <span className={`${styles.badge} ${styles.badgeErro}`}>
            <FiXCircle size={14} /> Erro
        </span>
    );
    return (
        <span className={`${styles.badge} ${styles.badgeNeutro}`}>
            <FiAlertCircle size={14} /> {STATUS_LABEL[status.status]}
        </span>
    );
}
