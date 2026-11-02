import CrudPage from '@/components/ui/CrudPage';
import { KRDColumn } from '@/components/ui/KRDTable';
import CupomForm from '@/components/Modals/CupomDesconto/CreateEditForm';
import ICupomDesconto from '@/interfaces/ICupomDesconto';
import { useListaCrud } from '@/hooks/useListaCrud';

function formatValor(c: ICupomDesconto) {
    return c.tipoCalculo === 'PERCENTUAL' ? `${c.valor}%` : `R$${(c.valor || 0).toFixed(2)}`;
}

function formatUsos(c: ICupomDesconto) {
    return c.quantidade === 0 ? `${c.quantidadeUsada} / ∞` : `${c.quantidadeUsada} / ${c.quantidade}`;
}

function formatData(d?: string | null) {
    if (!d) return '-';
    const dt = new Date(d);
    return isNaN(dt.getTime()) ? '-' : dt.toLocaleDateString('pt-BR');
}

const columns: KRDColumn<ICupomDesconto>[] = [
    { name: 'Título', selector: r => r.titulo, sortable: true },
    { name: 'Código', selector: r => r.codigo, sortable: true },
    { name: 'Valor', cell: formatValor },
    { name: 'Aplicação', selector: r => r.tipoAplicacao },
    { name: 'Permissão', selector: r => r.permissao },
    { name: 'Validade', cell: r => formatData(r.dataValidade) },
    { name: 'Usos', cell: formatUsos },
    { name: 'Status', selector: r => r.status ? 'Ativo' : 'Inativo' },
];

export default function Cupons() {
    const { list, loading, reload, user } = useListaCrud<ICupomDesconto>('/v2/CupomDesconto');

    return (
        <CrudPage<ICupomDesconto>
            title="Cupons de Desconto"
            newLabel="Novo Cupom"
            list={list}
            loading={loading}
            columns={columns}
            searchText={r => `${r.titulo || ''}${r.codigo || ''}`}
            onReload={reload}
            renderCard={r => (
                <>
                    <div><b>{r.titulo}</b> · {r.codigo}</div>
                    <div>{formatValor(r)} · Usos {formatUsos(r)} · {r.status ? 'Ativo' : 'Inativo'}</div>
                </>
            )}
            renderModal={(edit, close) => (
                <CupomForm user={user} isOpen cupomId={edit} setClose={close} />
            )}
        />
    );
}
