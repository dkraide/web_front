import { useRouter } from 'next/router';
import Image from 'next/image';
import { useState } from 'react';
import styles from './styles.module.scss';

export default function KeetaAuthorizationPage() {
    const router = useRouter();
    const { code, keetaMerchantId } = router.query;

    const [copiado, setCopiado] = useState<string | null>(null);

    const copiarTexto = async (texto: string, tipo: string) => {
        if (!texto) return;

        await navigator.clipboard.writeText(texto);
        setCopiado(tipo);

        setTimeout(() => setCopiado(null), 2000);
    };

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                {/* Logo */}
                <div className={styles.logo}>
                    <Image
                        src="/logo.png"
                        alt="Logo"
                        width={160}
                        height={60}
                        priority
                    />
                </div>

                <h1>✅ Sucesso!</h1>

                <p>
                    Nosso sistema foi vinculado com sucesso ao <strong>Keeta</strong>.
                    <br />
                    Agora você já pode receber pedidos normalmente 🎉
                </p>

                {(code && keetaMerchantId) ? (
                    <>
                        <p className={styles.instruction}>
                            Copie os dados abaixo e cole na tela do sistema PDV:
                        </p>

                        {/* Código de autorização */}
                        <div className={styles.authWrapper}>
                            <label>Código de autorização</label>

                            <div className={styles.authBox}>
                                {code}
                            </div>

                            <button
                                className={styles.copyButton}
                                onClick={() => copiarTexto(code.toString(), 'code')}
                                title="Copiar código de autorização"
                            >
                                📋
                            </button>
                        </div>

                        {copiado === 'code' && (
                            <span className={styles.copied}>✔ Código de autorização copiado</span>
                        )}

                        {/* ID Loja Keeta */}
                        <div className={styles.authWrapper}>
                            <label>ID Loja Keeta</label>

                            <div className={styles.authBox}>
                                {keetaMerchantId}
                            </div>

                            <button
                                className={styles.copyButton}
                                onClick={() => copiarTexto(keetaMerchantId.toString(), 'merchant')}
                                title="Copiar ID da loja"
                            >
                                📋
                            </button>
                        </div>

                        {copiado === 'merchant' && (
                            <span className={styles.copied}>✔ ID da loja copiado</span>
                        )}

                        <p className={styles.hint}>
                            ⚠️ Esses dados são obrigatórios para finalizar a integração.
                        </p>
                    </>
                ) : (
                    <p>Não foi possível localizar os dados de autorização.</p>
                )}
            </div>
        </div>
    );
}
