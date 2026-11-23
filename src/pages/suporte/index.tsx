import { useEffect, useState } from 'react';
import Image from 'next/image';
import Script from 'next/script';
import { parseCookies } from 'nookies';
import { useRouter } from 'next/navigation';
import styles from '../acessoRemoto/styles.module.scss';

// Chat de suporte (widget Chatwoot). Página pública: funciona sem login e sem o PDV.
// Se houver sessão no navegador, identifica o contato (empresa/usuário) para o suporte não precisar perguntar.
const CHATWOOT_URL = (process.env.NEXT_PUBLIC_CHATWOOT_URL || '').replace(/\/$/, '');
const CHATWOOT_TOKEN = process.env.NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN || '';

declare global {
    interface Window {
        chatwootSDK?: any;
        $chatwoot?: any;
        chatwootSettings?: any;
    }
}

export default function Suporte() {
    const router = useRouter();
    const [erro, setErro] = useState('');

    useEffect(() => {
        window.chatwootSettings = { position: 'right', type: 'expanded_bubble', launcherTitle: 'Falar com o suporte', locale: 'pt_BR' };

        const aoPronto = () => {
            try {
                const cookies = parseCookies();
                const user = cookies['@web_front.user'] ? JSON.parse(cookies['@web_front.user']) : null;
                if (user && window.$chatwoot) {
                    window.$chatwoot.setUser(`empresa-${user.empresaSelecionada}-${user.userName || user.nome}`, {
                        name: user.nome,
                        email: user.email,
                        phone_number: user.telefone,
                    });
                    window.$chatwoot.setCustomAttributes({ empresaId: user.empresaSelecionada, usuario: user.userName });
                }
                window.$chatwoot?.toggle('open');
            } catch (e) {
                console.error('Erro ao identificar contato no chat', e);
            }
        };
        window.addEventListener('chatwoot:ready', aoPronto);
        return () => window.removeEventListener('chatwoot:ready', aoPronto);
    }, []);

    if (!CHATWOOT_URL || !CHATWOOT_TOKEN) {
        return <div className={styles.container}><div className={styles.card}><h1>Suporte</h1><p>Chat não configurado.</p></div></div>;
    }

    return (
        <div className={styles.container}>
            <Script
                src={`${CHATWOOT_URL}/packs/js/sdk.js`}
                strategy="afterInteractive"
                onLoad={() => window.chatwootSDK?.run({ websiteToken: CHATWOOT_TOKEN, baseUrl: CHATWOOT_URL })}
                onError={() => setErro('Não foi possível carregar o chat. Verifique sua internet.')}
            />
            <div className={styles.card}>
                <div className={styles.logoBox} onClick={() => router.push('/')}>
                    <Image src="/krd_logo.png" alt="KRD Logo" width={350} height={120} className={styles.logo} priority />
                </div>
                <h1>Suporte KRD</h1>
                <p>Use o chat no canto da tela para falar com nossa equipe.</p>
                {erro && <p style={{ color: '#f87171' }}>{erro}</p>}
            </div>
        </div>
    );
}
