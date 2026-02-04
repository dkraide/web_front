import { useRouter } from 'next/router';
import Image from 'next/image';
import { useState } from 'react';
import styles from './styles.module.scss';

export default function KeetaAuthorizationPage() {
    const router = useRouter();
    const { authId } = router.query;
    const [copiado, setCopiado] = useState(false);

    const copiarCodigo = async () => {
        if (!authId) return;

        await navigator.clipboard.writeText(authId.toString());
        setCopiado(true);

        setTimeout(() => setCopiado(false), 2000);
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

                {authId ? (
                    <>
                        <p className={styles.instruction}>
                            Copie o código abaixo e cole na tela do sistema PDV:
                        </p>

                        <div className={styles.authWrapper}>
                            <div className={styles.authBox}>
                                {authId}
                            </div>

                            <button
                                className={styles.copyButton}
                                onClick={copiarCodigo}
                                title="Copiar código"
                            >
                                {/* Ícone copiar */}
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                </svg>
                            </button>
                        </div>

                        {copiado && (
                            <span className={styles.copied}>✔ Código copiado</span>
                        )}

                        <p className={styles.hint}>
                            ⚠️ Este código é obrigatório para finalizar a integração.
                        </p>
                    </>
                ) : (
                    <p>Não foi possível localizar o código de autorização.</p>
                )}
            </div>
        </div>
    );
}
