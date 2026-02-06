import CustomButton from '@/components/ui/Buttons';
import IProdutoMateriaPrima from '@/interfaces/IProdutoMateriaPrima';
import IProdutoGrupo from '@/interfaces/IProdutoGrupo';
import MateriaPrimaItem from './MateriaPrimaItem';
import GrupoItem from './GrupoItem';
import styles from '../styles.module.scss';

interface ProdutoGruposProps {
    materiaPrimas?: IProdutoMateriaPrima[];
    grupoAdicionais?: IProdutoGrupo[];
    onAddMateriaPrima: () => void;
    onRemoveMateriaPrima: (materiaPrimaId: number) => void;
    onAddGrupo: () => void;
    onEditGrupo: (index: number) => void;
    onDeleteGrupo: (index: number) => void;
}

export default function ProdutoGrupos({
    materiaPrimas,
    grupoAdicionais,
    onAddMateriaPrima,
    onRemoveMateriaPrima,
    onAddGrupo,
    onEditGrupo,
    onDeleteGrupo,
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

            <div style={{width: '50%' }} className={styles.contentTab}>
                <b>Grupos de Adicionais</b>
                <div className={styles.buttons}>
                    <CustomButton onClick={onAddGrupo}>Novo grupo de complementos</CustomButton>
                </div>
                <hr />
                {grupoAdicionais?.map((grupo, index) => (
                    <GrupoItem 
                        key={index} 
                        grupo={grupo} 
                        onEdit={() => onEditGrupo(index)}
                        onDelete={() => onDeleteGrupo(index)}
                    />
                ))}
            </div>
        </div>
    );
}