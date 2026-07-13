import CustomButton from '@/components/ui/Buttons';
import IProdutoMateriaPrima from '@/interfaces/IProdutoMateriaPrima';
import IProdutoGrupoAdicional from '@/interfaces/IProdutoGrupoAdicional';
import MateriaPrimaItem from './MateriaPrimaItem';
import GrupoItem from './GrupoItem';
import styles from '../styles.module.scss';

interface ProdutoGruposProps {
    materiaPrimas?: IProdutoMateriaPrima[];
    grupoAdicionais?: IProdutoGrupoAdicional[];
    onAddMateriaPrima: () => void;
    onRemoveMateriaPrima: (materiaPrimaId: number) => void;
    onVincularGrupo: () => void;
    onEditGrupo: (vinculo: IProdutoGrupoAdicional) => void;
    onDeleteGrupo: (index: number) => void;
}

export default function ProdutoGrupos({
    materiaPrimas,
    grupoAdicionais,
    onAddMateriaPrima,
    onRemoveMateriaPrima,
    onEditGrupo,
    onDeleteGrupo,
    onVincularGrupo
}: ProdutoGruposProps) {
    return (
        <div className={styles.row}>
            <div style={{ width: '50%' }} className={styles.contentTab}>
                <b>Ingredientes</b>
                <div className={styles.buttons}>
                    <CustomButton onClick={onAddMateriaPrima}>Vincular Ingrediente</CustomButton>
                </div>
                <hr />
                {materiaPrimas?.map((item, index) => (
                    <MateriaPrimaItem
                        key={index}
                        item={item}
                        onRemove={() => onRemoveMateriaPrima(item.materiaPrimaId)}
                    />
                ))}
            </div>

            <div style={{ width: '50%' }} className={styles.contentTab}>
                <b>Grupos de Adicionais</b>
                <div className={styles.buttons}>
                    <CustomButton onClick={onVincularGrupo}>Vincular grupo existente</CustomButton>
                </div>
                <hr />
                {grupoAdicionais?.map((vinculo, index) => (
                    <GrupoItem
                        key={index}
                        vinculo={vinculo}
                        onEdit={() => onEditGrupo(vinculo)}
                        onDelete={() => onDeleteGrupo(index)}
                    />
                ))}
            </div>
        </div>
    );
}