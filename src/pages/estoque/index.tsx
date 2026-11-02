import _ from 'lodash';
import { faEye } from '@fortawesome/free-solid-svg-icons';
import CrudPage from '@/components/ui/CrudPage';
import CustomButton from '@/components/ui/Buttons';
import BoxInfo from '@/components/ui/BoxInfo';
import { KRDColumn } from '@/components/ui/KRDTable';
import EstoqueForm from '@/components/Modals/Produto/EstoqueForm';
import IProduto from '@/interfaces/IProduto';
import { ExportToExcel, GetCurrencyBRL } from '@/utils/functions';
import { useListaCrud } from '@/hooks/useListaCrud';

const positivo = (n: number) => (n > 0 ? n : 0);

const columns: KRDColumn<IProduto>[] = [
    { name: 'Cod', selector: r => r.cod, sortable: true, width: '100px' },
    { name: 'Nome', selector: r => r.nome, sortable: true },
    { name: 'Estoque', selector: r => r.quantidade, cell: r => r.quantidade.toFixed(2), sortable: true, width: '110px' },
    { name: 'Estoque Min.', selector: r => r.quantidadeMinima, sortable: true, width: '120px' },
    { name: 'Custo Un.', selector: r => r.valorCompra, cell: r => GetCurrencyBRL(r.valorCompra), sortable: true, width: '120px' },
    { name: 'Custo Total', selector: r => r.valorCompra * positivo(r.quantidade), cell: r => GetCurrencyBRL(r.valorCompra * positivo(r.quantidade)), sortable: true, width: '130px' },
    { name: 'Venda Total', selector: r => r.valor * positivo(r.quantidade), cell: r => GetCurrencyBRL(r.valor * positivo(r.quantidade)), sortable: true, width: '130px' },
];

const headers = [
    { label: 'Cod', key: 'cod' },
    { label: 'Descricao', key: 'nome' },
    { label: 'Quantidade', key: 'quantidade' },
    { label: 'Compra', key: 'compra' },
    { label: 'Venda', key: 'venda' },
];

function exportarExcel(produtos: IProduto[]) {
    const data = produtos.map(p => ({
        cod: p.cod,
        nome: p.nome,
        quantidade: p.quantidade,
        compra: (p.valorCompra * positivo(p.quantidade)).toFixed(2),
        venda: (p.valor * positivo(p.quantidade)).toFixed(2),
    }));
    ExportToExcel(headers, data, 'relatorio_estoque');
}

export default function Estoque() {
    const { list, loading, reload, user } = useListaCrud<IProduto>('/Estoque/List');

    return (
        <CrudPage<IProduto>
            title="Produtos"
            list={list}
            loading={loading}
            columns={columns}
            searchText={r => r.nome}
            onReload={reload}
            editIcon={faEye}
            editTitle="Ver estoque"
            extraActions={filtered => (
                <CustomButton typeButton={'dark'} onClick={() => exportarExcel(filtered)}>Excel</CustomButton>
            )}
            summary={<>
                <BoxInfo title={'Estoque'} value={_.sumBy(list, x => positivo(x.quantidade)).toFixed(2)} />
                <BoxInfo title={'Valor'} value={GetCurrencyBRL(_.sumBy(list, x => positivo(x.quantidade) * x.valor))} />
                <BoxInfo title={'Compra'} value={GetCurrencyBRL(_.sumBy(list, x => positivo(x.quantidade) * x.valorCompra))} />
            </>}
            renderCard={r => (
                <>
                    <div>{r.cod} · <b>{r.nome}</b></div>
                    <div>Estoque <b>{r.quantidade.toFixed(2)}</b> (mín. {r.quantidadeMinima})</div>
                </>
            )}
            renderModal={(edit, close) => (
                <EstoqueForm user={user} isOpen id={edit} setClose={close} />
            )}
        />
    );
}
