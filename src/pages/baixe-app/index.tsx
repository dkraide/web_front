import { QRCodeSVG } from 'qrcode.react';
import { FaApple, FaGooglePlay } from 'react-icons/fa';
import styles from './styles.module.scss';

const APP_STORE_URL =
    'https://apps.apple.com/br/app/krd-system-lojas/id6797965207';
const PLAY_STORE_URL =
    'https://play.google.com/store/apps/details?id=com.krdmobile';

export default function BaixeApp() {
    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>Baixe o App KRD System</h1>
                <p>Aponte a câmera do seu celular para o QR Code da loja desejada.</p>
            </div>

            <div className={styles.cards}>
                <div className={styles.card}>
                    <h2>
                        <FaApple className={styles.icon} />
                        App Store
                    </h2>
                    <div className={styles.qr}>
                        <QRCodeSVG value={APP_STORE_URL} size={200} />
                    </div>
                    <a
                        href={APP_STORE_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.button}
                        style={{ backgroundColor: '#000000' }}
                    >
                        <FaApple className={styles.buttonIcon} />
                        Baixar na App Store
                    </a>
                </div>

                <div className={styles.card}>
                    <h2>
                        <FaGooglePlay className={styles.icon} />
                        Google Play
                    </h2>
                    <div className={styles.qr}>
                        <QRCodeSVG value={PLAY_STORE_URL} size={200} />
                    </div>
                    <a
                        href={PLAY_STORE_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.button}
                        style={{ backgroundColor: '#01875f' }}
                    >
                        <FaGooglePlay className={styles.buttonIcon} />
                        Baixar no Google Play
                    </a>
                </div>
            </div>

            <div className={styles.footer}>
                <p className={styles.copy}>© KRD System</p>
            </div>
        </div>
    );
}
