import { useRef } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus, faTimes, faChevronLeft, faChevronRight, faPlay } from '@fortawesome/free-solid-svg-icons'
import styles from './styles.module.scss'
import { LIMITE_MIDIAS, MidiaItem } from './useMidiaGaleria'

interface Props {
    midias: MidiaItem[]
    onAdd: (files: File[]) => void
    onRemove: (m: MidiaItem) => void
    onMove: (key: string, delta: -1 | 1) => void
    titulo?: string
}

// Galeria de midias do produto: imagens, GIFs e videos, com ordem editavel.
export default function MidiaGaleria({ midias, onAdd, onRemove, onMove, titulo = 'Galeria de mídias' }: Props) {
    const inputRef = useRef<HTMLInputElement>(null)

    return (
        <div className={styles.wrapper}>
            <div className={styles.titulo}>
                {titulo} <span>({midias.length}/{LIMITE_MIDIAS}) — imagens, GIFs e vídeos</span>
            </div>
            <div className={styles.carrossel}>
                {midias.map((m, i) => (
                    <div className={styles.card} key={m.key}>
                        {m.tipo === 'VIDEO' ? (
                            <video src={m.preview} muted playsInline preload="metadata" />
                        ) : (
                            <img src={m.preview} alt="mídia" onError={e => { e.currentTarget.src = '/nopic.png' }} />
                        )}
                        {i === 0 && <span className={styles.badge}>Capa</span>}
                        {m.tipo !== 'IMAGEM' && (
                            <span className={styles.tipo}>
                                {m.tipo === 'VIDEO' && <FontAwesomeIcon icon={faPlay} />} {m.tipo}
                            </span>
                        )}
                        <button type="button" className={styles.remove} onClick={() => onRemove(m)} title="Remover">
                            <FontAwesomeIcon icon={faTimes} />
                        </button>
                        <div className={styles.ordem}>
                            <button type="button" disabled={i === 0} onClick={() => onMove(m.key, -1)} title="Mover para a esquerda">
                                <FontAwesomeIcon icon={faChevronLeft} />
                            </button>
                            <button type="button" disabled={i === midias.length - 1} onClick={() => onMove(m.key, 1)} title="Mover para a direita">
                                <FontAwesomeIcon icon={faChevronRight} />
                            </button>
                        </div>
                    </div>
                ))}
                {midias.length < LIMITE_MIDIAS && (
                    <button type="button" className={styles.add} onClick={() => inputRef.current?.click()}>
                        <FontAwesomeIcon icon={faPlus} />
                        Adicionar mídia
                    </button>
                )}
                <input
                    ref={inputRef}
                    type="file"
                    multiple
                    accept="image/png, image/jpeg, image/webp, image/gif, video/mp4, video/webm, video/quicktime"
                    style={{ display: 'none' }}
                    onChange={e => {
                        const files = Array.from(e.target.files ?? [])
                        e.target.value = '' // permite re-selecionar o mesmo arquivo
                        if (files.length) onAdd(files)
                    }}
                />
            </div>
        </div>
    )
}
