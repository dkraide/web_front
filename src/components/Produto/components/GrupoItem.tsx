import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import CustomButton from '@/components/ui/Buttons';
import IProdutoGrupo from '@/interfaces/IProdutoGrupo';
import styles from '../styles.module.scss';

interface GrupoItemProps {
    grupo: IProdutoGrupo;
    onEdit: () => void;
    onDelete?: () => void;
}

export default function GrupoItem({ grupo, onEdit, onDelete }: GrupoItemProps) {
    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation(); // Evita que dispare o onEdit
        if (onDelete) {
            onDelete();
        }
    };

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