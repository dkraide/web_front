import { useRouter } from 'next/router';
import CrudPage from '@/components/ui/CrudPage';
import CustomButton from '@/components/ui/Buttons';
import { KRDColumn } from '@/components/ui/KRDTable';
import ClienteForm from '@/components/Modals/Cliente/ClienteForm';
import ICliente from '@/interfaces/ICliente';
import { useListaCrud } from '@/hooks/useListaCrud';

const columns: KRDColumn<ICliente>[] = [
    { name: 'Local', selector: r => r.idCliente >= 0 ? 'SIM' : 'NAO', sortable: true, width: '70px' },
    { name: 'Nome', selector: r => r.nome, sortable: true },
    { name: 'CPF', selector: r => r.cpf, sortable: true, width: '140px' },
    { name: 'Telefone', selector: r => r.telefone, sortable: true },
    { name: 'Pontos', selector: r => r.pontos, sortable: true, width: '90px' },
];

export default function Cliente() {
    const router = useRouter();
    const { list, loading, reload, user } = useListaCrud<ICliente>('/Cliente/List');

    return (
        <CrudPage<ICliente>
            title="Clientes"
            newLabel="Novo Cliente"
            list={list}
            loading={loading}
            columns={columns}
            searchText={r => `${r.nome} ${r.telefone} ${r.cpf}`}
            onReload={reload}
            extraActions={<CustomButton typeButton={'dark'} onClick={() => router.push('/cliente/franquia')}>Franquia</CustomButton>}
            renderCard={r => (
                <>
                    <div>Nome <b>{r.nome}</b> · Pontos <b>{r.pontos}</b></div>
                    <div>CPF <b>{r.cpf}</b> · Telefone <b>{r.telefone}</b></div>
                </>
            )}
            renderModal={(edit, close) => (
                <ClienteForm user={user} isOpen clienteId={edit} setClose={close} />
            )}
        />
    );
}
