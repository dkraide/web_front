import IProdutoGrupo from '@/interfaces/IProdutoGrupo';
import styles from './styles.module.scss';
import { useEffect, useState } from 'react';
import { api } from '@/services/apiClient';
import { AxiosResponse } from 'axios';
import BaseModal from '../../Base/Index';
import { v4 as uuidv4 } from 'uuid';

type props = {
    setClose: (grupo?: IProdutoGrupo) => void;
    produtoId: number;
    empresa: number;
};

const TIPO_LABELS: Record<string, string> = {
    PADRAO: 'Padrão',
    BORDA: 'Borda',
    TAMANHO: 'Tamanho',
    SABOR: 'Sabor',
    MASSA: 'Massa',
};

export default function SelectProdutoGrupo({ produtoId, setClose, empresa }: props) {
    const [grupos, setGrupos] = useState<IProdutoGrupo[]>([]);
    const [filtered, setFiltered] = useState<IProdutoGrupo[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState<IProdutoGrupo | null>(null);

    const loadData = async () => {
        setLoading(true);
        await api
            .get(`/v2/ProdutoGrupo/List/${empresa}`)
            .then(({ data }: AxiosResponse<IProdutoGrupo[]>) => {
                if (!data) return;
                const items = data.filter(
                    (p) => p.produtoId !== produtoId && p.tipo === 'PADRAO'
                );
                setGrupos(items);
                setFiltered(items);
            });
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        const q = search.toLowerCase().trim();
        if (!q) {
            setFiltered(grupos);
        } else {
            setFiltered(
                grupos.filter((g) => g.descricao?.toLowerCase().includes(q))
            );
        }
    }, [search, grupos]);

    const handleSelectGrupo = (grupo: IProdutoGrupo) => {
        const clone: IProdutoGrupo = {
            ...grupo,
            id: 0,
            produtoId: 0,
            itens: grupo.itens?.map((item) => ({
                ...item,
                id: uuidv4(),
                idProdutoGrupoItem: undefined
            })),
        };
        setClose(clone);
    };

    return (
        <BaseModal title="Selecione um grupo" isOpen={true} setClose={setClose}>
            <div className={styles.container}>
                {/* Search */}
                <div className={styles.searchWrapper}>
                    <span className={styles.searchIcon}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8" />
                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                    </span>
                    <input
                        className={styles.searchInput}
                        type="text"
                        placeholder="Buscar grupo..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        autoFocus
                    />
                    {search && (
                        <button className={styles.clearBtn} onClick={() => setSearch('')}>
                            ✕
                        </button>
                    )}
                </div>

                {/* Content */}
                {loading ? (
                    <div className={styles.loadingState}>
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className={styles.skeleton} />
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className={styles.emptyState}>
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                        <p>Nenhum grupo encontrado</p>
                    </div>
                ) : (
                    <ul className={styles.list}>
                        {filtered.map((grupo) => (
                            <li
                                key={grupo.idProdutoGrupo}
                                className={`${styles.listItem} ${selected?.idProdutoGrupo === grupo.idProdutoGrupo ? styles.listItemSelected : ''}`}
                                onClick={() => setSelected(grupo)}
                                onDoubleClick={() => handleSelectGrupo(grupo)}
                            >
                                <div className={styles.itemMain}>
                                    <span className={styles.itemName}>{grupo.descricao}</span>
                                    <span className={`${styles.tipoBadge} ${styles[`tipo_${grupo.tipo}`]}`}>
                                        {TIPO_LABELS[grupo.tipo] ?? grupo.tipo}
                                    </span>
                                </div>
                                <div className={styles.itemMeta}>
                                    <span className={styles.metaInfo}>
                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <rect x="3" y="3" width="18" height="18" rx="2" />
                                            <path d="M3 9h18M9 21V9" />
                                        </svg>
                                        {grupo.itens?.length ?? 0} {grupo.itens?.length === 1 ? 'item' : 'itens'}
                                    </span>
                                    <span className={styles.metaInfo}>
                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                        </svg>
                                        Min: {grupo.minimo} / Max: {grupo.maximo}
                                    </span>
                                    <span className={`${styles.statusBadge} ${grupo.status ? styles.statusActive : styles.statusInactive}`}>
                                        {grupo.status ? 'Ativo' : 'Inativo'}
                                    </span>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}

                {/* Footer */}
                <div className={styles.footer}>
                    <span className={styles.counter}>
                        {filtered.length} grupo{filtered.length !== 1 ? 's' : ''}
                    </span>
                    <div className={styles.footerActions}>
                        <button className={styles.btnCancel} onClick={() => setClose(undefined)}>
                            Cancelar
                        </button>
                        <button
                            className={styles.btnConfirm}
                            disabled={!selected}
                            onClick={() => selected && handleSelectGrupo(selected)}
                        >
                            Selecionar
                        </button>
                    </div>
                </div>
            </div>
        </BaseModal>
    );
}