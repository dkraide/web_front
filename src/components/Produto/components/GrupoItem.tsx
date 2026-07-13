import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import CustomButton from '@/components/ui/Buttons';
import IProdutoGrupoAdicional from '@/interfaces/IProdutoGrupoAdicional';
import styles from '../styles.module.scss';

interface GrupoItemProps {
    vinculo: IProdutoGrupoAdicional;
    onEdit: () => void;
    onDelete?: () => void;
}

export default function GrupoItem({ vinculo, onEdit, onDelete }: GrupoItemProps) {
    const grupo = vinculo.grupoAdicional;

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation(); // Evita que dispare o onEdit
        if (onDelete) {
            onDelete();
        }
    };

    if (!grupo) {
        return null;
    }

    return (
        <div onClick={onEdit} className={styles.grupo}>
            <div style={{ width: '90%', display: 'flex', flexDirection: 'row' }}>
                <div style={{ width: '70%' }}>
                    <h5>{grupo.descricao}</h5>
                    <b>
                        Min: {grupo.minimo} Max: {grupo.maximo}
                    </b>
                </div>
                <div style={{ width: '30%', display: 'flex', flexDirection: 'column' }}>
                    <span>{grupo.status ? 'Ativo' : 'Pausado'}</span>
                    <span>{grupo.itens?.length ?? 0} itens</span>
                </div>
            </div>
            <div style={{ width: '10%' }}>
                <CustomButton onClick={handleDelete}>
                    <FontAwesomeIcon icon={faTrash} />
                </CustomButton>
            </div>
        </div>
    );
}