import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronUp, ChevronLeft, ChevronRight, X } from 'lucide-react'
import styles from './story.module.scss'
import { ISetorProdutoView } from '@/interfaces/ISetorPublico'
import { brl, slidesDoProduto } from './media'

interface Props {
    produtos: ISetorProdutoView[]
    inicial: number
    onClose?: () => void
    /** Dentro de um quadro (previa no admin): nao cobre a tela, nao trava o scroll. */
    embedded?: boolean
}

const INFO_RATIO = 0.42 // altura do painel de informacoes, em fracao da tela
const SWIPE_PX = 50 // arrasto minimo para trocar de midia
const AXIS_LOCK_PX = 8 // movimento minimo para decidir se o gesto e horizontal ou vertical

/**
 * Viewer em estilo "stories": carrossel de produtos (setas) com um carrossel de
 * midias dentro de cada produto (arrastar para os lados / tocar nas bordas).
 * Arrastar para cima revela nome, valor e descricao do produto.
 */
export function StoryViewer({ produtos, inicial, onClose, embedded }: Props) {
    const [p, setP] = useState(inicial) // produto atual
    const [m, setM] = useState(0) // midia atual do produto atual
    const [dx, setDx] = useState(0) // arrasto horizontal em andamento (px)
    const [offset, setOffset] = useState(0) // quanto a midia foi levantada (px)
    const [infoAberta, setInfoAberta] = useState(false)
    const [arrastando, setArrastando] = useState(false)
    const [viuDica, setViuDica] = useState(false)

    const boxRef = useRef<HTMLDivElement>(null)
    const gesto = useRef<{ x: number; y: number; eixo: 'x' | 'y' | null } | null>(null)

    const maxOffset = () => (boxRef.current?.clientHeight ?? 600) * INFO_RATIO

    // A previa do admin troca o produto selecionado de fora.
    useEffect(() => {
        setP(inicial)
        setM(0)
        setDx(0)
        setOffset(0)
        setInfoAberta(false)
    }, [inicial])

    const produto = produtos[Math.min(p, produtos.length - 1)]
    const slides = produto ? slidesDoProduto(produto) : []
    const ultimaMidia = Math.max(0, slides.length - 1)

    const irProduto = useCallback(
        (novo: number) => {
            if (novo < 0 || novo >= produtos.length) return
            setP(novo)
            setM(0)
            setDx(0)
            setOffset(0)
            setInfoAberta(false)
        },
        [produtos.length]
    )

    const irMidia = useCallback((novo: number) => setM(Math.min(Math.max(novo, 0), ultimaMidia)), [ultimaMidia])

    // trava o scroll da pagina por tras e atende o teclado (so em tela cheia)
    useEffect(() => {
        if (embedded) return
        const anterior = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose?.()
            if (e.key === 'ArrowRight') irProduto(p + 1)
            if (e.key === 'ArrowLeft') irProduto(p - 1)
        }
        window.addEventListener('keydown', onKey)
        return () => {
            document.body.style.overflow = anterior
            window.removeEventListener('keydown', onKey)
        }
    }, [embedded, p, irProduto, onClose])

    if (!produto) return null

    // ── gestos na area das midias ────────────────────────────────
    const onPointerDown = (e: React.PointerEvent) => {
        e.currentTarget.setPointerCapture(e.pointerId)
        gesto.current = { x: e.clientX, y: e.clientY, eixo: null }
        setArrastando(true)
    }

    const onPointerMove = (e: React.PointerEvent) => {
        const g = gesto.current
        if (!g) return
        const ddx = e.clientX - g.x
        const ddy = e.clientY - g.y

        if (!g.eixo && Math.max(Math.abs(ddx), Math.abs(ddy)) > AXIS_LOCK_PX) {
            g.eixo = Math.abs(ddx) > Math.abs(ddy) ? 'x' : 'y'
        }

        if (g.eixo === 'x') {
            // resistencia nas pontas (primeira/ultima midia)
            const naPonta = (m === 0 && ddx > 0) || (m === ultimaMidia && ddx < 0)
            setDx(naPonta ? ddx * 0.3 : ddx)
        } else if (g.eixo === 'y') {
            const max = maxOffset()
            const base = infoAberta ? max : 0
            setOffset(Math.min(Math.max(base - ddy, 0), max))
        }
    }

    const onPointerUp = (e: React.PointerEvent) => {
        const g = gesto.current
        gesto.current = null
        setArrastando(false)
        if (!g) return

        if (!g.eixo) {
            // toque: bordas navegam entre midias; meio fecha o painel de informacoes
            const rect = boxRef.current?.getBoundingClientRect()
            const rel = (e.clientX - (rect?.left ?? 0)) / (rect?.width || 1)
            if (infoAberta) {
                setInfoAberta(false)
                setOffset(0)
            } else if (rel < 0.33) irMidia(m - 1)
            else if (rel > 0.66) irMidia(m + 1)
            return
        }

        if (g.eixo === 'x') {
            if (dx <= -SWIPE_PX) irMidia(m + 1)
            else if (dx >= SWIPE_PX) irMidia(m - 1)
            setDx(0)
        } else {
            const abrir = offset > maxOffset() * 0.3
            setInfoAberta(abrir)
            setOffset(abrir ? maxOffset() : 0)
            if (abrir) setViuDica(true)
        }
    }

    // 0 = painel fechado, 1 = aberto: a legenda some conforme o painel sobe
    const progresso = Math.min(1, offset / maxOffset())
    const animar = arrastando ? 'none' : 'transform 300ms cubic-bezier(.2,.8,.2,1)'

    return (
        <div className={`${styles.root} ${embedded ? styles.embedded : ''}`}>
            <div ref={boxRef} className={styles.box}>
                {/* ── Painel de informacoes (revelado ao arrastar para cima) ── */}
                <div className={styles.info} style={{ height: `${INFO_RATIO * 100}%` }}>
                    <span className={styles.puxador} />
                    <p className={styles.infoContador}>
                        Produto {p + 1} de {produtos.length}
                    </p>
                    <h2 className={styles.infoNome}>{produto.nome}</h2>
                    <span className={styles.preco}>{brl(produto.valor)}</span>
                    <p className={styles.infoRotulo}>Descrição</p>
                    <div className={styles.infoDescricao}>{produto.descricao || 'Sem descrição.'}</div>
                </div>

                {/* ── Camada das midias: sobe para revelar o painel ── */}
                <div
                    className={styles.stage}
                    style={{
                        transform: `translateY(${-offset}px)`,
                        transition: animar,
                        borderRadius: offset > 0 ? '0 0 20px 20px' : 0,
                    }}
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                    onPointerCancel={onPointerUp}
                >
                    {/* Carrossel externo: produtos (anterior / atual / proximo) */}
                    {[p - 1, p, p + 1].map(i => {
                        const prod = produtos[i]
                        if (!prod) return null
                        const ativo = i === p
                        const s = slidesDoProduto(prod)
                        const n = Math.max(s.length, 1)
                        return (
                            <div
                                key={prod.produtoId}
                                className={styles.produtoSlide}
                                style={{ transform: `translateX(${(i - p) * 100}%)` }}
                            >
                                {/* Carrossel interno: midias do produto */}
                                <div
                                    className={styles.midiasTrack}
                                    style={{
                                        width: `${n * 100}%`,
                                        transform: `translateX(calc(${(-(ativo ? m : 0) * 100) / n}% + ${ativo ? dx : 0}px))`,
                                        transition: animar,
                                    }}
                                >
                                    {s.length === 0 && <div className={`${styles.midia} ${styles.semMidia}`} />}
                                    {s.map((slide, k) => (
                                        <div key={k} className={styles.midia}>
                                            {slide.tipo === 'VIDEO' ? (
                                                ativo && k === m ? (
                                                    <video src={slide.url} autoPlay muted loop playsInline draggable={false} />
                                                ) : null
                                            ) : (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={slide.url} alt={prod.nome} draggable={false} />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    })}

                    {/* Barras de progresso (uma por midia) */}
                    {slides.length > 1 && (
                        <div className={styles.progresso}>
                            {slides.map((_, k) => (
                                <div key={k} className={styles.barra}>
                                    <div className={`${styles.barraFill} ${k <= m ? styles.cheia : ''}`} />
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Sombra no topo (legibilidade das barras de progresso) */}
                    <div className={styles.sombraTopo} />

                    {/* Legenda: nome + valor sempre visiveis; esmaece quando o painel abre */}
                    <div className={styles.legenda} style={{ opacity: 1 - progresso }}>
                        <h3 className={styles.legendaNome}>{produto.nome}</h3>
                        <span className={styles.preco}>{brl(produto.valor)}</span>
                        <div className={styles.deslize}>
                            <ChevronUp size={18} />
                            <span>{viuDica ? 'Ver detalhes' : 'Deslize para cima para ver o produto completo'}</span>
                        </div>
                    </div>
                </div>

                {/* ── Controles fixos ── */}
                {onClose && (
                    <button type="button" onClick={onClose} aria-label="Fechar" className={styles.fechar}>
                        <X size={20} />
                    </button>
                )}
                {p > 0 && (
                    <button type="button" onClick={() => irProduto(p - 1)} aria-label="Produto anterior" className={`${styles.seta} ${styles.esq}`}>
                        <ChevronLeft size={24} />
                    </button>
                )}
                {p < produtos.length - 1 && (
                    <button type="button" onClick={() => irProduto(p + 1)} aria-label="Próximo produto" className={`${styles.seta} ${styles.dir}`}>
                        <ChevronRight size={24} />
                    </button>
                )}
            </div>
        </div>
    )
}
