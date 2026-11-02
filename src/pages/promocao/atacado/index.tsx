import { useState } from 'react';
import CrudPage from '@/components/ui/CrudPage';
import CustomButton from '@/components/ui/Buttons';
import ImagemUpload from '@/components/ui/ImagemUpload';
import { KRDColumn } from '@/components/ui/KRDTable';
import AtacadoForm from '@/components/Modals/Promocao/AtacadoForm';
import ResultadoAtacado from '@/components/Modals/Promocao/ResultadoAtacado';
import IPromocao from '@/interfaces/IPromocao';
import { GetCurrencyBRL } from '@/utils/functions';
import { useListaCrud } from '@/hooks/useListaCrud';

export default function Atacado() {
    const { list, loading, reload, user } = useListaCrud<IPromocao>('/Promocao/List');
    const [showResultado, setShowResultado] = useState(0);

    const columns: KRDColumn<IPromocao>[] = [
        {
            name: 'Imagem',
            width: '110px',
            cell: r => <ImagemUpload src={r['localPath']} uploadUrl={`/Promocao/${r.id}/UploadImagem`} onUploaded={reload} />,
        },
        { name: 'Local', selector: r => r['idPromocao'] > 0 ? 'SIM' : 'NAO', sortable: true, width: '70px' },
        { name: 'Tipo', selector: r => r.produtoId > 0 ? 'PRODUTO' : 'CLASSE', sortable: true, width: '100px' },
        { name: 'Item', selector: r => r.produto ? r.produto.nome : r.classeMaterial?.nomeClasse, sortable: true },
        { name: 'Quantidade', selector: r => r.quantidade, sortable: true, width: '110px' },
        { name: 'Valor', selector: r => GetCurrencyBRL(r.valorFinal), sortable: true, width: '110px' },
        { name: 'Status', selector: r => r.status ? 'Ativo' : 'Inativo', sortable: true, width: '90px' },
    ];

    return (
        <>
            <CrudPage<IPromocao>
                title="Promoções"
                newLabel="Nova Promoção"
                list={list}
                loading={loading}
                columns={columns}
                searchText={r => `${r.produto?.nome || ''}${r.classeMaterial?.nomeClasse || ''}`}
                onReload={reload}
                rowActions={r => (
                    <CustomButton typeButton={'outline-main'} onClick={() => setShowResultado(r.id)}>Resultados</CustomButton>
                )}
                renderCard={r => (
                    <>
                        <div>Item <b>{r.produto?.nome || r.classeMaterial?.nomeClasse || '--'}</b> · {r.status ? 'ATIVO' : 'INATIVO'}</div>
                        <div>{r.produtoId > 0 ? 'PRODUTO' : 'GRUPO'} · Qtd <b>{r.quantidade.toFixed(2)}</b> · Valor Final <b>{GetCurrencyBRL(r.valorFinal)}</b></div>
                    </>
                )}
                renderModal={(edit, close) => (
                    <AtacadoForm user={user} isOpen id={edit} setClose={close} />
                )}
            />
            {showResultado > 0 && (
                <ResultadoAtacado user={user} isOpen promocaoId={showResultado} setClose={() => setShowResultado(0)} />
            )}
        </>
    );
}
