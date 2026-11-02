import { useState } from 'react';
import { endOfMonth, format, startOfMonth } from 'date-fns';
import { faEye } from '@fortawesome/free-solid-svg-icons';
import CrudPage from '@/components/ui/CrudPage';
import CustomButton from '@/components/ui/Buttons';
import { InputGroup } from '@/components/ui/InputGroup';
import { KRDColumn } from '@/components/ui/KRDTable';
import DetalheConferenciaForm from '@/components/Modals/Produto/DetalheConferenciaForm';
import IConferenciaEstoque from '@/interfaces/IConferenciaEstoque';
import { useListaCrud } from '@/hooks/useListaCrud';

const diferenca = (r: IConferenciaEstoque) => r.quantidadeInformada - r.quantidadeReal;

const columns: KRDColumn<IConferenciaEstoque>[] = [
    { name: 'Usuário', selector: r => r.usuarioNome || '--', sortable: true, width: '140px' },
    { name: 'Produto', selector: r => r.produto?.nome || '--', sortable: true },
    { name: 'Data', selector: r => String(r.dataConferencia), cell: r => format(new Date(r.dataConferencia), 'dd/MM/yy HH:mm'), sortable: true, width: '140px' },
    { name: 'Qte Inf.', selector: r => r.quantidadeInformada, cell: r => r.quantidadeInformada.toFixed(2), sortable: true, width: '110px' },
    { name: 'Qte Esp.', selector: r => r.quantidadeReal, cell: r => r.quantidadeReal.toFixed(2), sortable: true, width: '110px' },
    { name: 'Diferença', selector: diferenca, cell: r => diferenca(r).toFixed(2), sortable: true, width: '110px' },
];

export default function ConferenciaEstoque() {
    const [dateIn, setDateIn] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
    const [dateFim, setDateFim] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
    const { list, loading, reload, user } = useListaCrud<IConferenciaEstoque>('/ConferenciaEstoque/List', { dataIn: dateIn, dataFim: dateFim });

    return (
        <CrudPage<IConferenciaEstoque>
            title="Conferência de Estoque"
            list={list}
            loading={loading}
            columns={columns}
            searchText={r => r.produto?.nome || ''}
            onReload={reload}
            editIcon={faEye}
            editTitle="Ver detalhes"
            filters={<>
                <InputGroup minWidth={'200px'} type={'date'} value={dateIn} onChange={e => setDateIn(e.target.value)} title={'Início'} width={'20%'} />
                <InputGroup minWidth={'200px'} type={'date'} value={dateFim} onChange={e => setDateFim(e.target.value)} title={'Final'} width={'20%'} />
                <CustomButton typeButton={'dark'} onClick={reload}>Pesquisar</CustomButton>
            </>}
            renderCard={r => (
                <>
                    <div><b>{r.produto?.nome || '--'}</b> · {r.usuarioNome || '--'}</div>
                    <div>Informado {r.quantidadeInformada.toFixed(2)} · Esperado {r.quantidadeReal.toFixed(2)} · Dif. <b>{diferenca(r).toFixed(2)}</b></div>
                </>
            )}
            renderModal={(edit, close) => {
                const conferencia = list.find(c => c.id === edit);
                return conferencia && (
                    <DetalheConferenciaForm user={user} conferencia={conferencia} isOpen setClose={() => close()} />
                );
            }}
        />
    );
}
