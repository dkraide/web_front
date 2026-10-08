import { ReactNode, useEffect, useState } from "react"
import CustomTable from "@/components/ui/CustomTable"
import styles from "./styles.module.scss"

// true quando a tela é estreita (celular). Usa a largura real, não o user agent.
export function useTelaEstreita(limite = 768) {
    const [estreita, setEstreita] = useState(false)
    useEffect(() => {
        const mq = window.matchMedia(`(max-width: ${limite}px)`)
        const atualizar = () => setEstreita(mq.matches)
        atualizar()
        mq.addEventListener("change", atualizar)
        return () => mq.removeEventListener("change", atualizar)
    }, [limite])
    return estreita
}

interface Props<T> {
    data: T[]
    /** Colunas da tabela (telas largas). */
    columns: any[]
    /** Como cada item aparece como card (telas estreitas). */
    renderCard: (item: T) => ReactNode
    loading?: boolean
    pageSize?: number
}

// Tabela no desktop; lista de cards com "Ver mais" no celular.
export default function ListaResponsiva<T>({ data, columns, renderCard, loading, pageSize = 8 }: Props<T>) {
    const estreita = useTelaEstreita()
    const [visiveis, setVisiveis] = useState(pageSize)

    useEffect(() => setVisiveis(pageSize), [data, pageSize])

    if (!estreita) {
        return <CustomTable columns={columns} data={data} loading={loading} paginationPerPage={pageSize} />
    }
    if (data.length == 0) return <div className={styles.vazio}>Sem itens para serem exibidos.</div>
    return (
        <div className={styles.lista}>
            {data.slice(0, visiveis).map((item, i) => <div key={i}>{renderCard(item)}</div>)}
            {visiveis < data.length && (
                <button type="button" className={styles.verMais} onClick={() => setVisiveis(v => v + pageSize)}>
                    Ver mais ({data.length - visiveis} restantes)
                </button>
            )}
        </div>
    )
}
