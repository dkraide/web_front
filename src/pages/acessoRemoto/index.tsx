import { useEffect } from 'react';
import Image from 'next/image';
import { api } from '@/services/apiClient';
import styles from './styles.module.scss';
import { FiDownloadCloud } from "react-icons/fi";
import { useRouter } from 'next/navigation';

export default function AcessoRemoto() {
    const router = useRouter();

  const iniciarDownload = async () => {
    try {
        const response = await api.get(`/v2/pdvlite/downloadrustdesk`, {
            responseType: 'blob'
        });

        let filename = 'download.exe'; // fallback
        const disposition = response.headers['content-disposition'] || response.headers['Content-Disposition'];
        if (disposition) {
            // Extrair o filename normal ou o filename_ UTF-8
            const filenameMatch = disposition.match(/filename\*?=['"]?(?:UTF-8'')?([^;'"]+)/i);
            if (filenameMatch && filenameMatch[1]) {
                // Substituir caracteres problemáticos do Windows
                filename = filenameMatch[1].replace(/[/\\?%*:|"<>]/g, '_');
            }
        }

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
    } catch (error) {
        console.error("Erro ao baixar arquivo:", error);
    }
};





    useEffect(() => {
        iniciarDownload();
    }, []);

    return (
        <div className={styles.container}>
            <div className={styles.card}>

                {/* LOGO */}
                <div className={styles.logoBox} onClick={() => router.push('/')}>
                    <Image
                        src="/krd_logo.png"
                        alt="KRD Logo"
                        width={350}
                        height={120}
                        className={styles.logo}
                        priority
                    />
                </div>

                <FiDownloadCloud className={styles.icon} />

                <h1>Acesso Remoto</h1>
                <p>Seu download deve começar automaticamente.</p>
                <p>Se não iniciar, clique no botão abaixo:</p>

                <button onClick={iniciarDownload}>
                    Baixar manualmente
                </button>
            </div>
        </div>
    );
}
