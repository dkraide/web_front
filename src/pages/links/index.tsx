import { useEffect, useState } from 'react';
import styles from './styles.module.scss';
import { api } from '@/services/apiClient';
import IMenuDigitalConfiguracao from '@/interfaces/IMenuDigitalConfiguracao';
import IEmpresa from '@/interfaces/IEmpresa';
import { FaWhatsapp, FaFacebook, FaInstagram, FaSitemap, FaLink, FaHamburger, FaMapMarkerAlt } from 'react-icons/fa';
import { SiIfood, SiUber } from 'react-icons/si';
import { useRouter } from 'next/router';
import Image from 'next/image';
import IMerchantOpenDelivery from '@/interfaces/IMerchantOpenDelivery';

type LinksProps = {
    emp?: string;
};

export default function Links({ emp }: LinksProps) {
    const [configuracao, setConfiguracao] = useState<IMerchantOpenDelivery>();
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        if (!router.isReady) return;
        const empresaId = emp || (router.query.empresa as string);
        if (!empresaId) return;
        loadData(empresaId);
    }, [router.isReady, emp, router.query.empresa]);

    async function loadData(empresaId: string) {
        try {
            const { data } = await api.get(
               `/opendelivery/merchant?empresaId=${empresaId}`
            );
            console.log(data);
            setConfiguracao(data);
        } catch (err) {
            console.log(err);
        } finally {
            setLoading(false);
        }
    }

    if (loading || !configuracao)
        return <div className={styles.loading}>Carregando...</div>;

    const links = [
        {
            url: `https://menu.krdsystem.com/?empresa=${configuracao.empresaId}`,
            label: 'Meu Cardápio',
            icon: <FaHamburger />,
            color: '#d32525ff',
        },
        {
            url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                `${configuracao.street}, ${configuracao.number} - ${configuracao.district} ${configuracao.city}, ${configuracao.state}`
            )}`,
            label: 'Endereço',
            icon: <FaMapMarkerAlt />,
            color: '#4285F4', // azul Google Maps
        },
        {
            url: configuracao.whatsappNumber ? `https://wa.me/${configuracao.whatsappNumber}` : null,
            label: 'WhatsApp',
            icon: <FaWhatsapp />,
            color: '#25D366',
        },
        {
            url: configuracao.facebook,
            label: 'Facebook',
            icon: <FaFacebook />,
            color: '#1877F2',
        },
        {
            url: configuracao.instagram,
            label: 'Instagram',
            icon: <FaInstagram />,
            color: '#E1306C',
        },
        {
            url: configuracao.urlIFood,
            label: 'iFood',
            icon: <SiIfood />,
            color: '#FA1923',
        },
        {
            url: configuracao.urlGoomer,
            label: 'Goomer',
            icon: <FaInstagram />,
            color: '#FF4500',
        },
        {
            url: configuracao.urlUberEats,
            label: 'Uber Eats',
            icon: <SiUber />,
            color: '#5FB300',
        },
        {
            url: configuracao.url99,
            label: '99Food',
            icon: <FaInstagram />,
            color: '#FFCC00',
        },
    ].filter(link => !!link.url);

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <div
                    className={styles.backgroundImg}
                    style={{ backgroundImage: `url(${configuracao.bannerUrl})` }}
                >
                    <div className={styles.headerContent}>
                        {configuracao.logoUrl && (
                            <Image
                                src={configuracao.logoUrl}
                                alt="Logo Empresa"
                                width={120}
                                height={120}
                                className={styles.logo}
                            />
                        )}
                        <h1>{configuracao.name}</h1>
                        <hr />
                    </div>
                </div>
            </div>

            {/* Links tipo Linktree */}
            <div className={styles.links}>
                {links.map((link, index) => (
                    <a
                        key={index}
                        href={link.url as string}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.button}
                        style={{ backgroundColor: link.color }}
                    >
                        {link.label}
                        <span className={styles.icon}>{link.icon}</span>
                    </a>
                ))}
            </div>
            {/* Footer fixo */}
            <div className={styles.footer}>
                <p>Quer uma página como esta para sua empresa?</p>
                <div className={styles.links}>
                    <a
                        key={0}
                        href={`https://krdsystem.com`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.button}
                        style={{ backgroundColor: '#1877F2' }}
                    >
                        Visitar nosso Site
                        <span className={styles.icon}>{<FaLink />}</span>
                    </a>
                    <a
                        key={1}
                        href={`https://wa.me/5519971037836`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.button}
                        style={{ backgroundColor: '#25D366' }}
                    >
                        WhatsApp
                        <span className={styles.icon}>{<FaWhatsapp />}</span>
                    </a>
                </div>
                <p className={styles.copy}>© KRD System</p>
            </div>
        </div>
    );
}
