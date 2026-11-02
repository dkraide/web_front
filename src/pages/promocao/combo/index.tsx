import { useState } from 'react';
import CrudPage from '@/components/ui/CrudPage';
import CustomButton from '@/components/ui/Buttons';
import { KRDColumn } from '@/components/ui/KRDTable';
import ComboForm from '@/components/Modals/Promocao/ComboForm';
import ResultadoCombo from '@/components/Modals/Promocao/ResultadoCombo';
import ICombo from '@/interfaces/ICombo';
import { useListaCrud } from '@/hooks/useListaCrud';

const columns: KRDColumn<ICombo>[] = [
    { name: 'Local', selector: r => r['idCombo'] >= 0 ? 'SIM' : 'NAO', sortable: true, width: '70px' },
    { name: 'Código', selector: r => r.codigo, sortable: true, width: '110px' },
    { name: 'Descrição', selector: r => r.descricao, sortable: true },
    { name: 'Status', selector: r => r.status ? 'Ativo' : 'Inativo', sortable: true, width: '90px' },
];

export default function Combo() {
    const { list, loading, reload, user } = useListaCrud<ICombo>('/Combo/List');
    const [showResultado, setShowResultado] = useState(0);

    return (
        <>
            <CrudPage<ICombo>
                title="Combos"
                newLabel="Novo Combo"
                list={list}
                loading={loading}
                columns={columns}
                searchText={r => `${r.codigo}${r.descricao}`}
                onReload={reload}
                rowActions={r => (
                    <CustomButton typeButton={'outline-main'} onClick={() => setShowResultado(r.id)}>Resultados</CustomButton>
                )}
                renderCard={r => (
                    <>
                        <div>Código <b>{r.codigo}</b> · {r.status ? 'ATIVO' : 'INATIVO'}</div>
                        <div>Descrição <b>{r.descricao}</b></div>
                    </>
                )}
                renderModal={(edit, close) => (
                    <ComboForm user={user} isOpen id={edit} setClose={close} />
                )}
            />
            {showResultado > 0 && (
                <ResultadoCombo user={user} isOpen comboId={showResultado} setClose={() => setShowResultado(0)} />
            )}
        </>
    );
}
