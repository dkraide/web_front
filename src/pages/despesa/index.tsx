import { useContext, useEffect, useState } from 'react';
import styles from './styles.module.scss';
import { api } from '@/services/apiClient';
import { AuthContext } from '@/contexts/AuthContext';
import { AxiosError, AxiosResponse } from 'axios';
import { InputGroup } from '@/components/ui/InputGroup';
import KRDTable, { KRDColumn } from '@/components/ui/KRDTable';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faPlus, faFileExcel, faWandMagicSparkles, faSearch } from '@fortawesome/free-solid-svg-icons';
import IUsuario from '@/interfaces/IUsuario';
import IDespesa from '@/interfaces/IDespesa';
import { compareAsc, endOfMonth, format, startOfMonth } from 'date-fns';
import DespesaForm from '@/components/Modals/Financeiro/DespesaForm';
import BoxInfo from '@/components/ui/BoxInfo';
import _ from 'lodash';
import SelectStatusLancamento from '@/components/Selects/SelectStatusLancamento';
import { CSVLink } from "react-csv";
import Confirm from '@/components/Modals/Confirm';
import DespesaFormaForm from '@/components/Modals/Financeiro/DespesaFormaForm';
import { GetCurrencyBRL } from '@/utils/functions';
import { isMobile } from 'react-device-detect';

interface searchProps {
    dateIn: string
    dateFim: string
    status: number
    filter: string
}

