import BaseModal from '@/components/Modals/Base/Index';
import styles from './styles.module.scss';
import IProdutoGrupo from '@/interfaces/IProdutoGrupo';
import { useEffect, useState } from 'react';
import { InputGroup } from '@/components/ui/InputGroup';
import Switch from "react-switch";
import { IProdutoGrupoItem } from '@/interfaces/IProdutoGrupoItem';
import CustomButton from '@/components/ui/Buttons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import _ from 'lodash';
import { v4 as uuidv4 } from 'uuid';
import SelectMateriaPrima from '@/components/Selects/SelectMateriaPrima';
import IMateriaPrima from '@/interfaces/IMateriaPrima';

type props = {
    isOpen: boolean
    setClose: (res?) => void
    grupoEditado?: IProdutoGrupo
}

export default function NovoGrupo({ isOpen, setClose, grupoEditado }: props) {
    const [grupo, setGrupo] = useState<IProdutoGrupo>()

    useEffect(() => {
        if (grupoEditado) {
            console.log(grupoEditado);
            setGrupo(grupoEditado);
        } else {
            var newGrupo = {
                idProdutoGrupo: 0,
                id: 0,
                idProduto: 0,
                produtoId: 0,
                empresaId: 0,
                produto: {} as any, // Ajuste conforme sua implementação de IProduto
                tipo: 'PADRAO',
                descricao: 'Novo grupo',
                status: true,
                minimo: 0,
                maximo: 1,
                itens: [],
            } as IProdutoGrupo;
            setGrupo(newGrupo);
        }
    }, []);



    if (!grupo) {
        return <></>
    }

    const Item = (item: IProdutoGrupoItem) => {

        const handleChangeValue = (newValue, field) => {
            var indexItem = _.findIndex(grupo.itens, p => p.id == item.id);
            grupo.itens[indexItem][field] = newValue;
            setGrupo({ ...grupo });
        }
        const handleMateriaPrimaChanged = (m: IMateriaPrima) => {
            var indexItem = _.findIndex(grupo.itens, p => p.id == item.id);
            grupo.itens[indexItem].materiaPrimaId = m.id;
            grupo.itens[indexItem].idMateriaPrima = m.idMateriaPrima;
            grupo.itens[indexItem].nome = m.nome;
            grupo.itens[indexItem].valor = m.valorVenda;
            setGrupo({ ...grupo });
        }

        const handleRemove = () => {
            var indexItem = _.findIndex(grupo.itens, p => p.id == item.id);
            grupo.itens.splice(indexItem, 1);
            setGrupo({ ...grupo });
        }

        return (
            <div className={styles.grupo} key={item.id}>
                <SelectMateriaPrima width={'35%'} selected={item.materiaPrimaId} setSelected={handleMateriaPrimaChanged} />
                <InputGroup width={'35%'} title={'Nome'} value={item.nome} onChange={({ currentTarget }) => { handleChangeValue(currentTarget.value, 'nome') }} />
                <InputGroup type={'number'} width={'15%'} title={'Valor'} value={item.valor} onChange={({ currentTarget }) => { handleChangeValue(currentTarget.value, 'valor') }} />
                <Switch onColor={'#fc4f6b'} onChange={(e) => { handleChangeValue(e, 'status') }} checked={item.status} />
                <CustomButton onClick={handleRemove} style={{ marginLeft: 10, height: 40, width: 40 }} typeButton={'outline-main'}><FontAwesomeIcon icon={faTrash} /></CustomButton>
            </div>
        )

    }

    const handleNewItem = () => {
        var item = {
            id: uuidv4(),
            idProdutoGrupo: grupo.idProdutoGrupo,
            idProdutoGrupoItem: undefined,
            produtoGrupoId: grupo.id,
            materiaPrima: undefined,
            idMateriaPrima: 0,
            materiaPrimaId: 0,
            nome: '',
            descricao: '',
            valor: 0,
            qtdSabores: 0,
            status: true,
            precos: []
        } as IProdutoGrupoItem;
        if (!grupo.itens) {
            grupo.itens = [];
        }
        grupo.itens.push(item);
        setGrupo({ ...grupo })
    }
    return (
        <BaseModal isOpen={isOpen} title={'Novo grupo de complementos'} setClose={setClose}>
            <div className={styles.container}>
                <div className={styles.grupo}>
                    <h3>Detalhes</h3>
                    <InputGroup width={'90%'} title={'Descricao'} value={grupo.descricao} onChange={({ currentTarget }) => { setGrupo({ ...grupo, descricao: currentTarget.value }) }} />
                    <Switch onColor={'#fc4f6b'} onChange={(e) => { setGrupo({ ...grupo, status: e }) }} checked={grupo.status} />
                    <InputGroup type={'number'} width={'40%'} title={'Minimo'} value={grupo.minimo} onChange={({ currentTarget }) => { setGrupo({ ...grupo, minimo: parseInt(currentTarget.value) }) }} />
                    <InputGroup type={'number'} width={'40%'} title={'Maximo'} value={grupo.maximo} onChange={({ currentTarget }) => { setGrupo({ ...grupo, maximo: parseInt(currentTarget.value) }) }} />
                </div>
                <hr />
                <div className={styles.itens}>
                    <h3>Complementos</h3>
                    {grupo?.itens?.map((item) => Item(item))}
                    <CustomButton onClick={handleNewItem}>Novo Item</CustomButton>
                </div>
                <hr />
                <div className={styles.buttons}>
                    <CustomButton onClick={() => { setClose(); }} typeButton={"secondary"}>Cancelar</CustomButton>
                    <CustomButton typeButton={'dark'} onClick={() => { setClose(grupo) }}>Confirmar</CustomButton>

                </div>
            </div>

        </BaseModal>
    )
}
