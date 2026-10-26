import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FaPlayCircle, FaRegFileAlt, FaArrowLeft } from 'react-icons/fa';
import TutoriaisTopBar from '@/components/TutoriaisTopBar';
import {
    Tutorial, TutorialResumo, listarTutoriais, nomeSistema, obterTutorial, urlEmbedYoutube,
} from '@/services/tutorialService';
import styles from './styles.module.scss';

// Página PÚBLICA de um tutorial. O HTML do corpo é sanitizado no servidor ao salvar.
export default function TutorialPagina() {
    const router = useRouter();
    const [tutorial, setTutorial] = useState<Tutorial | null>(null);
    const [outros, setOutros] = useState<TutorialResumo[]>([]);
    const [erro, setErro] = useState('');

    useEffect(() => {
        if (!router.isReady) return;
        const slug = String(router.query.slug);
        setTutorial(null);
        setErro('');
        obterTutorial(slug)
            .then((t) => {
                setTutorial(t);
                return listarTutoriais().then((todos) =>
                    setOutros(todos.filter((x) => x.sistema === t.sistema && x.modulo === t.modulo)));
            })
            .catch((e) => setErro(e.message));
    }, [router.isReady, router.query.slug]);

    const embed = urlEmbedYoutube(tutorial?.urlVideo ?? null);

    return (
        <>
            <Head>
                <title>{tutorial ? `${tutorial.titulo} — Tutoriais KRD System` : 'Tutorial — KRD System'}</title>
                {tutorial?.resumo && <meta name="description" content={tutorial.resumo} />}
                <meta name="viewport" content="width=device-width, initial-scale=1" />
            </Head>
            <TutoriaisTopBar />
            <div className={styles.container}>
                <div className={styles.content}>
                    {erro && (
                        <p className={styles.vazio}>
                            {erro} <Link href="/tutoriais" style={{ color: '#9db4ff' }}>Voltar aos tutoriais</Link>
                        </p>
                    )}
                    {!tutorial && !erro && <p className={styles.vazio}>Carregando…</p>}

                    {tutorial && (
                        <>
                            <div className={styles.crumbs}>
                                <Link href="/tutoriais" className={styles.voltar}><FaArrowLeft /> Voltar</Link>
                                <span>
                                    <Link href="/tutoriais">Tutoriais</Link> › {nomeSistema(tutorial.sistema)} › {tutorial.modulo}
                                </span>
                            </div>
                            <div className={styles.detalhe}>
                                <article className={styles.artigo}>
                                    <h1>{tutorial.titulo}</h1>
                                    {tutorial.resumo && <p className={styles.resumo}>{tutorial.resumo}</p>}
                                    {embed && (
                                        <div className={styles.video}>
                                            <iframe
                                                src={embed}
                                                title={tutorial.titulo}
                                                allow="accelerometer; clipboard-write; encrypted-media; picture-in-picture"
                                                allowFullScreen
                                            />
                                        </div>
                                    )}
                                    {tutorial.corpo && (
                                        <div className={styles.corpo} dangerouslySetInnerHTML={{ __html: tutorial.corpo }} />
                                    )}
                                </article>

                                {outros.length > 1 && (
                                    <aside className={styles.lateral}>
                                        <h3>Mais em {tutorial.modulo}</h3>
                                        <ul className={styles.lista}>
                                            {outros.map((t) => (
                                                <li key={t.id}>
                                                    <Link href={`/tutoriais/${t.slug}`} className={`${styles.item} ${t.id === tutorial.id ? styles.atual : ''}`}>
                                                        <strong>{t.temVideo ? <FaPlayCircle /> : <FaRegFileAlt />}{t.titulo}</strong>
                                                    </Link>
                                                </li>
                                            ))}
                                        </ul>
                                    </aside>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </>
    );
}
