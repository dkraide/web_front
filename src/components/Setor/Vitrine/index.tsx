import { useState } from 'react'
import { MapPin, Phone, Instagram, MessageCircle, Play } from 'lucide-react'
import styles from './vitrine.module.scss'
import { ISetorPublico } from '@/interfaces/ISetorPublico'
import { StoryViewer } from './StoryViewer'
import { brl, capaDoProduto, slidesDoProduto } from './media'

// Pagina publica do setor (aberta pela tag NFC): cabecalho da loja + grid de produtos.
export default function Vitrine({ setor }: { setor: ISetorPublico }) {
    const [aberto, setAberto] = useState<number | null>(null)
    const { loja } = setor
    const instagram = loja.instagram?.replace(/^@/, '')
    const whats = loja.whatsapp?.replace(/\D/g, '')

    return (
        <div className={styles.page}>
            <div className={styles.container}>
                {/* ── Cabecalho da loja ── */}
                <header>
                    <div className={styles.banner}>
                        {loja.bannerUrl && <img src={loja.bannerUrl} alt={`Banner ${loja.nome}`} />}
                        <div className={styles.bannerShade} />
                    </div>
                    <div className={styles.lojaCard}>
                        <div className={styles.logo}>
                            {loja.logoUrl ? <img src={loja.logoUrl} alt={`Logo ${loja.nome}`} /> : <span>{loja.nome?.charAt(0)}</span>}
                        </div>
                        <h1 className={styles.lojaNome}>{loja.nome}</h1>
                        {loja.descricao && <p className={styles.lojaDescricao}>{loja.descricao}</p>}
                        <div className={styles.contatos}>
                            {loja.endereco && (
                                <span>
                                    <MapPin size={14} /> {loja.endereco}
                                </span>
                            )}
                            {loja.telefone && (
                                <a href={`tel:${loja.telefone.replace(/\D/g, '')}`}>
                                    <Phone size={14} /> {loja.telefone}
                                </a>
                            )}
                            {whats && (
                                <a href={`https://wa.me/${whats.startsWith('55') ? whats : `55${whats}`}`} target="_blank" rel="noreferrer">
                                    <MessageCircle size={14} /> WhatsApp
                                </a>
                            )}
                            {instagram && (
                                <a href={`https://instagram.com/${instagram}`} target="_blank" rel="noreferrer">
                                    <Instagram size={14} /> @{instagram}
                                </a>
                            )}
                        </div>
                    </div>
                </header>

                {/* ── Titulo do setor ── */}
                <div className={styles.setorTitulo}>
                    <h2>{setor.nome}</h2>
                    {setor.descricao && <p>{setor.descricao}</p>}
                </div>

                {setor.produtos.length === 0 && <p className={styles.vazio}>Nenhum produto neste setor.</p>}

                {/* ── Grid: 2 colunas, cada card com 50% da largura e o dobro de altura (1:2) ── */}
                <div className={styles.grid}>
                    {setor.produtos.map((p, i) => {
                        const capa = capaDoProduto(p)
                        const total = slidesDoProduto(p).length
                        return (
                            <button key={p.produtoId} type="button" className={styles.card} onClick={() => setAberto(i)}>
                                {capa?.tipo === 'VIDEO' ? (
                                    <video src={capa.url} muted playsInline preload="metadata" />
                                ) : capa ? (
                                    <img src={capa.url} alt={p.nome} loading="lazy" />
                                ) : (
                                    <div className={styles.semFoto} />
                                )}
                                {total > 1 && (
                                    <span className={styles.contador}>
                                        {slidesDoProduto(p).some(s => s.tipo === 'VIDEO') && <Play size={11} />}
                                        {total}
                                    </span>
                                )}
                                <div className={styles.cardInfo}>
                                    <p className={styles.cardNome}>{p.nome}</p>
                                    <p className={styles.cardValor}>{brl(p.valor)}</p>
                                </div>
                            </button>
                        )
                    })}
                </div>
            </div>

            {aberto !== null && <StoryViewer produtos={setor.produtos} inicial={aberto} onClose={() => setAberto(null)} />}
        </div>
    )
}
