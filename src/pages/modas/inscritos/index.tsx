import { useEffect, useMemo, useState } from "react"
import { api } from "@/services/apiClient"
import { AxiosError } from "axios"
import { toast } from "react-toastify"
import { Spinner } from "react-bootstrap"
import { isMobile } from 'react-device-detect'
import styles from '../../relatorio/produto/styles.module.scss'
import KRDTable, { KRDColumn } from "@/components/ui/KRDTable"
import { InputGroup } from "@/components/ui/InputGroup"
import CustomButton from "@/components/ui/Buttons"
import { ExportToExcel } from "@/utils/functions"

interface Inscrito { email: string; criadoEm: string }

const dataBR = (iso: string) => new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })

export default function InscritosNewsletter() {
    const [lista, setLista] = useState<Inscrito[]>([])
    const [loading, setLoading] = useState(true)
    const [busca, setBusca] = useState('')

    useEffect(() => {
        (async () => {
            try {
                const { data } = await api.get<Inscrito[]>('/ModasRelatorio/newsletter')
                setLista(data)
            } catch (err) {
                const e = err as AxiosError
                toast.error(`Erro ao buscar os inscritos. ${e.response?.data || e.message}`)
            } finally {
                setLoading(false)
            }
        })()
    }, [])

    const filtrados = useMemo(() => {
        const termo = busca.trim().toLowerCase()
        return termo ? lista.filter(i => i.email.includes(termo)) : lista
    }, [lista, busca])

    const colunas: KRDColumn<Inscrito>[] = [
        { name: 'E-mail', selector: r => r.email, sortable: true },
        { name: 'Inscrito em', selector: r => r.criadoEm, cell: r => dataBR(r.criadoEm), sortable: true },
    ]

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h4 className={styles.title}>Inscritos na newsletter</h4>
                <CustomButton
                    onClick={() => ExportToExcel([{ label: 'E-mail', key: 'email' }, { label: 'Inscrito em', key: 'criadoEm' }], filtrados, 'newsletter')}
                    typeButton="dark"
                >
                    Exportar Excel
                </CustomButton>
            </div>
            <p style={{ fontSize: 13, opacity: 0.75 }}>
                A plataforma só guarda os e-mails. Exporte a lista e use na sua ferramenta de e-mail marketing.
            </p>
            <hr className={styles.divider} />
            {loading ? (
                <div className={styles.loadingWrap}><Spinner /></div>
            ) : (
                <>
                    <div className={styles.metricsGrid}>
                        <div className={styles.metricCard}>
                            <span className={styles.metricLabel}>Inscritos</span>
                            <span className={styles.metricValue}>{lista.length.toLocaleString('pt-BR')}</span>
                            <span className={styles.metricSub}>e-mails ativos</span>
                        </div>
                    </div>
                    <div className={styles.searchRow}>
                        <InputGroup title="Filtrar por e-mail" value={busca} onChange={e => setBusca(e.currentTarget.value)} />
                    </div>
                    {isMobile ? (
                        <div className={styles.mobileList}>
                            {filtrados.map(i => (
                                <div key={i.email} className={styles.mobileItem}>
                                    <div className={styles.mobileItemHeader}><span className={styles.mobileProduto}>{i.email}</span></div>
                                    <div className={styles.mobileItemBody}><div className={styles.mobileField}><span>Inscrito em</span><b>{dataBR(i.criadoEm)}</b></div></div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <KRDTable<Inscrito> columns={colunas} data={filtrados} loading={loading} paginationPerPage={25} />
                    )}
                </>
            )}
        </div>
    )
}
