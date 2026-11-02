import CrudPage from '@/components/ui/CrudPage';
import ImagemUpload from '@/components/ui/ImagemUpload';
import { KRDColumn } from '@/components/ui/KRDTable';
import PremioForm from '@/components/Modals/Premio/PremioForm';
import IPremio from '@/interfaces/IPremio';
import { useListaCrud } from '@/hooks/useListaCrud';

export default function ClientePremio() {
    const { list, loading, reload, user } = useListaCrud<IPremio>('/Premio/List');

    const columns: KRDColumn<IPremio>[] = [
        { name: 'Local', selector: r => r.idPremio >= 0 ? 'SIM' : 'NAO', sortable: true, width: '70px' },
        {
            name: 'Imagem',
            width: '110px',
            cell: r => <ImagemUpload src={r.localPath} uploadUrl={`/Premio/${r.id}/UploadImagem`} onUploaded={reload} />,
        },
        { name: 'Descrição', selector: r => r.descricao, sortable: true },
        { name: 'Pontos', selector: r => r.quantidadePontos, sortable: true, width: '90px' },
        { name: 'Status', selector: r => r.status ? 'Ativo' : 'Inativo', sortable: true, width: '90px' },
    ];

    return (
        <CrudPage<IPremio>
            title="Prêmios"
            newLabel="Novo Prêmio"
            list={list}
            loading={loading}
            columns={columns}
            searchText={r => r.descricao}
            onReload={reload}
            renderCard={r => (
                <>
                    <div>Descrição <b>{r.descricao}</b> · Pontos <b>{r.quantidadePontos}</b></div>
                    <div>Status <b>{r.status ? 'ATIVO' : 'INATIVO'}</b></div>
                </>
            )}
            renderModal={(edit, close) => (
                <PremioForm user={user} isOpen premioId={edit} setClose={close} />
            )}
        />
    );
}