export default function Despesa() {
    const [loading, setLoading] = useState(true)
    const [list, setList] = useState<IDespesa[]>([])
    const { getUser } = useContext(AuthContext)
    const [search, setSearch] = useState<searchProps>()
    const [edit, setEdit] = useState(-1);
    const [despesaForma, setDespesaForma] = useState(0);
    const [user, setUser] = useState<IUsuario>()
    const [deletar, setDeletar] = useState(0);

    const loadData = async () => {
        var u: any;
        if (!user) {
            var res = await getUser();
            setUser(res);
            u = res;
        }
        var url = '';
        if (!search) {
            var dateIn = format(startOfMonth(new Date()), 'yyyy-MM-dd');
            var dateFim = format(endOfMonth(new Date()), 'yyyy-MM-dd');
            setSearch({ ...search, dateIn: dateIn, dateFim: dateFim, status: 0 });
            url = `/Despesa/List?status=${0}&empresaId=${user?.empresaSelecionada || u.empresaSelecionada}&dataIn=${dateIn}&dataFim=${dateFim}`;
        } else {
            url = `/Despesa/List?status=${search.status || 0}&empresaId=${user?.empresaSelecionada || u.empresaSelecionada}&dataIn=${search.dateIn}&dataFim=${search.dateFim}`;
        }
        await api
            .get(url)
            .then(({ data }: AxiosResponse) => {
                setList(data);
            }).catch((err: AxiosError) => {
                toast.error(`Erro ao carregar dados. ${err.response?.data || err.message}`);
            });
        setLoading(false);
    }
    useEffect(() => {
        loadData();
    }, [])

    function getHeaders() {
        return [
            { label: "Descricao", key: "descricao" },
            { label: "vencimento", key: "dataVencimento" },
            { label: "Valor", key: "valorTotal" },
            { label: "Status", key: "statusLancamento" }
        ]
    }
    function getDataCsv() {
        var res = getFiltered().map((p) => {
            return {
                descricao: (p.motivoLancamento?.nome || p.descricao).toString(),
                dataVencimento: format(new Date(p.dataVencimento), 'dd/MM/yyyy'),
                valorTotal: p.valorTotal.toFixed(2),
                statusLancamento: p.statusLancamento ? 'PAGO' : new Date(p.dataVencimento) < new Date() ? 'VENCIDO' : 'EM ABERTO'
            }
        });
        return res;
    }


    function getFiltered() {
        var res = list.filter(p => {
            return (p.descricao + p.id.toString()).toLowerCase().includes(search?.filter?.toLowerCase() || '')
        });
        return res;
    }

    async function remover() {
        setLoading(true);
        await api.delete(`/Despesa/Delete?Id=${deletar}`)
            .then((data) => {
                loadData();
            })
            .catch((err) => {
                toast.error(`Erro ao tentar remover despesa.`);

            });
        setLoading(false);
    }

    const columns: KRDColumn<IDespesa>[] = [
        {
            name: '',
            cell: ({ id }) => (
                <div className={styles.rowActions}>
                    <button className={styles.editBtn} title="Editar" onClick={() => setEdit(id)}>
                        <FontAwesomeIcon icon={faEdit} />
                    </button>
                    <button className={`${styles.editBtn} ${styles.deleteBtn}`} title="Remover" onClick={() => setDeletar(id)}>
                        <FontAwesomeIcon icon={faTrash} />
                    </button>
                </div>
            ),
            width: '90px',
        },
        {
            name: '#',
            selector: row => row.id,
            sortable: true,
            width: '70px',
        },
        {
            name: 'Local',
            selector: row => row['idDespesa'] > 0 ? 'SIM' : 'NAO',
            sortable: true,
            width: '70px',
        },
        {
            name: 'Tipo',
            selector: row => row['tipoDespesa'],
            sortable: true,
        },
        {
            name: 'Descrição',
            selector: row => row.descricao,
            cell: row => (row.motivoLancamento?.nome || row.descricao || '').toString(),
            sortable: true,
        },
        {
            name: 'Lançamento',
            selector: row => String(row.dataLancamento),
            cell: row => format(new Date(row.dataLancamento || new Date()), 'dd/MM/yyyy'),
            sortable: true,
        },
        {
            name: 'Vencimento',
            selector: row => String(row.dataVencimento),
            cell: row => format(new Date(row.dataVencimento || new Date()), 'dd/MM/yyyy'),
            sortable: true,
        },
        {
            name: 'Valor',
            selector: row => row.valorTotal,
            cell: row => GetCurrencyBRL(row.valorTotal),
            sortable: true,
            right: true,
        },
        {
            name: 'Status',
            selector: row => row.statusLancamento ? 1 : 0,
            cell: row => <StatusBadge dataVencimento={row.dataVencimento} statusLancamento={row.statusLancamento} />,
            sortable: true,
            width: '110px',
        },
    ]


    const Item = (item: IDespesa) => {

        function getStatus(vencimento, status){
            if(status){
                return 'pago'
            }
            var v = new Date(vencimento);
            var res = compareAsc(v, new Date())
            return res >= 0 ? 'aberto' : 'vencido'

        }
        return(
            <div className={styles.item} onClick={() => { setEdit(item.id) }}>
                <span className={styles.w20}>Vencimento <br/><b>{format(new Date(item.dataVencimento), 'dd/MM/yy')}</b></span>
                <span className={styles.w20}>Valor <br/><b>{ GetCurrencyBRL(item.valorTotal)}</b></span>
                <span className={styles[getStatus(item.dataVencimento, item.statusLancamento)]}><b>{getStatus(item.dataVencimento, item.statusLancamento).toUpperCase()}</b></span>
                <span className={styles.w100}>Descricao <br/><b>{ item.descricao || item.motivoLancamento?.nome || ''}</b></span>
            </div>
        )
    }

    const emAberto = _.sumBy(list, p => (new Date(p.dataVencimento) < new Date() || p.statusLancamento) ? 0 : p.valorTotal)
    const pago = _.sumBy(list, p => p.statusLancamento ? p.valorTotal : 0)
    const vencido = _.sumBy(list, p => (new Date(p.dataVencimento) < new Date() && !p.statusLancamento) ? p.valorTotal : 0)
    const filtered = getFiltered()

    return (
        <div className={styles.container}>

            {/* Header */}
            <div className={styles.header}>
                <h4 className={styles.title}>Despesas</h4>
                <div className={styles.headerActions}>
                    <button className={styles.actionBtn} onClick={() => { setEdit(0) }}>
                        <FontAwesomeIcon icon={faPlus} />
                        Nova despesa
                    </button>
                    <button className={styles.actionBtn} onClick={() => { setDespesaForma(1) }}>
                        <FontAwesomeIcon icon={faWandMagicSparkles} />
                        Gerar despesa por forma
                    </button>
                    <CSVLink className={styles.actionBtn} data={getDataCsv()} headers={getHeaders()} filename={"relatorio_despesa.csv"}>
                        <FontAwesomeIcon icon={faFileExcel} />
                        Planilha
                    </CSVLink>
                </div>
            </div>

            {/* Resumo */}
            <div className={styles.stats}>
                <BoxInfo title={'Geral'} value={GetCurrencyBRL(_.sumBy(list, p => p.valorTotal))} />
                <BoxInfo title={'Em Aberto'} value={GetCurrencyBRL(emAberto)} />
                <BoxInfo title={'Pago'} value={GetCurrencyBRL(pago)} />
                <BoxInfo title={'Vencido'} value={GetCurrencyBRL(vencido)} />
            </div>

            {/* Filtros + busca */}
            <div className={styles.searchBar}>
                <div className={styles.filterControl}>
                    <InputGroup type={'date'} value={search?.dateIn || ''} onChange={(v) => { setSearch({ ...search, dateIn: v.target.value }) }} title={'Início'} />
                </div>
                <div className={styles.filterControl}>
                    <InputGroup type={'date'} value={search?.dateFim || ''} onChange={(v) => { setSearch({ ...search, dateFim: v.target.value }) }} title={'Final'} />
                </div>
                <div className={styles.filterControl}>
                    <SelectStatusLancamento width={'200px'} selected={search?.status || 0} setSelected={(v) => { setSearch({ ...search, status: v }) }} />
                </div>
                <button className={styles.actionBtn} style={{ height: 38 }} onClick={loadData}>
                    <FontAwesomeIcon icon={faSearch} />
                    Pesquisar
                </button>
                <div className={styles.searchInput}>
                    <InputGroup
                        placeholder="Filtrar por descrição ou código..."
                        title=""
                        value={search?.filter || ''}
                        onChange={(e) => { setSearch({ ...search, filter: e.target.value }) }}
                    />
                </div>
                {!loading && (
                    <span className={styles.counter}>
                        {filtered.length} despesa{filtered.length !== 1 ? 's' : ''}
                    </span>
                )}
            </div>

            <hr className={styles.divider} />

            {isMobile ? <>
                {filtered.map((item) => Item(item))}
            </> : (
                <KRDTable<IDespesa>
                    columns={columns}
                    data={filtered}
                    loading={loading}
                />
            )}

            {(edit >= 0) && <DespesaForm user={user} isOpen={edit >= 0} id={edit} setClose={(v) => {
                if (v) {
                    loadData();
                }
                setEdit(-1);
            }} />}
            {(deletar >= 0) && <Confirm message={`Tem certeza que deseja deletar essa despesa?`} isOpen={deletar > 0} setClose={(v) => {
                if (v) {
                    remover();
                }
                setDeletar(0);
            }} />}
            {(despesaForma > 0) && <DespesaFormaForm user={user} isOpen={despesaForma > 0} setClose={(v) => {
                if (v) {
                    loadData();
                }
                setDespesaForma(0);
            }} />}


        </div>
    )
}

const StatusBadge = ({ dataVencimento, statusLancamento }) => {
    if (statusLancamento) {
        return <span className={styles.badgeSuccess}>PAGO</span>
    }
    if (new Date(dataVencimento) < new Date()) {
        return <span className={styles.badgeDanger}>VENCIDO</span>
    }
    return <span className={styles.badgeNeutro}>EM ABERTO</span>
}
