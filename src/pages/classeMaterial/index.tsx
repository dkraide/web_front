import { useRouter } from 'next/router';
import CrudPage from '@/components/ui/CrudPage';
import CustomButton from '@/components/ui/Buttons';
import { KRDColumn } from '@/components/ui/KRDTable';
import ClasseForm from '@/components/Modals/ClasseMaterial/CreateEditForm';
import ClasseMaterialMobile from '@/components/Mobile/Pages/ClasseMaterialMobile';
import IClasseMaterial from '@/interfaces/IClasseMaterial';
import { useListaCrud } from '@/hooks/useListaCrud';
import { useIsMobile } from '@/hooks/useIsMobile';

const columns: KRDColumn<IClasseMaterial>[] = [
    { name: 'Local', selector: r => r.idClasseMaterial >= 0 ? 'SIM' : 'NAO', sortable: true, width: '70px' },
    { name: 'Nome', selector: r => r.nomeClasse, sortable: true },
    { name: 'Status', selector: r => r.status ? 'Ativo' : 'Inativo', sortable: true, width: '90px' },
];

export default function ClasseMaterial() {
    const router = useRouter();
    const mobile = useIsMobile();
    const { list, loading, reload, user } = useListaCrud<IClasseMaterial>('/ClasseMaterial/List');

    if (mobile) {
        return <ClasseMaterialMobile list={list} loadData={reload} user={user} />;
    }
    return (
        <CrudPage<IClasseMaterial>
            title="Classes de Materiais"
            newLabel="Nova Classe"
            list={list}
            loading={loading}
            columns={columns}
            searchText={r => r.nomeClasse}
            onReload={reload}
            extraActions={<CustomButton typeButton={'dark'} onClick={() => router.push('/classeMaterial/franquia')}>Franquia</CustomButton>}
            renderCard={r => <>{r.nomeClasse}</>}
            renderModal={(edit, close) => (
                <ClasseForm user={user} isOpen classeId={edit} setClose={close} />
            )}
        />
    );
}
