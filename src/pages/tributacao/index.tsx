import CrudPage from '@/components/ui/CrudPage';
import { KRDColumn } from '@/components/ui/KRDTable';
import TributacaoForm from '@/components/Modals/Tributacao/TributacaoForm';
import ITributacao from '@/interfaces/ITributacao';
import { useListaCrud } from '@/hooks/useListaCrud';

const columns: KRDColumn<ITributacao>[] = [
    { name: '#', selector: r => r.id, sortable: true, width: '70px' },
    { name: 'Local', selector: r => r.idTributacao >= 0 ? 'SIM' : 'NAO', sortable: true, width: '70px' },
    { name: 'NCM', selector: r => r.ncm, sortable: true, width: '110px' },
    { name: 'Nome', selector: r => r.descricao, sortable: true },
    { name: 'ICMS', selector: r => r.cstIcms, sortable: true, width: '80px' },
    { name: 'CFOP', selector: r => r.cfop, sortable: true, width: '80px' },
    { name: 'PIS', selector: r => r.cstPis, sortable: true, width: '80px' },
    { name: 'COFINS', selector: r => r.cstCofins, sortable: true, width: '90px' },
    { name: 'Status', selector: r => r.status ? 'Ativo' : 'Inativo', sortable: true, width: '90px' },
];

export default function Tributacao() {
    const { list, loading, reload, user } = useListaCrud<ITributacao>('/Tributacao/List');

    return (
        <CrudPage<ITributacao>
            title="Tributações"
            newLabel="Nova Tributação"
            list={list}
            loading={loading}
            columns={columns}
            searchText={r => `${r.descricao} ${r.ncm}`}
            onReload={reload}
            renderCard={r => (
                <>
                    <div>NCM <b>{r.ncm}</b> · CFOP <b>{r.cfop}</b></div>
                    <div>Descrição <b>{r.descricao}</b></div>
                    <div>ICMS <b>{r.cstIcms}</b> · PIS <b>{r.cstPis}</b> · COFINS <b>{r.cstCofins}</b></div>
                </>
            )}
            renderModal={(edit, close) => (
                <TributacaoForm user={user} isOpen id={edit} setClose={close} />
            )}
        />
    );
}
