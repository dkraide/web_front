import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import styles from './styles.module.scss';
import { useContext, useEffect, useState } from 'react';
import { faBars, faChartSimple, faMoneyBill, faCalculator, faPercent, faBox, faCashRegister, faUtensils, faPowerOff, faUser } from '@fortawesome/free-solid-svg-icons';
import { AuthContext } from '@/contexts/AuthContext';
import IUsuario from '@/interfaces/IUsuario';
import { api } from '@/services/apiClient';
import { AxiosError, AxiosResponse } from 'axios';
import { toast } from 'react-toastify';
import SelectEmpresa from '@/components/Selects/SelectEmpresa';
import { Menu, MenuItem, Sidebar, SubMenu } from 'react-pro-sidebar';
import CustomButton from '../Buttons';
import Image from 'next/image';
import { useWindowSize } from 'rooks';
import { Badge } from 'react-bootstrap';

export default function SideBar({ ...props }) {

    const [user, setUser] = useState<IUsuario | undefined>();
    const [empresa, setEmpresa] = useState(0);
    const [collapsed, setCollapsed] = useState(false);
    const [toggled, setToggled] = useState(false);
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
    const { innerWidth } = useWindowSize();
    const isMobile = innerWidth < 600;
    const { getUser, signOut, updateUser } = useContext(AuthContext);
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
            <main  {...props}>

            </main>
        </>
    }
    const subMenuStyle = {
        ['& > a']: {
            '&:hover': {
                backgroundColor: 'black'
            },
            '.ps-open': {
                fontWeight: 'bold',
            },
        },
    }

    function bgNew() {
        return <Badge bg="success" style={{ fontSize: '9px' }}>NOVO</Badge>
    }


    return (
        <div className={"container-scroller"}>
            <nav className={[styles["navbar"], styles["default-layout-navbar"], styles["col-lg-12"], styles["p-0"], styles["fixed-top"], styles["d-flex"], styles["flex-row"]].join(' ')}>
                {(collapsed || isMobile) ? <>
                    <a href={'/dashboard'} className={styles.center} style={{ width: '40px', cursor: 'pointer' }}>
                        <Image src={'/krd_logo_icon.png'} alt={'krd'} width={35} height={35} />
                    </a>
                </> : <>
                    <a href={'/dashboard'} className={styles.center} style={{ width: '250px', cursor: 'pointer' }}>
                        <Image src={'/krd_logo.png'} alt={'krd'} width={160} height={60} />
                    </a>
                </>}
                <div hidden={user?.isContador}>
                    <a className={styles["menu-btn"]} onClick={() => { setCollapsed(!collapsed); setToggled(!toggled) }}><FontAwesomeIcon color={'var(--main)'} icon={faBars} /></a>
                </div>
                <div style={{ marginLeft: 'auto', marginRight: 'auto', padding: '5px' }}>
                    <SelectEmpresa isContador={user.isContador} width={'250px'} selected={user.empresaSelecionada} setSelected={(v) => {
                        updateEmpresa(v);
                    }} />
                </div>
                <div hidden={innerWidth <= 700} style={{ justifyContent: 'flex-end', marginRight: '10px', display: 'flex', flexDirection: 'row' }}>
                    <span style={{ marginRight: '10px' }}>Bem Vindo, <br /><b><a href={'/me'}>{user.nome}</a></b></span>
                    <a className={styles["menu-btn"]} onClick={signOut}><FontAwesomeIcon icon={faPowerOff} color={'var(--main)'} /></a>
                </div>
            </nav>
            <div className={[styles["container-fluid"], styles["page-body-wrapper"]].join(' ')}>
                <Sidebar
                    hidden={user?.isContador}
                    customBreakPoint={"600px"}
                    className={styles.sideBar}
                    onBackdropClick={() => setToggled(false)}
                    toggled={toggled}
                    collapsed={collapsed && !isMobile}>
                    <Menu rootStyles={{
                        background: 'white',
                        flex: '1',
                        height: '100%',
                        paddingTop: innerWidth < 700 ? '70px' : '0',
                    }} >
                        {user.isPdv ? (
                            <div>
                                <SubMenu rootStyles={subMenuStyle} href={'/pdv'} icon={<FontAwesomeIcon icon={faCashRegister} color={'var(--main)'} />} label="PDV">
                                </SubMenu>
                            </div>
                        ) : (
                            <div>
                                <div
                                    hidden={innerWidth > 700}
                                    style={{
                                        padding: '10px 20px',
                                        display: 'flex',
                                        flexDirection: 'row',
                                        flexWrap: 'wrap',
                                        justifyContent: 'space-between'
                                    }}>
                                    <span>Bem Vindo, <br /><b><a href={'/me'}>{user.nome}</a></b></span>
                                    <a className={styles["menu-btn"]} onClick={signOut}><FontAwesomeIcon icon={faPowerOff} color={'var(--main)'} /></a>
                                </div>
                                <SubMenu icon={<FontAwesomeIcon icon={faBox} color={'var(--main)'} />} label="Produtos"
                                    rootStyles={subMenuStyle}>
                                    <MenuItem href={'/produto'}>Produtos</MenuItem>
                                    <MenuItem href={'/classeMaterial'}>Classes</MenuItem>
                                    <MenuItem href={'/tributacao'}>Tributacoes</MenuItem>
                                    <MenuItem href={'/estoque'}>Estoque</MenuItem>
                                    <MenuItem href={'/estoqueLancamento'}>Lancamento de Estoque</MenuItem>
                                    <MenuItem href={'/estoque/conferenciaEstoque'}>Conferência</MenuItem>
                                </SubMenu>
                                <SubMenu icon={<FontAwesomeIcon icon={faBox} color={'var(--main)'} />} label="Ingredientes"
                                    rootStyles={subMenuStyle}>
                                    <MenuItem href={'/ingredientes'}>Ingredientes</MenuItem>
                                    <MenuItem href={'/ingredientes/estoque'}>Estoque</MenuItem>
                                </SubMenu>
                                <SubMenu rootStyles={subMenuStyle} icon={<FontAwesomeIcon icon={faPercent} color={'var(--main)'} />} label="Promocoes">
                                    <MenuItem href={'/promocao/atacado'}> Promocao</MenuItem>
                                    <MenuItem href={'/promocao/combo'}> Combos</MenuItem>
                                    <MenuItem href={'/promocao/tabelaPreco'}> Tabela de Preco</MenuItem>
                                </SubMenu>
                                <SubMenu rootStyles={subMenuStyle} icon={<FontAwesomeIcon icon={faCalculator} color={'var(--main)'} />} label="Financeiro">
                                    <MenuItem href={'/motivoLancamento'}>Motivo de Lancamento</MenuItem>
                                    <MenuItem href={'/despesa'}>Despesas</MenuItem>
                                    <MenuItem href={'/entrada'}>Entradas</MenuItem>
                                </SubMenu>
                                <SubMenu rootStyles={subMenuStyle} icon={<FontAwesomeIcon icon={faMoneyBill} color={'var(--main)'} />} label="Vendas">
                                    <MenuItem href={'/movimentoCaixa'}>Caixas</MenuItem>
                                    <MenuItem href={'/venda'}>Vendas</MenuItem>
                                    <MenuItem href={'/arquivosxml'}>Arquivos XML</MenuItem>
                                </SubMenu>
                                <SubMenu rootStyles={subMenuStyle} icon={<FontAwesomeIcon icon={faChartSimple} color={'var(--main)'} />} label="Relatorios">
                                    <MenuItem href={'/relatorio/classe'}>Por Classe</MenuItem>
                                    <MenuItem href={'/relatorio/dia'}>Por Dia</MenuItem>
                                    <MenuItem href={'/relatorio/formaPagamento'}>Por Forma</MenuItem>
                                    <MenuItem href={'/relatorio/produto'}>Por Produto</MenuItem>
                                    <MenuItem href={'/relatorio/usuario'}>Por Usuario</MenuItem>
                                    <MenuItem href={'/relatorio/demonstrativo'}>Demonstrativo</MenuItem>
                                    <MenuItem href={'/relatorio/vendacusto'}>Venda/Custo </MenuItem>
                                    <MenuItem href={'/relatorio/FechamentoCaixa'}>Fechamento</MenuItem>
                                    <MenuItem href={'/relatorio/estoque'}>Estoque </MenuItem>
                                    <MenuItem href={'/relatorio/horario'}>Horario {bgNew()} </MenuItem>
                                </SubMenu>
                                <SubMenu icon={<FontAwesomeIcon icon={faUser} color={'var(--main)'} />} label="Clientes"
                                    rootStyles={subMenuStyle}>
                                    <MenuItem href={'/cliente'}>Clientes</MenuItem>
                                </SubMenu>
                                <SubMenu rootStyles={subMenuStyle} icon={<FontAwesomeIcon icon={faCashRegister} color={'var(--main)'} />} label="PDV">
                                    <MenuItem href={'/pdv/formaPagamento'}>Formas de Pagamento</MenuItem>
                                    <MenuItem href={'/pdv/usuario'}>Usuarios</MenuItem>
                                    <MenuItem href={'/pdv/configuracao'}>Configuracao</MenuItem>
                                </SubMenu>
                                <SubMenu rootStyles={subMenuStyle} icon={<FontAwesomeIcon icon={faUtensils} color={'var(--main)'} />} label="Menu Digital">
                                    <MenuItem href={'/menudigital/produtos'}>Produtos</MenuItem>
                                    <MenuItem href={'/menudigital/categorias'}>Categorias</MenuItem>
                                    <MenuItem href={'/menudigital/promocoes'}>Promocoes</MenuItem>
                                    <MenuItem href={'/menudigital/combos'}>Combos</MenuItem>
                                    <MenuItem href={'/menudigital/configuracao'}>Configuracao</MenuItem>
                                    <MenuItem href={'/menudigital/empresa'}>Empresa</MenuItem>
                                </SubMenu>
                            </div>
                        )}
                    </Menu>
                </Sidebar>
                <main  {...props} className={styles['main-panel']}>
                </main>
            </div>
        </div>
    )
}
