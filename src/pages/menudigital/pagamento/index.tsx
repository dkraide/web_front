import { useContext, useEffect, useState } from "react";
import { FiAlertCircle, FiCheckCircle, FiCopy, FiInfo, FiXCircle } from "react-icons/fi";
import { toast } from "react-toastify";
import { AuthContext } from "@/contexts/AuthContext";
import CustomButton from "@/components/ui/Buttons";
import { pixService } from "@/services/pixService";
import { IPixConfiguracao, IPixTesteConexao, PixProvider } from "@/interfaces/IPixConfiguracao";
import styles from "./styles.module.scss";

const PROVEDORES: { value: PixProvider; label: string }[] = [
    { value: "MERCADO_PAGO", label: "Mercado Pago" },
];

export default function PagamentoMenuDigital() {
    const { getUser } = useContext(AuthContext);
    const [empresaId, setEmpresaId] = useState<number>(0);
    const [config, setConfig] = useState<IPixConfiguracao | null>(null);
    const [carregando, setCarregando] = useState(true);
    const [salvando, setSalvando] = useState(false);
    const [testando, setTestando] = useState(false);
    const [teste, setTeste] = useState<IPixTesteConexao | null>(null);

    // Campos editaveis. Token e segredo ficam vazios: vazio = manter o que ja esta salvo.
    const [ativo, setAtivo] = useState(false);
    const [provider, setProvider] = useState<PixProvider>("MERCADO_PAGO");
    const [accessToken, setAccessToken] = useState("");
    const [webhookSecret, setWebhookSecret] = useState("");
    const [emailPadrao, setEmailPadrao] = useState("");

    useEffect(() => {
        (async () => {
            const user = await getUser();
            if (user) setEmpresaId(user.empresaSelecionada);
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (empresaId > 0) carregar();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [empresaId]);

    function aplicar(data: IPixConfiguracao) {
        setConfig(data);
        setAtivo(data.ativo);
        setProvider(data.provider ?? "MERCADO_PAGO");
        setEmailPadrao(data.emailPadrao ?? "");
        setAccessToken("");
        setWebhookSecret("");
    }

    async function carregar() {
        setCarregando(true);
        try {
            aplicar(await pixService.obterConfig(empresaId));
        } catch (err: any) {
            toast.error(`Erro ao carregar configuração. ${err.response?.data || err.message}`);
        } finally {
            setCarregando(false);
        }
    }

    async function onSalvar() {
        if (!config) return;

        const temToken = config.temAccessToken || accessToken.trim() !== "";
        if (ativo && !temToken) {
            toast.warn("Informe o Access Token para ativar o Pix.");
            return;
        }
        if (ativo && !emailPadrao.trim()) {
            toast.warn("Informe um e-mail padrão: o Mercado Pago exige e-mail do pagador.");
            return;
        }

        setSalvando(true);
        try {
            const salvo = await pixService.salvarConfig({
                empresaId,
                ativo,
                provider,
                accessToken: accessToken.trim() || undefined,
                webhookSecret: webhookSecret.trim() || undefined,
                emailPadrao: emailPadrao.trim() || undefined,
                expiracaoMinutos: config.expiracaoMinutos || 30,
                extras: config.extras,
            });
            aplicar(salvo);
            toast.success("Configuração de pagamento salva!");
        } catch (err: any) {
            toast.error(`Erro ao salvar. ${err.response?.data || err.message}`);
        } finally {
            setSalvando(false);
        }
    }

    async function onTestar() {
        if (!config) return;
        if (!config.temAccessToken && accessToken.trim() === "") {
            toast.warn("Informe o Access Token para testar a conexão.");
            return;
        }
        setTestando(true);
        setTeste(null);
        try {
            // Testa o que está digitado (sem salvar); em branco, testa o token já salvo.
            setTeste(await pixService.testarConexao({
                empresaId,
                provider,
                accessToken: accessToken.trim() || undefined,
            }));
        } catch (err: any) {
            toast.error(`Erro ao testar. ${err.response?.data || err.message}`);
        } finally {
            setTestando(false);
        }
    }

    async function copiarWebhook() {
        if (!config?.webhookUrl) return;
        try {
            await navigator.clipboard.writeText(config.webhookUrl);
            toast.success("URL copiada!");
        } catch {
            toast.error("Não foi possível copiar. Selecione e copie manualmente.");
        }
    }

    const providerLabel = PROVEDORES.find((p) => p.value === provider)?.label ?? provider;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>Pagamento no Menu Digital</h1>
                <StatusBadge config={config} />
            </div>

            <div className={styles.infoBox}>
                <FiInfo size={18} />
                <span>
                    Com o Pix online, o cliente paga pelo próprio menu e o dinheiro cai direto na <b>sua conta</b>.
                    O pedido só chega ao PDV depois que o pagamento é confirmado. Pedidos não pagos em{" "}
                    <b>5 minutos</b> são cancelados automaticamente, e o pagamento pode ser estornado se o
                    pedido for cancelado.
                </span>
            </div>

            <div className={styles.card}>
                <div className={styles.cardHeader}>
                    <span className={styles.cardTitle}>Pix online</span>
                    <label className={styles.switch}>
                        <input
                            type="checkbox"
                            checked={ativo}
                            disabled={carregando}
                            onChange={(e) => setAtivo(e.target.checked)}
                        />
                        <span>{ativo ? "Ativo" : "Desativado"}</span>
                    </label>
                </div>

                <div className={styles.cardBody}>
                    {carregando ? (
                        <p className={styles.muted}>Carregando...</p>
                    ) : (
                        <div className={styles.grid}>
                            <div className={styles.field}>
                                <label>Provedor</label>
                                <select value={provider} onChange={(e) => setProvider(e.target.value as PixProvider)}>
                                    {PROVEDORES.map((p) => (
                                        <option key={p.value} value={p.value}>{p.label}</option>
                                    ))}
                                </select>
                                <small>Novos bancos serão adicionados aqui.</small>
                            </div>

                            <div className={styles.field}>
                                <label>E-mail padrão do pagador</label>
                                <input
                                    type="email"
                                    value={emailPadrao}
                                    placeholder="contato@suaempresa.com.br"
                                    onChange={(e) => setEmailPadrao(e.target.value)}
                                />
                                <small>Usado quando o cliente não informa e-mail no pedido.</small>
                            </div>

                            <div className={`${styles.field} ${styles.full}`}>
                                <label>Access Token ({providerLabel})</label>
                                <input
                                    type="password"
                                    autoComplete="new-password"
                                    value={accessToken}
                                    placeholder={
                                        config?.temAccessToken
                                            ? `Salvo (termina em ${config.accessTokenFinal ?? "••••"}). Deixe em branco para manter.`
                                            : "APP_USR-..."
                                    }
                                    onChange={(e) => setAccessToken(e.target.value)}
                                />
                                <small>
                                    No Mercado Pago: <b>Seu negócio → Configurações → Credenciais</b> (use o Access Token
                                    de produção). Ele fica criptografado e nunca é exibido novamente.
                                </small>
                            </div>

                            <div className={`${styles.field} ${styles.full}`}>
                                <label>Assinatura secreta do webhook</label>
                                <input
                                    type="password"
                                    autoComplete="new-password"
                                    value={webhookSecret}
                                    placeholder={
                                        config?.temWebhookSecret
                                            ? "Salva. Deixe em branco para manter."
                                            : "Cole a assinatura secreta do painel"
                                    }
                                    onChange={(e) => setWebhookSecret(e.target.value)}
                                />
                                <small>
                                    Recomendado: valida que a confirmação de pagamento veio mesmo do {providerLabel}.
                                </small>
                            </div>
                        </div>
                    )}
                </div>

                {teste && (
                    <div className={`${styles.resultadoTeste} ${teste.ok ? styles.testeOk : styles.testeErro}`}>
                        {teste.ok ? <FiCheckCircle size={18} /> : <FiXCircle size={18} />}
                        <div>
                            <p>{teste.mensagem}</p>
                            {!teste.ok && teste.detalhe && (
                                <details>
                                    <summary>Detalhes técnicos</summary>
                                    <code>{teste.detalhe}</code>
                                </details>
                            )}
                        </div>
                    </div>
                )}

                <div className={styles.cardFooter}>
                    <CustomButton
                        typeButton="outline-main"
                        loading={testando}
                        disabled={carregando || salvando}
                        onClick={onTestar}
                    >
                        Testar conexão
                    </CustomButton>
                    <CustomButton typeButton="main" loading={salvando} disabled={carregando || testando} onClick={onSalvar}>
                        Salvar
                    </CustomButton>
                </div>
            </div>

            <div className={styles.card}>
                <div className={styles.cardHeader}>
                    <span className={styles.cardTitle}>Configurar o webhook no {providerLabel}</span>
                </div>
                <div className={styles.cardBody}>
                    <ol className={styles.steps}>
                        <li>
                            Acesse o painel <b>Mercado Pago Developers → Suas integrações</b> e abra a sua aplicação.
                        </li>
                        <li>
                            Em <b>Webhooks → Configurar notificações</b>, cole a URL abaixo (modo produção) e marque
                            o evento <b>Pagamentos</b>.
                        </li>
                        <li>
                            Copie a <b>Assinatura secreta</b> gerada e cole no campo acima.
                        </li>
                    </ol>

                    <div className={styles.urlBox}>
                        <input readOnly value={config?.webhookUrl ?? ""} onFocus={(e) => e.target.select()} />
                        <button type="button" onClick={copiarWebhook} disabled={!config?.webhookUrl}>
                            <FiCopy size={14} /> Copiar
                        </button>
                    </div>
                    <small className={styles.muted}>
                        Esta URL é exclusiva da sua empresa. Mesmo sem o webhook o sistema consulta o pagamento
                        enquanto o cliente está na tela do Pix, mas o webhook garante a confirmação se ele fechar o menu.
                    </small>
                </div>
            </div>
        </div>
    );
}

function StatusBadge({ config }: { config: IPixConfiguracao | null }) {
    if (!config || !config.temAccessToken) {
        return (
            <span className={`${styles.badge} ${styles.badgeNeutro}`}>
                <FiAlertCircle size={14} /> Não configurado
            </span>
        );
    }
    if (config.ativo) {
        return (
            <span className={`${styles.badge} ${styles.badgeAtivo}`}>
                <FiCheckCircle size={14} /> Ativo
            </span>
        );
    }
    return (
        <span className={`${styles.badge} ${styles.badgeNeutro}`}>
            <FiAlertCircle size={14} /> Desativado
        </span>
    );
}
