import { useState } from 'react';
import _ from 'lodash';
import { Badge } from 'react-bootstrap';
import { endOfMonth, format, startOfMonth } from 'date-fns';
import CrudPage from '@/components/ui/CrudPage';
import CustomButton from '@/components/ui/Buttons';
import BoxInfo from '@/components/ui/BoxInfo';
import { InputGroup } from '@/components/ui/InputGroup';
import { KRDColumn } from '@/components/ui/KRDTable';
import SelectStatusRecebimento from '@/components/Selects/SelectStatusRecebimento';
import EntradaForm from '@/components/Modals/Financeiro/EntradaEditForm';
import IEntrada from '@/interfaces/IEntrada';
import { GetCurrencyBRL } from '@/utils/functions';
import { useListaCrud } from '@/hooks/useListaCrud';

const dataBR = (d?: Date | string) => format(new Date(d || new Date()), 'dd/MM/yyyy');
const vencida = (e: IEntrada) => !e.statusRecebimento && new Date(e.dataRecebimento) < new Date();

function StatusBadge({ entrada }: { entrada: IEntrada }) {
    const estilo = { padding: '7px', fontSize: '12px' };
    if (entrada.statusRecebimento) return <Badge style={estilo} bg={'success'}>PAGO</Badge>;
    if (vencida(entrada)) return <Badge style={estilo} bg={'danger'}>VENCIDO</Badge>;
    return <Badge style={estilo} bg={'primary'}>EM ABERTO</Badge>;
}

const columns: KRDColumn<IEntrada>[] = [
    { name: 'Local', selector: r => r['idEntrada'] > 0 ? 'SIM' : 'NAO', sortable: true, width: '70px' },
    { name: 'Descrição', selector: r => r.descricao, sortable: true },
    { name: 'Lançamento', selector: r => String(r.dataLancamento), cell: r => dataBR(r.dataLancamento), sortable: true, width: '120px' },
    { name: 'Recebimento', selector: r => String(r.dataRecebimento), cell: r => r.statusRecebimento ? dataBR(r.dataRecebimento) : '--', sortable: true, width: '130px' },
    { name: 'Valor', selector: r => r.valorTotal, cell: r => GetCurrencyBRL(r.valorTotal), sortable: true, width: '120px' },
    { name: 'Status', selector: r => r.statusRecebimento ? 1 : 0, cell: r => <StatusBadge entrada={r} />, sortable: true, width: '120px' },
];

export default function Entrada() {
    const [dateIn, setDateIn] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
    const [dateFim, setDateFim] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
    const [status, setStatus] = useState(0);
    const { list, loading, reload, user } = useListaCrud<IEntrada>('/Entrada/List', { status, dataIn: dateIn, dataFim: dateFim });

    return (
        <CrudPage<IEntrada>
            title="Entradas"
            newLabel="Nova Entrada"
            list={list}
            loading={loading}
            columns={columns}
            searchText={r => r.descricao}
            onReload={reload}
            filters={<>
                <InputGroup minWidth={'200px'} type={'date'} value={dateIn} onChange={e => setDateIn(e.target.value)} title={'Início'} width={'20%'} />
                <InputGroup minWidth={'200px'} type={'date'} value={dateFim} onChange={e => setDateFim(e.target.value)} title={'Final'} width={'20%'} />
                <SelectStatusRecebimento width={'30%'} selected={status} setSelected={setStatus} />
                <CustomButton typeButton={'dark'} onClick={reload}>Pesquisar</CustomButton>
            </>}
            summary={<>
                <BoxInfo title={'Geral'} value={GetCurrencyBRL(_.sumBy(list, p => p.valorTotal))} />
                <BoxInfo title={'A Receber'} value={GetCurrencyBRL(_.sumBy(list, p => (p.statusRecebimento || vencida(p)) ? 0 : p.valorTotal))} />
                <BoxInfo title={'Recebido'} value={GetCurrencyBRL(_.sumBy(list, p => p.statusRecebimento ? p.valorTotal : 0))} />
            </>}
            renderCard={r => (
                <>
                    <div><b>{r.descricao}</b></div>
                    <div>{dataBR(r.dataRecebimento)} · {GetCurrencyBRL(r.valorTotal)} · <StatusBadge entrada={r} /></div>
                </>
            )}
            renderModal={(edit, close) => (
                <EntradaForm user={user} isOpen id={edit} setClose={close} />
            )}
        />
    );
}
