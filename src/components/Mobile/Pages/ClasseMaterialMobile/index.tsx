import IClasseMaterial from '@/interfaces/IClasseMaterial';
import styles from './styles.module.scss';
import { useEffect, useState } from 'react';
import PictureBox from '@/components/ui/PictureBox';
import { InputGroup } from '@/components/ui/InputGroup';
import CustomButton from '@/components/ui/Buttons';
import ClasseForm from '@/components/Modals/ClasseMaterial/CreateEditForm';
import IUsuario from '@/interfaces/IUsuario';

type props = {
    list: IClasseMaterial[]
    loadData: () => void
    user: IUsuario
}

export default function ClasseMaterialMobile({ list, loadData, user }: props) {
    const [items, setItems] = useState<IClasseMaterial[]>([]);
    const [search, setSearch] = useState('');
    const [edit, setEdit] = useState(-1);

    useEffect(() => {
        if (!list) {
            return;
        }
        var filtered = list.filter((item) => {
            var str = `${item.idClasseMaterial} ${item.nomeClasse}`.toUpperCase();
            return str.includes(search?.toUpperCase());
        })
        setItems(filtered);
    }, [list, search])
    const Item = (item: IClasseMaterial) => {
        return (
            <div className={styles.card} onClick={() => {setEdit(item.id)}}>
                <div className={styles.pic}>
                    <PictureBox height={'90%'} size={'100%'} url={item.localPath} />
                </div>
                <div className={styles.desc}>
                    <span className={styles.cod}>{item.idClasseMaterial}</span>
                    <span className={styles.nome}>{item.nomeClasse}</span>
                    <span className={item.status ? styles.ativo : styles.inativo}>{item.status ? 'ATIVO' : 'INATIVO'}</span>
                </div>

            </div>
        )
    }




    return (
        <div className={styles.container}>
            <h4>Grupos de Materiais</h4>
            <div className={styles.buttons}>
                <CustomButton onClick={() => {setEdit(0)}}>Novo Grupo</CustomButton>
            </div>
            <hr />
            <InputGroup title={'Pesquisar'} value={search} onChange={(v) => { setSearch(v.currentTarget.value) }} />
            {items?.map((item) => Item(item))}
            {(edit >= 0) && <ClasseForm user={user} isOpen={edit >= 0} classeId={edit} setClose={(v) => {
                if (v) {
                    loadData();
                }
                setEdit(-1);
            }} />}
        </div>

    )

}