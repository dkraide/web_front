import { useContext, useEffect, useState } from "react";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import {
    FiCheckCircle, FiXCircle, FiAlertCircle, FiRefreshCw, FiBook,
    FiExternalLink, FiPower, FiCopy
} from "react-icons/fi";
import { food99Service } from "../../services/food99Service";
import { api } from "../../services/apiClient";
import { Food99Integracao, Food99Loja } from "../../interfaces/food99";
import styles from "../ifood/styles.module.scss";
import { LabelGroup } from "@/components/ui/LabelGroup";
import CustomButton from "@/components/ui/Buttons";
import BaseModal from "@/components/Modals/Base/Index";
import { AuthContext } from "@/contexts/AuthContext";

const STATUS_LABEL: Record<Food99Integracao["status"], string> = {
    Pendente: "Aguardando autorização",
    Ativo: "Conectado",
    Erro: "Erro",
};

const SUB_STATUS_LABEL: Record<number, string> = {
    0: "—",
    1: "Aberta",
    2: "Pausada",
    3: "Fechada",
    4: "Desconectada",
    5: "Fechada no dia",
    6: "Bloqueada",
    7: "Fechada pelo sistema (sem entregador)",
};

export default function Food99Page() {
    const router = useRouter();
    const { getUser } = useContext(AuthContext);
    const [empresaId, setEmpresaId] = useState<number>(0);
    const [integracao, setIntegracao] = useState<Food99Integracao | null>(null);
    const [loja, setLoja] = useState<Food99Loja | null>(null);
    const [erroLoja, setErroLoja] = useState<string | null>(null);
    const [carregando, setCarregando] = useState(true);
    const [conectando, setConectando] = useState(false);
    const [verificando, setVerificando] = useState(false);
    const [carregandoLoja, setCarregandoLoja] = useState(false);
    const [alterandoLoja, setAlterandoLoja] = useState(false);
    const [loadingRemover, setLoadingRemover] = useState(false);
    const [modalRemover, setModalRemover] = useState(false);

    const webhookUrl = `${api.defaults.baseURL ?? ""}/food99/webhook`;

    useEffect(() => { carregarEmpresaId(); }, []);
    useEffect(() => { if (empresaId > 0) carregarIntegracao(); }, [empresaId]);

    async function carregarEmpresaId() {
        const user = await getUser();
        if (user) setEmpresaId(user.empresaSelecionada);
    }

    async function carregarIntegracao() {
        setCarregando(true);
        // 404 = ainda não configurada: não é erro para o usuário.
        const result = await food99Service.obterIntegracao(empresaId);
        const atual = result.sucesso ? result.dados : null;
        setIntegracao(atual);
        setLoja(null);
        setCarregando(false);
        if (atual?.status === "Ativo") carregarLoja();
    }

    async function carregarLoja() {
        setCarregandoLoja(true);
        setErroLoja(null);
        const result = await food99Service.detalheLoja(empresaId);
        if (result.sucesso) setLoja(result.dados);
        else setErroLoja(result.erro);
        setCarregandoLoja(false);
    }

    async function onConectar() {
        setConectando(true);
        const result = await food99Service.conectar(empresaId);
        setConectando(false);
        if (!result.sucesso) {
            toast.error(result.erro || "Erro ao iniciar a conexão com o 99Food.");
            return;
        }
        setIntegracao(result.dados);
        if (result.dados.urlAutorizacao) window.open(result.dados.urlAutorizacao, "_blank", "noopener");
    }

    async function abrirAutorizacao() {
        if (integracao?.urlAutorizacao) {
            window.open(integracao.urlAutorizacao, "_blank", "noopener");
            return;
        }
        // O link só vem ao conectar; pede de novo se a página foi recarregada.
        await onConectar();
    }

    async function onVerificar() {
        setVerificando(true);
        const result = await food99Service.verificar(empresaId);
        setVerificando(false);
        if (!result.sucesso) {
            toast.error(result.erro || "Erro ao verificar integração.");
            return;
        }
        setIntegracao(prev => ({ ...result.dados, urlAutorizacao: prev?.urlAutorizacao }));
        if (result.dados.status === "Ativo") {
            toast.success("Loja conectada ao 99Food com sucesso!");
            carregarLoja();
        } else {
            toast.info(result.dados.mensagem || "Ainda aguardando a autorização da loja no 99Food.", { autoClose: 10000 });
        }
    }

    async function onAlterarStatusLoja(online: boolean) {
        setAlterandoLoja(true);
        // Online: abre e deixa o 99Food abrir/fechar pelos horários. Offline: loja fica fechada até reabrir aqui.
        const result = await food99Service.definirStatusLoja(empresaId, online ? 1 : 2, 3);
        setAlterandoLoja(false);
        if (!result.sucesso) {
            toast.error(result.erro || "Erro ao alterar o status da loja.");
            return;
        }
        toast.success(online ? "Loja aberta para pedidos." : "Loja fechada para pedidos.");
        carregarLoja();
    }

    async function onRemover() {
        setLoadingRemover(true);
        const result = await food99Service.desconectar(empresaId);
        setLoadingRemover(false);
        if (!result.sucesso) {
            toast.error(result.erro || "Erro ao remover integração.");
            return;
        }
        setIntegracao(null);
        setLoja(null);
        setModalRemover(false);
        toast.success("Integração removida.");
    }

    async function copiarWebhook() {
        try {
            await navigator.clipboard.writeText(webhookUrl);
            toast.success("URL copiada.");
        } catch {
            toast.info(webhookUrl);
        }
    }

    const online = loja?.biz_status === 1;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>Integração 99Food</h1>
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
                            <LabelGroup title="Identificador da loja (KRD)" value={integracao.appShopId} width="220px" />
                            <LabelGroup title="Loja no 99Food" value={integracao.shopId ?? "—"} width="220px" />
                            <LabelGroup title="Status" value={STATUS_LABEL[integracao.status]} width="180px" />
                        </div>
                    ) : (
                        <p className={styles.semIntegracao}>
                            Nenhuma loja conectada ao 99Food para esta empresa.
                        </p>
                    )}
                </div>

                <div className={styles.cardFooter}>
                    {!carregando && !integracao && (
                        <div className={styles.footerActions}>
                            <p className={styles.aviso}>
                                Você será levado à página do 99Food para autorizar a loja. Depois volte aqui e clique em &quot;Verificar vínculo&quot;.
                            </p>
                            <CustomButton loading={conectando} onClick={onConectar}>
                                Conectar loja
                            </CustomButton>
                        </div>
                    )}

                    {integracao && integracao.status !== "Ativo" && (
                        <div className={styles.footerActions}>
                            <p className={styles.aviso}>
                                {integracao.status === "Pendente"
                                    ? "Se a loja já foi vinculada no portal do 99Food, basta verificar o vínculo (pode levar cerca de 30 segundos). Senão: 1) Autorize a loja na página do 99Food.  2) Volte e verifique o vínculo."
                                    : "Houve um problema com esta conexão. Verifique novamente ou contate o suporte."}
                            </p>
                            <div className={styles.footerLinks}>
                                <CustomButton typeButton="outline-main" loading={conectando} onClick={abrirAutorizacao}>
                                    <FiExternalLink size={14} /> Abrir página do 99Food
                                </CustomButton>
                                <CustomButton typeButton="outline-main" loading={verificando} onClick={onVerificar}>
                                    <FiRefreshCw size={14} /> Verificar vínculo
                                </CustomButton>
                                <CustomButton typeButton="danger" onClick={() => setModalRemover(true)}>
                                    Remover
                                </CustomButton>
                            </div>
                        </div>
                    )}

                    {integracao?.status === "Ativo" && (
                        <div className={styles.footerActions}>
                            <div className={styles.footerLinks}>
                                <button className={styles.linkButton} onClick={() => router.push("/food99/cardapio")}>
                                    <FiBook size={14} /> Cardápio
                                </button>
                            </div>
                            <CustomButton typeButton="danger" onClick={() => setModalRemover(true)}>
                                Desconectar
                            </CustomButton>
                        </div>
                    )}
                </div>
            </div>

            {integracao?.status === "Ativo" && (
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <span className={styles.cardTitle}>Loja</span>
                        <CustomButton typeButton="outline-main" loading={carregandoLoja} onClick={carregarLoja}>
                            <FiRefreshCw size={14} /> Atualizar
                        </CustomButton>
                    </div>
                    <div className={styles.cardBody}>
                        {erroLoja && <p className={styles.erro}>{erroLoja}</p>}
                        {!erroLoja && !loja && <p className={styles.semDados}>Carregando...</p>}
                        {loja && (
                            <>
                                <div className={styles.infoGrid}>
                                    <LabelGroup title="Nome" value={loja.name || "—"} width="260px" />
                                    <LabelGroup
                                        title="Situação"
                                        value={`${online ? "Aberta para pedidos" : "Fechada para pedidos"} · ${SUB_STATUS_LABEL[loja.sub_biz_status ?? 0] ?? "—"}`}
                                        width="320px"
                                    />
                                </div>
                                <div className={styles.detalheBloco}>
                                    <LabelGroup title="Endereço" value={loja.addr || "—"} width="100%" />
                                </div>
                                <div className={styles.detalheBloco}>
                                    <CustomButton
                                        typeButton={online ? "danger" : "success"}
                                        loading={alterandoLoja}
                                        onClick={() => onAlterarStatusLoja(!online)}
                                    >
                                        <FiPower size={14} /> {online ? "Fechar loja" : "Abrir loja"}
                                    </CustomButton>
                                    <p className={styles.aviso} style={{ marginTop: 8 }}>
                                        O 99Food limita esta consulta a 1 por minuto.
                                    </p>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            <div className={styles.card}>
                <div className={styles.cardHeader}>
                    <span className={styles.cardTitle}>Webhook de pedidos</span>
                </div>
                <div className={styles.cardBody}>
                    <p className={styles.formDesc}>
                        Cadastre esta URL no aplicativo, em &quot;Application Management&quot; do portal do 99Food. É por ela que os
                        pedidos e os resultados de envio de cardápio chegam ao sistema.
                    </p>
                    <div className={styles.footerLinks} style={{ marginTop: 12, alignItems: "center" }}>
                        <code style={{ fontSize: 13, wordBreak: "break-all" }}>{webhookUrl}</code>
                        <button className={styles.linkButton} onClick={copiarWebhook}>
                            <FiCopy size={14} /> Copiar
                        </button>
                    </div>
                </div>
            </div>

            <BaseModal
                isOpen={modalRemover}
                title="Remover integração 99Food"
                setClose={() => setModalRemover(false)}
                width="400px"
            >
                <div className={styles.form}>
                    <p className={styles.formDesc}>
                        Tem certeza que deseja remover esta integração? Os pedidos deixarão de ser recebidos
                        até que uma nova conexão seja estabelecida.
                    </p>
                    <div className={styles.formActions}>
                        <CustomButton typeButton="outline-main" onClick={() => setModalRemover(false)}>
                            Cancelar
                        </CustomButton>
                        <CustomButton typeButton="danger" loading={loadingRemover} onClick={onRemover}>
                            Remover
                        </CustomButton>
                    </div>
                </div>
            </BaseModal>
        </div>
    );
}

function StatusBadge({ status }: { status: Food99Integracao | null }) {
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
