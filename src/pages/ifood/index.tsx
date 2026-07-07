import { useContext, useEffect, useState } from "react";
import { useRouter } from "next/router";
import {
    FiCheckCircle, FiXCircle, FiAlertCircle,
    FiExternalLink, FiClock, FiActivity
} from "react-icons/fi";
import { ifoodService } from "../../services/ifoodService";
import { IFoodIntegracaoStatus, IFoodMerchant } from "../../interfaces/ifood";
import { useForm } from "react-hook-form";
import styles from "./styles.module.scss";
import { LabelGroup } from "@/components/ui/LabelGroup";
import CustomButton from "@/components/ui/Buttons";
import KRDInput from "@/components/ui/KRDInput";
import BaseModal from "@/components/Modals/Base/Index";
import { AuthContext } from "@/contexts/AuthContext";

const STATUS_LABEL = { 0: "Pendente", 1: "Ativo", 2: "Erro", 3: "Revogado" };

export default function IFoodPage() {
    const router = useRouter();
    const { getUser } = useContext(AuthContext);
    const [empresaId, setEmpresaId] = useState<number>(0);
    const [integracao, setIntegracao] = useState<IFoodIntegracaoStatus | null>(null);
    const [loading, setLoading] = useState(false);
    const [loadingRevogar, setLoadingRevogar] = useState(false);
    const [modalConectar, setModalConectar] = useState(false);
    const [modalRevogar, setModalRevogar] = useState(false);
    const [erro, setErro] = useState<string | null>(null);
    const [verificationUrl, setVerificationUrl] = useState<string | null>(null);
    const [merchants, setMerchants] = useState<IFoodMerchant[]>([]);
    const [modalMerchant, setModalMerchant] = useState(false);
    const [loadingMerchant, setLoadingMerchant] = useState(false);

    const { control, handleSubmit, reset } = useForm<{ authorizationCode: string }>();

    useEffect(() => { carregarEmpresaId(); }, []);
    useEffect(() => { if (empresaId > 0) carregarStatus(); }, [empresaId]);

    async function carregarEmpresaId() {
        const user = await getUser();
        if (user) setEmpresaId(user.empresaSelecionada);
    }

    async function carregarStatus() {
        try {
            const result = await ifoodService.getStatus(empresaId);
            if (result.sucesso) {
                setIntegracao(result.dados);
                // token ativo mas sem merchant ainda
                if (result.dados.tokenValido && !result.dados.merchantId) {
                    await resolverMerchant();
                }
            }
        } catch { }
    }

    async function onIniciarConexao() {
        setLoading(true);
        setErro(null);
        try {
            const result = await ifoodService.iniciarAutorizacao(empresaId);
            if (result.sucesso) {
                setVerificationUrl(result.dados.verificationUrl);
                window.open(result.dados.verificationUrl, "_blank");
                setModalConectar(true);
            } else {
                setErro(result.erro);
            }
        } catch {
            setErro("Erro ao iniciar conexão.");
        } finally {
            setLoading(false);
        }
    }

    async function onConectar(form: { authorizationCode: string }) {
        setLoading(true);
        setErro(null);
        try {
            const result = await ifoodService.autorizar(empresaId, {
                authorizationCode: form.authorizationCode,
            });
            if (result.sucesso) {
                setIntegracao(result.dados);
                setModalConectar(false);
                reset();

                // Se não vinculou merchant automaticamente, busca a lista
                if (!result.dados.merchantId) {
                    await resolverMerchant();
                }
            } else {
                setErro(result.erro);
            }
        } catch {
            setErro("Erro ao conectar. Tente novamente.");
        } finally {
            setLoading(false);
        }
    }

    async function resolverMerchant() {
        setLoadingMerchant(true);
        try {
            const result = await ifoodService.listarMerchants(empresaId);
            if (!result.sucesso || result.dados.length === 0) return;

            if (result.dados.length === 1) {
                // Vincula direto, igual o backend
                await vincularMerchant(result.dados[0].id);
            } else {
                // Abre modal de seleção
                setMerchants(result.dados);
                setModalMerchant(true);
            }
        } finally {
            setLoadingMerchant(false);
        }
    }

    async function vincularMerchant(merchantId: string) {
        try {
            const result = await ifoodService.vincularMerchant(empresaId, merchantId);
            if (result.sucesso) {
                setIntegracao(result.dados);
                setModalMerchant(false);
            }
        } catch { }
    }

    async function onRevogar() {
        setLoadingRevogar(true);
        try {
            await ifoodService.revogar(empresaId);
            setIntegracao(null);
            setModalRevogar(false);
        } finally {
            setLoadingRevogar(false);
        }
    }

    const isAtivo = integracao?.status === 1 && integracao?.tokenValido;

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
                    {integracao ? (
                        <div className={styles.infoGrid}>
                            <LabelGroup
                                title="Merchant ID"
                                value={integracao.merchantId ?? "—"}
                                width="200px"
                            />
                            <LabelGroup
                                title="Status"
                                value={STATUS_LABEL[integracao.status]}
                                width="120px"
                            />
                            <LabelGroup
                                title="Token expira em"
                                value={
                                    integracao.expiresAt
                                        ? new Date(integracao.expiresAt).toLocaleString("pt-BR")
                                        : "—"
                                }
                                width="200px"
                            />
                        </div>
                    ) : (
                        <p className={styles.semIntegracao}>
                            Nenhuma integração configurada para esta empresa.
                        </p>
                    )}
                </div>

                <div className={styles.cardFooter}>
                    {isAtivo ? (
                        <div className={styles.footerActions}>
                            <div className={styles.footerLinks}>
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
                                onClick={() => setModalRevogar(true)}
                            >
                                Desconectar
                            </CustomButton>
                        </div>
                    ) : (
                        <CustomButton
                            typeButton="main"
                            loading={loading}
                            onClick={onIniciarConexao}
                        >
                            Conectar ao iFood
                        </CustomButton>
                    )}
                </div>
            </div>

            <BaseModal
                isOpen={modalConectar}
                title="Conectar ao iFood"
                setClose={() => { setModalConectar(false); setErro(null); reset(); }}
                width="480px"
            >
                <form onSubmit={handleSubmit(onConectar)} className={styles.form}>
                    <p className={styles.formDesc}>
                        Uma aba foi aberta com o portal do iFood. Após autorizar,
                        cole abaixo o código gerado.
                    </p>
                    {verificationUrl && (

                        <a href={verificationUrl}
                            target="_blank"
                            rel="noreferrer"
                            className={styles.link}
                        >
                            Reabrir portal do iFood <FiExternalLink size={12} />
                        </a>
                    )}
                    <KRDInput
                        label="Código de autorização"
                        name="authorizationCode"
                        control={control}
                        placeholder="Cole o código gerado no iFood"
                    />
                    {erro && <span className={styles.erro}>{erro}</span>}
                    <div className={styles.formActions}>
                        <CustomButton
                            typeButton="outline-main"
                            type="button"
                            onClick={() => { setModalConectar(false); setErro(null); reset(); }}
                        >
                            Cancelar
                        </CustomButton>
                        <CustomButton typeButton="main" type="submit" loading={loading}>
                            Confirmar
                        </CustomButton>
                    </div>
                </form>
            </BaseModal>

            <BaseModal
                isOpen={modalRevogar}
                title="Desconectar iFood"
                setClose={() => setModalRevogar(false)}
                width="400px"
            >
                <div className={styles.form}>
                    <p className={styles.formDesc}>
                        Tem certeza que deseja desconectar o iFood? Os pedidos deixarão
                        de ser recebidos até uma nova conexão.
                    </p>
                    <div className={styles.formActions}>
                        <CustomButton
                            typeButton="outline-main"
                            onClick={() => setModalRevogar(false)}
                        >
                            Cancelar
                        </CustomButton>
                        <CustomButton
                            typeButton="danger"
                            loading={loadingRevogar}
                            onClick={onRevogar}
                        >
                            Desconectar
                        </CustomButton>
                    </div>
                </div>
            </BaseModal>

            <BaseModal
                isOpen={modalMerchant}
                title="Selecione a loja"
                setClose={() => setModalMerchant(false)}
                width="480px"
            >
                <div className={styles.form}>
                    <p className={styles.formDesc}>
                        Encontramos mais de uma loja vinculada a este token.
                        Selecione qual deseja integrar.
                    </p>
                    <div className={styles.merchantList}>
                        {merchants.map(m => (
                            <button
                                key={m.id}
                                className={styles.merchantItem}
                                onClick={() => vincularMerchant(m.id)}
                            >
                                <span className={styles.merchantName}>{m.name}</span>
                                <span className={styles.merchantCorp}>{m.corporateName}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </BaseModal>
        </div>
    );
}

function StatusBadge({ status }: { status: IFoodIntegracaoStatus | null }) {
    if (!status) return (
        <span className={`${styles.badge} ${styles.badgeNeutro}`}>
            <FiAlertCircle size={14} /> Não configurado
        </span>
    );
    if (status.status === 1 && status.tokenValido) return (
        <span className={`${styles.badge} ${styles.badgeAtivo}`}>
            <FiCheckCircle size={14} /> Conectado
        </span>
    );
    if (status.status === 2) return (
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