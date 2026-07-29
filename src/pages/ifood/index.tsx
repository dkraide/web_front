import { useContext, useEffect, useState } from "react";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import {
    FiCheckCircle, FiXCircle, FiAlertCircle,
    FiClock, FiActivity, FiRefreshCw, FiPhoneCall, FiBook, FiLayers
} from "react-icons/fi";
import { ifoodService } from "../../services/ifoodService";
import { IFoodIntegracaoStatus, IFoodMerchant } from "../../interfaces/ifood";
import styles from "./styles.module.scss";
import { LabelGroup } from "@/components/ui/LabelGroup";
import CustomButton from "@/components/ui/Buttons";
import BaseModal from "@/components/Modals/Base/Index";
import { AuthContext } from "@/contexts/AuthContext";

const STATUS_LABEL: Record<IFoodIntegracaoStatus["status"], string> = {
    Pendente: "Aguardando confirmação",
    Ativo: "Conectado",
    Erro: "Erro",
};

const TIPO_LABEL: Record<string, string> = {
    RESTAURANT: "Restaurante",
    GROCERY: "Mercado",
    STORE: "Loja"
};

function formatarEndereco(a: IFoodMerchant["address"]): string | null {
    if (!a) return null;
    const rua = [a.street, a.number].filter(Boolean).join(", ");
    const partes = [rua, a.district, a.city, a.state, a.postalCode].filter(Boolean);
    return partes.length > 0 ? partes.join(" · ") : null;
}

