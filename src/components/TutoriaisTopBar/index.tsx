import Link from 'next/link';
import { FaHome, FaUser } from 'react-icons/fa';
import styles from './styles.module.scss';

// Barra própria das páginas de tutoriais (públicas, independentes do menu do sistema).
export default function TutoriaisTopBar() {
    return (
        <header className={styles.bar}>
            <Link href="/tutoriais" className={styles.titulo}>KRD System · Tutoriais</Link>
            <nav>
                <Link href="/" className={styles.btn}><FaHome /> Início</Link>
                <Link href="/login" className={`${styles.btn} ${styles.primario}`}><FaUser /> Área do cliente</Link>
            </nav>
        </header>
    );
}
