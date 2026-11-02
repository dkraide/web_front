import CrudPage from '@/components/ui/CrudPage';
import { KRDColumn } from '@/components/ui/KRDTable';
import FormaPagamentoForm from '@/components/Modals/FormaPagamentoForm';
import IFormaPagamento from '@/interfaces/IFormaPagamento';
import { useListaCrud } from '@/hooks/useListaCrud';

const columns: KRDColumn<IFormaPagamento>[] = [
    { name: 'Local', selector: r => r.idFormaPagamento > 0 ? 'SIM' : 'NAO', sortable: true, width: '70px' },
    { name: 'Nome', selector: r => r.nome, sortable: true },
    { name: 'Faturamento', selector: r => r.geraFaturamento ? 'SIM' : 'NAO', sortable: true, width: '120px' },
    { name: 'Status', selector: r => r.isVisivel ? 'Ativo' : 'Inativo', sortable: true, width: '90px' },
];

export default function FormaPagamento() {
    const { list, loading, reload, user } = useListaCrud<IFormaPagamento>('/FormaPagamento/List');

    return (
        <CrudPage<IFormaPagamento>
            title="Formas de Pagamento"
            newLabel="Nova Forma"
            list={list}
            loading={loading}
            columns={columns}
            searchText={r => r.nome}
            onReload={reload}
            renderCard={r => <>{r.nome} · <b>{r.isVisivel ? 'Ativo' : 'Inativo'}</b></>}
            renderModal={(edit, close) => (
                <FormaPagamentoForm user={user} isOpen classeId={edit} setClose={close} />
            )}
        />
    );
}
