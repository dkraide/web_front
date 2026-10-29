import { useEffect } from 'react'
import Head from 'next/head'
import { FaWhatsapp } from 'react-icons/fa'
import { SiIfood } from 'react-icons/si'
import { NOVIDADES, marcarNovidadesVistas } from '@/data/novidades'
import styles from './styles.module.scss'

export default function Novidades() {
    useEffect(() => { marcarNovidadesVistas() }, [])

    return (
        <>
            <Head><title>Novidades</title></Head>
            <div className={styles.container}>
                <div className={styles.header}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/novidades/andylar-logo.png" alt="Andylar" className={styles.logo} />
                    <div>
                        <h1>Novidades</h1>
                        <p>Atualizações, integrações e recursos novos do sistema.</p>
                    </div>
                </div>

                <div className={styles.lista}>
                    {NOVIDADES.map((n) => (
                        <article key={n.id} className={styles.card}>
                            {(n.imagem || n.icone) && (
                                <div className={styles.imagemWrap}>
                                    {n.imagem && (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={n.imagem} alt={n.titulo} />
                                    )}
                                    {n.icone === 'ifood' && <SiIfood className={styles.iconeIfood} />}
                                </div>
                            )}
                            <div className={styles.corpo}>
                                <div className={styles.meta}>
                                    <span className={styles.tag}>{n.tag}</span>
                                    <span className={styles.data}>{n.data}</span>
                                </div>
                                <h2>{n.titulo}</h2>
                                <p>{n.descricao}</p>
                                {n.botao && (
                                    <a className={styles.botao} href={n.botao.url} target="_blank" rel="noreferrer">
                                        <FaWhatsapp /> {n.botao.texto}
                                    </a>
                                )}
                            </div>
                        </article>
                    ))}
                </div>
            </div>
        </>
    )
}
