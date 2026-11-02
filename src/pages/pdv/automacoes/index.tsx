import CrudPage from '@/components/ui/CrudPage';
import { KRDColumn } from '@/components/ui/KRDTable';
import IAutomacao from '@/interfaces/IAutomacao';
import AutomacaoForm from '@/components/Modals/Automacao/CreateEditForm';
import { useListaCrud } from '@/hooks/useListaCrud';

export const DESCRICAO_GATILHO: Record<string, string> = {
    ESTOQUE: 'Estoque do produto na venda',
    VENDA_ERRO: 'Erro na venda',
    VENDA_FINALIZADA: 'Venda finalizada',
}

export const DESCRICAO_ACAO: Record<string, string> = {
    ESTOQUE: 'Lançar estoque',
    EMAIL: 'Enviar e-mail',
    APLICATIVO: 'Notificar aplicativo',
}

const columns: KRDColumn<IAutomacao>[] = [
    { name: 'Nome', selector: r => r.nome, sortable: true },
    { name: 'Quando', selector: r => DESCRICAO_GATILHO[r.tipoGatilho] || r.tipoGatilho, sortable: true },
    { name: 'Então', selector: r => DESCRICAO_ACAO[r.tipoAcao] || r.tipoAcao, sortable: true },
    { name: 'Status', selector: r => r.status ? 'Ativo' : 'Inativo', width: '90px' },
];

export default function Automacoes() {
    const { list, loading, reload, user } = useListaCrud<IAutomacao>('/v2/Automacao');

    return (
        <CrudPage<IAutomacao>
            title="Automações"
            newLabel="Nova Automação"
            list={list}
            loading={loading}
            columns={columns}
            searchText={r => r.nome || ''}
            onReload={reload}
            renderCard={r => (
                <>
                    <div><b>{r.nome}</b> · {r.status ? 'Ativo' : 'Inativo'}</div>
                    <div>{DESCRICAO_GATILHO[r.tipoGatilho] || r.tipoGatilho} → {DESCRICAO_ACAO[r.tipoAcao] || r.tipoAcao}</div>
                </>
            )}
            renderModal={(edit, close) => (
                <AutomacaoForm user={user} isOpen automacaoId={edit} setClose={close} />
            )}
        />
    );
}
