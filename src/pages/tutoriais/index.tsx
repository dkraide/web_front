import { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { FaPlayCircle, FaRegFileAlt, FaSearch } from 'react-icons/fa';
import TutoriaisTopBar from '@/components/TutoriaisTopBar';
import { TutorialResumo, listarTutoriais, nomeSistema, normalizar } from '@/services/tutorialService';
import styles from './styles.module.scss';

// Página PÚBLICA (sem login): central de tutoriais por sistema e módulo, com busca.
export default function Tutoriais() {
    const [itens, setItens] = useState<TutorialResumo[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState('');
    const [busca, setBusca] = useState('');
    const [sistema, setSistema] = useState('');

    useEffect(() => {
        listarTutoriais()
            .then(setItens)
            .catch((e) => setErro(e.message))
            .finally(() => setCarregando(false));
    }, []);

    const sistemas = useMemo(() => {
        const contagem = new Map<string, number>();
        itens.forEach((t) => contagem.set(t.sistema, (contagem.get(t.sistema) ?? 0) + 1));
        return [...contagem.entries()].sort((a, b) => nomeSistema(a[0]).localeCompare(nomeSistema(b[0])));
    }, [itens]);

    const filtrados = useMemo(() => {
        const q = normalizar(busca.trim());
        return itens.filter(
            (t) =>
                (!sistema || t.sistema === sistema) &&
                (!q || normalizar(`${t.titulo} ${t.resumo ?? ''} ${t.modulo} ${nomeSistema(t.sistema)}`).includes(q)),
        );
    }, [itens, busca, sistema]);

    // sistema -> módulo -> tutoriais (a API já devolve ordenado por sistema, módulo e ordem)
    const grupos = useMemo(() => {
        const mapa = new Map<string, Map<string, TutorialResumo[]>>();
        filtrados.forEach((t) => {
            if (!mapa.has(t.sistema)) mapa.set(t.sistema, new Map());
            const mods = mapa.get(t.sistema)!;
            if (!mods.has(t.modulo)) mods.set(t.modulo, []);
            mods.get(t.modulo)!.push(t);
        });
        return [...mapa.entries()].sort((a, b) => nomeSistema(a[0]).localeCompare(nomeSistema(b[0])));
    }, [filtrados]);

    return (
        <>
            <Head>
                <title>Tutoriais — KRD System</title>
                <meta name="description" content="Aprenda a usar o KRD System com tutoriais em vídeo e passo a passo, organizados por sistema e módulo." />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
            </Head>
            <TutoriaisTopBar />
            <div className={styles.container}>
                <div className={styles.content}>
                    <div className={styles.hero}>
                        <h1>Central de Tutoriais</h1>
                        <p>Vídeos e passo a passo para você tirar o máximo do sistema.</p>
                        <div className={styles.search}>
                            <FaSearch />
                            <input
                                type="search"
                                placeholder="Buscar tutorial (ex.: comanda, nota de entrada, PIX)"
                                value={busca}
                                onChange={(e) => setBusca(e.target.value)}
                                aria-label="Buscar tutorial"
                            />
                        </div>
                    </div>

                    {sistemas.length > 1 && (
                        <div className={styles.chips}>
                            <button className={`${styles.chip} ${!sistema ? styles.chipAtivo : ''}`} onClick={() => setSistema('')}>
                                Todos<small>{itens.length}</small>
                            </button>
                            {sistemas.map(([s, n]) => (
                                <button key={s} className={`${styles.chip} ${sistema === s ? styles.chipAtivo : ''}`} onClick={() => setSistema(s)}>
                                    {nomeSistema(s)}<small>{n}</small>
                                </button>
                            ))}
                        </div>
                    )}

                    {carregando && <p className={styles.vazio}>Carregando…</p>}
                    {erro && <p className={styles.vazio}>{erro}</p>}
                    {!carregando && !erro && filtrados.length === 0 && (
                        <p className={styles.vazio}>
                            {itens.length === 0 ? 'Ainda não há tutoriais publicados.' : 'Nenhum tutorial encontrado para essa busca.'}
                        </p>
                    )}

                    {grupos.map(([sis, modulos]) => (
                        <section key={sis} className={styles.sistema}>
                            <h2>{nomeSistema(sis)}</h2>
                            <div className={styles.modulos}>
                                {[...modulos.entries()].map(([mod, tuts]) => (
                                    <div key={mod} className={styles.modulo}>
                                        <h3>{mod}</h3>
                                        <ul className={styles.lista}>
                                            {tuts.map((t) => (
                                                <li key={t.id}>
                                                    <Link href={`/tutoriais/${t.slug}`} className={styles.item}>
                                                        <strong>{t.temVideo ? <FaPlayCircle /> : <FaRegFileAlt />}{t.titulo}</strong>
                                                        {t.resumo && <span>{t.resumo}</span>}
                                                    </Link>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        </section>
                    ))}
                </div>
            </div>
        </>
    );
}
