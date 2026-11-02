import CrudPage from '@/components/ui/CrudPage';
import { KRDColumn } from '@/components/ui/KRDTable';
import TabelaForm from '@/components/Modals/Promocao/TabelaForm';
import ITabelaPromocional from '@/interfaces/ITabelaPromocional';
import { useListaCrud } from '@/hooks/useListaCrud';

const columns: KRDColumn<ITabelaPromocional>[] = [
    { name: 'Título', selector: r => r.titulo, sortable: true },
    { name: 'Qntd', selector: r => r.quantidadeMinima, sortable: true, width: '90px' },
    { name: 'Status', selector: r => r.status ? 'Ativo' : 'Inativo', sortable: true, width: '90px' },
];

export default function TabelaPromocional() {
    const { list, loading, reload, user } = useListaCrud<ITabelaPromocional>('/TabelaPromocional/List');

    return (
        <CrudPage<ITabelaPromocional>
            title="Tabelas Promocionais"
            newLabel="Nova Tabela"
            list={list}
            loading={loading}
            columns={columns}
            searchText={r => r.titulo}
            onReload={reload}
            renderCard={r => (
                <>
                    <div>Qtd <b>{r.quantidadeMinima.toFixed(2)}</b> · {r.status ? 'ATIVO' : 'INATIVO'}</div>
                    <div>Descrição <b>{r.titulo}</b></div>
                </>
            )}
            renderModal={(edit, close) => (
                <TabelaForm user={user} isOpen id={edit} setClose={close} />
            )}
        />
    );
}