export default function IFoodPage() {
    const router = useRouter();
    const { getUser } = useContext(AuthContext);
    const [empresaId, setEmpresaId] = useState<number>(0);
    const [integracao, setIntegracao] = useState<IFoodIntegracaoStatus | null>(null);
    const [merchant, setMerchant] = useState<IFoodMerchant | null>(null);
    const [carregando, setCarregando] = useState(true);
    const [verificando, setVerificando] = useState(false);
    const [loadingRemover, setLoadingRemover] = useState(false);
    const [modalRemover, setModalRemover] = useState(false);

    useEffect(() => { carregarEmpresaId(); }, []);
    useEffect(() => { if (empresaId > 0) carregarIntegracao(); }, [empresaId]);

    async function carregarEmpresaId() {
        const user = await getUser();
        if (user) setEmpresaId(user.empresaSelecionada);
    }

    async function carregarIntegracao() {
        setCarregando(true);
        try {
            const result = await ifoodService.listarIntegracoes(empresaId);
            const atual = result.sucesso && result.dados.length > 0 ? result.dados[0] : null;
            setIntegracao(atual);
            setMerchant(null);
            if (atual) carregarMerchant(atual.merchantId);
        } catch {
            setIntegracao(null);
        } finally {
            setCarregando(false);
        }
    }

    async function carregarMerchant(merchantId: string) {
        try {
            const result = await ifoodService.obterMerchant(merchantId);
            if (result.sucesso) setMerchant(result.dados);
        } catch { }
    }

    async function onVerificar() {
        if (!integracao) return;
        setVerificando(true);
        try {
            const result = await ifoodService.verificarIntegracao(empresaId, integracao.merchantId);
            if (result.sucesso) {
                setIntegracao(result.dados);
                if (result.dados.status === "Ativo") {
                    toast.success("Loja conectada ao iFood com sucesso!");
                    carregarMerchant(result.dados.merchantId);
                } else {
                    toast.info("Ainda aguardando a confirmação da loja no iFood.");
                }
            } else {
                toast.error(result.erro || "Erro ao verificar integração.");
            }
        } catch {
            toast.error("Erro ao verificar integração.");
        } finally {
            setVerificando(false);
        }
    }

    async function onRemover() {
        if (!integracao) return;
        setLoadingRemover(true);
        try {
            const result = await ifoodService.removerIntegracao(empresaId, integracao.merchantId);
            if (result.sucesso) {
                setIntegracao(null);
                setMerchant(null);
                setModalRemover(false);
                toast.success("Integração removida.");
            } else {
                toast.error(result.erro || "Erro ao remover integração.");
            }
        } catch {
            toast.error("Erro ao remover integração.");
        } finally {
            setLoadingRemover(false);
        }
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>Integração iFood</h1>
            </div>

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
                            <LabelGroup title="Loja" value={merchant?.name ?? "—"} width="220px" />
                            <LabelGroup title="Merchant ID" value={integracao.merchantId} width="220px" />
                            <LabelGroup title="Status" value={STATUS_LABEL[integracao.status]} width="160px" />
                        </div>
                    ) : (
                        <p className={styles.semIntegracao}>
                            Nenhuma loja conectada ao iFood para esta empresa.
                        </p>
                    )}
                </div>

                <div className={styles.cardFooter}>
                    {integracao?.status === "Ativo" && (
                        <div className={styles.footerActions}>
                            <div className={styles.footerLinks}>
                                <button
                                    className={styles.linkButton}
                                    onClick={() => router.push("/ifood/catalogo")}
                                >
                                    <FiBook size={14} /> Cardápio
                                </button>
                                <button
                                    className={styles.linkButton}
                                    onClick={() => router.push("/ifood/complementos")}
                                >
                                    <FiLayers size={14} /> Complementos
                                </button>
                                <button
                                    className={styles.linkButton}
                                    onClick={() => router.push("/ifood/loja")}
                                >
                                    <FiActivity size={14} /> Status da loja
                                </button>
                                <button
                                    className={styles.linkButton}
                                    onClick={() => router.push("/ifood/horarios")}
                                >
                                    <FiClock size={14} /> Horários
                                </button>
                            </div>
                            <CustomButton
                                typeButton="danger"
                                onClick={() => setModalRemover(true)}
                            >
                                Desconectar
                            </CustomButton>
                        </div>
                    )}

                    {(integracao?.status === "Pendente" || integracao?.status === "Erro") && (
                        <div className={styles.footerActions}>
                            <p className={styles.aviso}>
                                {integracao.status === "Pendente"
                                    ? "Aguardando a loja aceitar o convite de integração no painel do iFood."
                                    : "Houve um problema com esta conexão. Verifique novamente ou contate o suporte."}
                            </p>
                            <div className={styles.footerLinks}>
                                <CustomButton
                                    typeButton="outline-main"
                                    loading={verificando}
                                    onClick={onVerificar}
                                >
                                    <FiRefreshCw size={14} /> Verificar novamente
                                </CustomButton>
                                <CustomButton
                                    typeButton="danger"
                                    onClick={() => setModalRemover(true)}
                                >
                                    Remover
                                </CustomButton>
                            </div>
                        </div>
                    )}

                    {!carregando && !integracao && (
                        <div className={styles.supportNotice}>
                            <FiPhoneCall size={18} />
                            <p>
                                Para conectar sua loja ao iFood, nossa equipe precisa enviar o
                                convite de integração pelo painel do iFood. Entre em contato com
                                o suporte KRD para solicitarmos a conexão.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {integracao && merchant && (
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <span className={styles.cardTitle}>Detalhes da loja</span>
                    </div>
                    <div className={styles.cardBody}>
                        <div className={styles.infoGrid}>
                            <LabelGroup title="Nome da loja" value={merchant.name || "—"} width="220px" />
                            <LabelGroup
                                title="Categoria"
                                value={merchant.type ? (TIPO_LABEL[merchant.type] ?? merchant.type) : "—"}
                                width="160px"
                            />
                            <LabelGroup title="ID da loja" value={merchant.id || integracao.merchantId} width="280px" />
                        </div>

                        <div className={styles.detalheBloco}>
                            <LabelGroup
                                title="Descrição"
                                value={merchant.description || "—"}
                                width="100%"
                            />
                        </div>

                        <div className={styles.detalheBloco}>
                            <LabelGroup
                                title="Endereço"
                                value={formatarEndereco(merchant.address) ?? "—"}
                                width="100%"
                            />
                            {merchant.address && (
                                <div className={styles.infoGrid} style={{ marginTop: 12 }}>
                                    <LabelGroup title="Cidade" value={merchant.address.city ?? "—"} width="160px" />
                                    <LabelGroup title="Estado" value={merchant.address.state ?? "—"} width="120px" />
                                    <LabelGroup title="Bairro" value={merchant.address.district ?? "—"} width="160px" />
                                    <LabelGroup title="CEP" value={merchant.address.postalCode ?? "—"} width="120px" />
                                    <LabelGroup title="País" value={merchant.address.country ?? "—"} width="100px" />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <BaseModal
                isOpen={modalRemover}
                title="Remover integração iFood"
                setClose={() => setModalRemover(false)}
                width="400px"
            >
                <div className={styles.form}>
                    <p className={styles.formDesc}>
                        Tem certeza que deseja remover esta integração? Os pedidos deixarão
                        de ser recebidos até que uma nova conexão seja estabelecida.
                    </p>
                    <div className={styles.formActions}>
                        <CustomButton
                            typeButton="outline-main"
                            onClick={() => setModalRemover(false)}
                        >
                            Cancelar
                        </CustomButton>
                        <CustomButton
                            typeButton="danger"
                            loading={loadingRemover}
                            onClick={onRemover}
                        >
                            Remover
                        </CustomButton>
                    </div>
                </div>
            </BaseModal>
        </div>
    );
}

function StatusBadge({ status }: { status: IFoodIntegracaoStatus | null }) {
    if (!status) return (
        <span className={`${styles.badge} ${styles.badgeNeutro}`}>
            <FiAlertCircle size={14} /> Não conectado
        </span>
    );
    if (status.status === "Ativo") return (
        <span className={`${styles.badge} ${styles.badgeAtivo}`}>
            <FiCheckCircle size={14} /> Conectado
        </span>
    );
    if (status.status === "Erro") return (
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
