import { useRouter } from 'next/router';
import CrudPage from '@/components/ui/CrudPage';
import CustomButton from '@/components/ui/Buttons';
import { KRDColumn } from '@/components/ui/KRDTable';
import MateriaPrimaForm from '@/components/Modals/MateriaPrima/CadastroForm';
import IMateriaPrima from '@/interfaces/IMateriaPrima';
import { GetCurrencyBRL } from '@/utils/functions';
import { useListaCrud } from '@/hooks/useListaCrud';

const columns: KRDColumn<IMateriaPrima>[] = [
    { name: 'Local', selector: r => r.idMateriaPrima ? 'SIM' : 'NAO', sortable: true, width: '70px' },
    { name: 'Nome', selector: r => r.nome, sortable: true },
    { name: 'Quantidade', selector: r => r.quantidade, sortable: true, width: '110px' },
    { name: 'Custo', selector: r => r.valorCusto, sortable: true, width: '100px' },
    { name: 'Venda', selector: r => r.valorVenda, sortable: true, width: '100px' },
];

export default function MateriaPrima() {
    const router = useRouter();
    const { list, loading, reload, user } = useListaCrud<IMateriaPrima>('/MateriaPrima/List');

    return (
        <CrudPage<IMateriaPrima>
            title="Ingredientes"
            newLabel="Novo Ingrediente"
            list={list}
            loading={loading}
            columns={columns}
            searchText={r => r.nome}
            onReload={reload}
            renderCard={r => (
                <>
                    <div>Descrição <b>{r.nome}</b></div>
                    <div>Qtd <b>{r.quantidade.toFixed(2)}</b> · Custo <b>{GetCurrencyBRL(r.valorCusto)}</b> · Venda <b>{GetCurrencyBRL(r.valorVenda)}</b></div>
                </>
            )}
            renderModal={(edit, close) => (
                <MateriaPrimaForm user={user} isOpen id={edit} setClose={close} />
            )}
        />
    );
}
