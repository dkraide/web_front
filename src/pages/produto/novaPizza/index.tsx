import { Tab, Tabs } from 'react-bootstrap';
import styles from './styles.module.scss';
import { useEffect, useState } from 'react';
import IProduto from '@/interfaces/IProduto';
import IProdutoGrupo from '@/interfaces/IProdutoGrupo';
import { IProdutoGrupoItem } from '@/interfaces/IProdutoGrupoItem';
import _ from 'lodash';
import { InputGroup } from '@/components/ui/InputGroup';
import { v4 as uuidv4 } from 'uuid';


export default function NovaPiza(){

    const [pizza, setPizza] = useState<IProduto>();


    useEffect(() => {
        var newProd = {
            id: 0,
            nome: '',
            grupoAdicionais: []

        } as IProduto;

        var massa = {
            tipo: 'MASSA',
            itens: [{
                id: uuidv4(),
                nome: 'Tradicional',
                status: true,
                valor: 0,
            } as IProdutoGrupoItem]

        } as IProdutoGrupo;
        var tamanho = {
            tipo: 'TAMANHO',
            itens: [{
                id: uuidv4(),
                nome: 'Pequena',
                status: true,
                valor: 0,
                qtdSabores: 2
            } as IProdutoGrupoItem,
            {
                id: uuidv4(),
                nome: 'Média',
                status: true,
                valor: 0,
                qtdSabores: 2
            } as IProdutoGrupoItem,
            {
                id: uuidv4(),
                nome: 'Grande',
                status: true,
                valor: 0,
                qtdSabores: 2
            } as IProdutoGrupoItem]

        } as IProdutoGrupo;
        var borda = {
            tipo: 'BORDA',
            itens: [{
                id: uuidv4(),
                nome: 'Tradicional',
                status: true,
                valor: 0,
            } as IProdutoGrupoItem]

        } as IProdutoGrupo;
        var sabor = {
            tipo: 'SABOR',
        } as IProdutoGrupo;

        newProd.grupoAdicionais.push(massa);
        newProd.grupoAdicionais.push(tamanho);
        newProd.grupoAdicionais.push(borda);
        newProd.grupoAdicionais.push(sabor);
        console.log(newProd);
        setPizza(newProd)
    }, []);




    if(!pizza || !pizza.grupoAdicionais){
        return <></>
    }

    const onChangeText = (item: IProdutoGrupoItem, newValue: string, tipoGrupo: string, field: string) => {
         var indexGrupo = _.findIndex(pizza.grupoAdicionais, p => p.tipo == tipoGrupo);
         var indexItem = _.findIndex(pizza.grupoAdicionais[indexGrupo].itens, p => p.id == item.id);
         pizza.grupoAdicionais[indexGrupo].itens[indexItem][field] = newValue;
         setPizza({...pizza});
    }

    const ItemTamanho =(item: IProdutoGrupoItem) =>{
        return(
            <div className={styles.row}>
                <InputGroup width='30%' title='Nome do tamanho' value={item.nome} onChange={(e) => {
                    onChangeText(item, e.currentTarget.value, 'TAMANHO', 'nome')
                    }}/>
                <InputGroup type={'number'}  width='30%' title='Qtd. pedaços' value={item.qtdSabores}  onChange={(e) => {onChangeText(item, e.currentTarget.value, 'TAMANHO', 'qtdSabores')}}/>
            </div>
        )
    }

    const ItemMassa = (item: IProdutoGrupoItem) => {
        return(
            <div className={styles.row}>
                <InputGroup width='30%' title='Nome' value={item.nome}/>
                <InputGroup width='30%' title='Preco' value={item.valor}/>
                <input  type='checkbox'/>
            </div>
        )
    }


    const getItems = (value: string) => {
        var res = [] as IProdutoGrupoItem[];
        var index =  _.findIndex(pizza.grupoAdicionais, p => p.tipo == value);
        res = pizza.grupoAdicionais[index].itens;
        return res;
    }


    return(
        <div className={styles.container}>
            <h3>Nova Pizza</h3>
            <Tabs
                        defaultActiveKey="produto"
                        id="uncontrolled-tab-example"
                        variant={'underline'}
                        justify={false}
                        fill
                    >
                        <Tab color={'red'} eventKey="produto" title="Detalhes">
                            <div className={styles.content}>
                            </div>
                        </Tab>
                        <Tab eventKey="tamanho" title="Tamanho">
                            <div className="row">
                              {getItems('TAMANHO').map((item)=> <ItemTamanho{...item}/>)}
                            </div>
                        </Tab>
                        <Tab eventKey="massa" title="Massa">
                            <div className="row">
                            {getItems('MASSA').map((item) => <ItemMassa {...item}/>)}
                            </div>
                        </Tab>
                        <Tab eventKey="borda" title="Borda">
                            <div className="row">
                                {getItems('BORDA').map((item)=><ItemMassa{...item}/>)}
                            </div>
                        </Tab>
                        <Tab eventKey="sabor" title="Sabor">
                            <div className="row">
                            </div>
                        </Tab>
                    </Tabs>


        </div>
    )


}