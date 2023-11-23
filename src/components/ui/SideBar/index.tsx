import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import styles from './styles.module.scss';
import { useContext, useEffect, useState } from 'react';
import { faUser, faArrowLeft, faBars, faRightFromBracket, faLeaf, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { AuthContext } from '@/contexts/AuthContext';
import IUsuario from '@/interfaces/IUsuario';
import Link from 'next/link';
import { api } from '@/services/apiClient';
import { AxiosError, AxiosResponse } from 'axios';
import { toast } from 'react-toastify';
import SelectEmpresa from '@/components/Selects/SelectEmpresa';
import { Menu, MenuItem, Sidebar, SubMenu } from 'react-pro-sidebar';
import CustomButton from '../Buttons';

export default function SideBar({ ...props }) {

    const [user, setUser] = useState<IUsuario | undefined>();
    const [empresa, setEmpresa] = useState(0);
    const [collapsed, setCollapsed] = useState(false);
    const test = async () => {
        var u = await getUser();
        if (u) {
            setUser(u);
            setEmpresa(u.empresaSelecionada);
        }
    }
    useEffect(() => {
        test();
    }, []);
    const { getUser, signOut, updateUser } = useContext(AuthContext);
    function forceClose() {
        var menu = document.getElementById("sideBar_krd");
        menu?.classList.remove(styles.activeMenu);
    }
    async function updateEmpresa(EmpresaId) {
        if (EmpresaId == user.empresaSelecionada) {
            return;
        }
        await api.put(`/Empresa/SetEmpresa?EmpresaId=${EmpresaId}`)
            .then(({ data }: AxiosResponse) => {
                updateUser(data);
                window.location.reload();
            }).catch((err: AxiosError) => {
                toast.error(`Erro ao atualizar empresa. ${err.response?.data || err.message}`);
            })
    }
    if (!user) {
        return <>
            <main  {...props} className={styles.mainOff} onClick={() => forceClose()}>

            </main>
        </>
    }

    const menuItemStyle = {
        background: 'rgb(5,98,180, 0.35)',
        "&:hover": {
            background: '#fff !important',
        },
    }
    const textcolor = '#039bda';
    return (
        <div style={{ display: 'flex', height: '100vh', minHeight: '100% !important' }}>
            <Sidebar collapsed={collapsed} rootStyles={{
                backgroundColor: 'rgb(5,98,180)',

                background: 'linear-gradient(180deg, rgba(4,113,190,1) 17%, rgba(3,135,205,1) 52%, rgba(3,155,218,1) 79%, rgba(0,212,255,1) 100%);',
            }}>

                <Menu rootStyles={{
                    height: '100%', '& ul': {
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column'
                    }
                }}>
                    <div>
                        <div className={styles.header}>
                            <div style={{ width: '80%', display: collapsed ? 'none' : 'block', padding: '5px 5px 0px 0px' }}>
                                <a href={'/dashboard'}><h4  style={{ color: textcolor, fontWeight: 'bold'}}>KRD System</h4></a>
                            </div>
                            <div className={styles.openClose}>
                                <a onClick={() => { setCollapsed(!collapsed) }}>
                                    <FontAwesomeIcon color={textcolor} icon={!collapsed ? faArrowLeft : faArrowRight} size={'2x'}></FontAwesomeIcon>
                                </a>
                            </div>
                        </div>
                        <div style={{ display: collapsed ? 'none' : 'block', padding: '0px 5px' }} >
                            <SelectEmpresa selected={empresa} setSelected={updateEmpresa} />
                        </div>
                    </div>
                    <div style={{ flex: 1 }}>
                        <SubMenu icon={<FontAwesomeIcon icon={faUser} color={textcolor} />} {...props} label="Produtos">
                            <MenuItem href={'/produto'} style={menuItemStyle}>Produtos</MenuItem>
                            <MenuItem href={'/classeMaterial'} style={menuItemStyle}>Classes</MenuItem>
                            <MenuItem href={'/tributacao'} style={menuItemStyle}>Tributacoes</MenuItem>
                            <MenuItem href={'/estoque'} style={menuItemStyle}>Estoque</MenuItem>
                            <MenuItem href={'/estoqueLancamento'} style={menuItemStyle}>Lancamento de Estoque</MenuItem>
                        </SubMenu>
                        <SubMenu icon={<FontAwesomeIcon icon={faUser} color={textcolor} />} label="Promocoes">
                            <MenuItem href={'/promocao/atacado'} style={menuItemStyle}> Promocao</MenuItem>
                            <MenuItem href={'/promocao/combo'} style={menuItemStyle}> Combos</MenuItem>
                            <MenuItem href={'/promocao/tabelaPreco'} style={menuItemStyle}> Tabela de Preco</MenuItem>
                        </SubMenu>
                        <SubMenu icon={<FontAwesomeIcon icon={faUser} color={textcolor} />} label="Financeiro">
                            <MenuItem href={'/motivoLancamento'} style={menuItemStyle}>Motivo de Lancamento</MenuItem>
                            <MenuItem href={'/despesa'} style={menuItemStyle}>Despesas</MenuItem>
                            <MenuItem href={'/entrada'} style={menuItemStyle}>Entradas</MenuItem>
                        </SubMenu>
                        <SubMenu icon={<FontAwesomeIcon icon={faUser} color={textcolor} />} label="Vendas">
                            <MenuItem href={'/movimentoCaixa'} style={menuItemStyle}>Caixas</MenuItem>
                            <MenuItem href={'/venda'} style={menuItemStyle}>Vendas</MenuItem>
                            <MenuItem href={'/arquivosxml'} style={menuItemStyle}>Arquivos XML</MenuItem>
                        </SubMenu>
                        <SubMenu icon={<FontAwesomeIcon icon={faUser} color={textcolor} />} label="Relatorios">
                            <MenuItem href={'/relatorio/classe'} style={menuItemStyle}>Por Classe</MenuItem>
                            <MenuItem href={'/relatorio/dia'} style={menuItemStyle}>Por Dia</MenuItem>
                            <MenuItem href={'/relatorio/formaPagamento'} style={menuItemStyle}>Por Forma</MenuItem>
                            <MenuItem href={'/relatorio/produto'} style={menuItemStyle}>Por Produto</MenuItem>
                            <MenuItem href={'/relatorio/usuario'} style={menuItemStyle}>Por Usuiario</MenuItem>
                            <MenuItem href={'/relatorio/demonstrativo'} style={menuItemStyle}>Demonstrativo</MenuItem>
                        </SubMenu>
                        <SubMenu icon={<FontAwesomeIcon icon={faUser} color={textcolor} />} label="Menu Digital">
                            <MenuItem href={'/menudigital/produtos'} style={menuItemStyle}>Produtos</MenuItem>
                            <MenuItem href={'/menudigital/categorias'} style={menuItemStyle}>Categorias</MenuItem>
                            <MenuItem href={'/menudigital/promocoes'} style={menuItemStyle}>Promocoes</MenuItem>
                            <MenuItem href={'/menudigital/combos'} style={menuItemStyle}>Combos</MenuItem>
                            <MenuItem href={'/menudigital/configuracao'} style={menuItemStyle}>Configuracao</MenuItem>
                            <MenuItem href={'/menudigital/empresa'} style={menuItemStyle}>Empresa</MenuItem>
                        </SubMenu>
                    </div>
                    <div>
                        <MenuItem rootStyles={{textAlign: 'center'}}  onClick={() => { signOut() }} style={menuItemStyle}>Sair</MenuItem>
                    </div>


                </Menu>
            </Sidebar>
            <main  {...props} className={styles.main} onClick={() => forceClose()}>
            </main>
        </div>
    )
}
