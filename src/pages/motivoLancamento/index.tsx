import CrudPage from '@/components/ui/CrudPage';
import { KRDColumn } from '@/components/ui/KRDTable';
import MotivoForm from '@/components/Modals/Financeiro/MotivoForm';
import IMotivoLancamento from '@/interfaces/IMotivoLancamento';
import { useListaCrud } from '@/hooks/useListaCrud';

const columns: KRDColumn<IMotivoLancamento>[] = [
    { name: '#', selector: r => r.id, sortable: true, width: '70px' },
    { name: 'Local', selector: r => r.idMotivoLancamento > 0 ? 'SIM' : 'NAO', sortable: true, width: '70px' },
    { name: 'Nome', selector: r => r.nome, sortable: true },
];

export default function MotivoLancamento() {
    const { list, loading, reload, user } = useListaCrud<IMotivoLancamento>('/MotivoLancamento/List');

    return (
        <CrudPage<IMotivoLancamento>
            title="Motivos de Lançamentos"
            newLabel="Novo Motivo"
            list={list}
            loading={loading}
            columns={columns}
            searchText={r => r.nome}
            onReload={reload}
            renderCard={r => <>Descrição <b>{r.nome}</b></>}
            renderModal={(edit, close) => (
                <MotivoForm user={user} isOpen id={edit} setClose={close} />
            )}
        />
    );
}
