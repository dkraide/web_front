import { Tab, Tabs } from 'react-bootstrap';
import styles from './styles.module.scss';
import { useEffect, useState } from 'react';
import IProduto from '@/interfaces/IProduto';
import IProdutoGrupo from '@/interfaces/IProdutoGrupo';
import { IProdutoGrupoItem } from '@/interfaces/IProdutoGrupoItem';
import _ from 'lodash';
import { InputGroup } from '@/components/ui/InputGroup';

export default function NovaPiza(){

    const [pizza, setPizza] = useState<IProduto>();


    useEffect(() => {
        var newProd = {
            nome: '',
            grupoAdicionais: []

        } as IProduto;

        var massa = {
            tipo: 'MASSA',
            itens: [{
                nome: 'Tradicional',
                status: true,
                valor: 0,
            } as IProdutoGrupoItem]

        } as IProdutoGrupo;
        var tamanho = {
            tipo: 'TAMANHO',
            itens: [{
                nome: 'Pequena',
                status: true,
                valor: 0,
                qtdSabores: 2
            } as IProdutoGrupoItem,
            {
                nome: 'Media',
                status: true,
                valor: 0,
                qtdSabores: 2
            } as IProdutoGrupoItem,
            {
                nome: 'Grande',
                status: true,
                valor: 0,
                qtdSabores: 2
            } as IProdutoGrupoItem]

        } as IProdutoGrupo;
        var borda = {
            tipo: 'BORDA',
            itens: [{
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
        setPizza(newProd)
    }, []);




    if(!pizza || !pizza.grupoAdicionais){
        return <></>
    }

    const ItemTamanho =(item: IProdutoGrupoItem) =>{
        return(
            <div className={styles.row}>
                <InputGroup width='30%' title='Nome do tamanho' value={item.nome}/>
                <InputGroup width='30%' title='Qtd. pedaços' value={item.valor}/>
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