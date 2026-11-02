import { ReactNode, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, IconDefinition } from '@fortawesome/free-solid-svg-icons';
import { isMobile } from 'react-device-detect';
import { InputGroup } from '@/components/ui/InputGroup';
import CustomButton from '@/components/ui/Buttons';
import KRDTable, { KRDColumn } from '@/components/ui/KRDTable';
import styles from './styles.module.scss';

interface CrudPageProps<T extends { id: number }> {
    title: string
    /** Sem `newLabel` não há botão de cadastro (telas só de consulta). */
    newLabel?: string
    list: T[]
    loading: boolean
    columns: KRDColumn<T>[]
    /** Texto usado pelo filtro de busca (já inclui o id). */
    searchText: (row: T) => string
    /** Conteúdo do card na versão mobile. */
    renderCard: (row: T) => ReactNode
    /** id = 0 cria um novo; -1 fecha. Renderize aqui o modal de edição. */
    renderModal: (edit: number, close: (reload?: boolean) => void) => ReactNode
    onReload: () => void
    /** Botões extras ao lado de "novo" (ex.: Franquia). */
    extraActions?: ReactNode | ((filtered: T[]) => ReactNode)
    /** Filtros de servidor (datas/status + Pesquisar), acima da busca. */
    filters?: ReactNode
    /** Resumo (caixas de totais) abaixo da barra de busca. */
    summary?: ReactNode
    /** Ícone do botão de linha; padrão: lápis. */
    editIcon?: IconDefinition
    editTitle?: string
    /** Ações extras por linha, ao lado do botão de editar (somente na tabela). */
    rowActions?: (row: T) => ReactNode
}

/** Tela padrão de cadastro: título, busca, botão "novo", tabela (ou cards no mobile) e modal. */
export default function CrudPage<T extends { id: number }>({
    title, newLabel, list, loading, columns, searchText, renderCard, renderModal, onReload, extraActions, rowActions, filters, summary, editIcon = faEdit, editTitle = 'Editar',
}: CrudPageProps<T>) {
    const [search, setSearch] = useState('');
    const [edit, setEdit] = useState(-1);

    const filtered = useMemo(() => {
        const termo = search.toLowerCase();
        return list.filter(r => `${searchText(r)} ${r.id}`.toLowerCase().includes(termo));
    }, [list, search]);

    const allColumns: KRDColumn<T>[] = [
        {
            name: '',
            width: rowActions ? '150px' : '60px',
            cell: (row) => (
                <div className={styles.rowActions}>
                    <button className={styles.editBtn} title={editTitle} onClick={() => setEdit(row.id)}>
                        <FontAwesomeIcon icon={editIcon} />
                    </button>
                    {rowActions?.(row)}
                </div>
            ),
        },
        ...columns,
    ];

    function close(reload?: boolean) {
        if (reload) onReload();
        setEdit(-1);
    }

    return (
        <div className={styles.container}>
            <h4>{title}</h4>
            {filters && <div className={styles.filters}>{filters}</div>}
            <div className={styles.toolbar}>
                <InputGroup width={'50%'} placeholder={'Filtro'} title={'Pesquisar'} value={search} onChange={e => setSearch(e.target.value)} />
                {newLabel && <CustomButton typeButton={'dark'} onClick={() => setEdit(0)}>{newLabel}</CustomButton>}
                {typeof extraActions === 'function' ? extraActions(filtered) : extraActions}
            </div>
            {summary && <div className={styles.summary}>{summary}</div>}
            {isMobile
                ? filtered.map(row => (
                    <div key={row.id} className={styles.card} onClick={() => setEdit(row.id)}>{renderCard(row)}</div>
                ))
                : <KRDTable columns={allColumns} data={filtered} loading={loading} />}
            {edit >= 0 && renderModal(edit, close)}
        </div>
    );
}
