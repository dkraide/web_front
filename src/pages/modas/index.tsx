import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { AxiosError, AxiosResponse } from 'axios';
import { api } from '@/services/apiClient';
import { AuthContext } from '@/contexts/AuthContext';
import CustomButton from '@/components/ui/Buttons';
import { IModasConfiguracaoResposta, IModasSite } from '@/interfaces/IModasSite';
import { mergeComPadrao } from '@/utils/modasSite';
import Preview from '@/components/Modas/Preview';
import { TabProps } from '@/components/Modas/common';
import IdentidadeTab from '@/components/Modas/tabs/IdentidadeTab';
import TemaTab from '@/components/Modas/tabs/TemaTab';
import CabecalhoTab from '@/components/Modas/tabs/CabecalhoTab';
import HomeTab from '@/components/Modas/tabs/HomeTab';
import CatalogoTab from '@/components/Modas/tabs/CatalogoTab';
import RodapeTab from '@/components/Modas/tabs/RodapeTab';
import AvancadoTab from '@/components/Modas/tabs/AvancadoTab';
import styles from './styles.module.scss';

const ABAS: { id: string; rotulo: string; Componente: (p: TabProps) => JSX.Element }[] = [
    { id: 'identidade', rotulo: 'Identidade', Componente: IdentidadeTab },
    { id: 'tema', rotulo: 'Tema', Componente: TemaTab },
    { id: 'cabecalho', rotulo: 'Cabeçalho', Componente: CabecalhoTab },
    { id: 'home', rotulo: 'Página inicial', Componente: HomeTab },
    { id: 'catalogo', rotulo: 'Catálogo e pedido', Componente: CatalogoTab },
    { id: 'rodape', rotulo: 'Rodapé e páginas', Componente: RodapeTab },
    { id: 'avancado', rotulo: 'SEO e integrações', Componente: AvancadoTab },
];

export default function SiteModas() {
    const { getUser } = useContext(AuthContext);
    const [carregando, setCarregando] = useState(true);
    const [permitido, setPermitido] = useState(true);
    const [site, setSite] = useState<IModasSite | null>(null);
    const [info, setInfo] = useState<IModasConfiguracaoResposta | null>(null);
    const [sujo, setSujo] = useState(false);       // editado e ainda nao salvo
    const [ocupado, setOcupado] = useState(false);
    const [aba, setAba] = useState(ABAS[0].id);
    const [mobile, setMobile] = useState(false);
    const siteRef = useRef<IModasSite | null>(null);
    siteRef.current = site;

    const aplicar = useCallback((r: IModasConfiguracaoResposta) => {
        setInfo(r);
        setSite(mergeComPadrao(r.rascunho ?? r.publicado));
        setSujo(false);
    }, []);

    useEffect(() => {
        (async () => {
            const user = await getUser();
            if (user?.tipoSistema !== 'LOJA_ROUPA') {
                setPermitido(false);
                setCarregando(false);
                return;
            }
            api.get('/ModasConfiguracao')
                .then(({ data }: AxiosResponse) => aplicar(data))
                .catch((err: AxiosError) => toast.error(`Erro ao carregar o site. ${err.response?.data || err.message}`))
                .finally(() => setCarregando(false));
        })();
    }, [getUser, aplicar]);

    // Avisa antes de sair com alteracoes nao salvas.
    useEffect(() => {
        if (!sujo) return;
        const h = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
        window.addEventListener('beforeunload', h);
        return () => window.removeEventListener('beforeunload', h);
    }, [sujo]);

    const update = useCallback((fn: (d: IModasSite) => void) => {
        const atual = siteRef.current;
        if (!atual) return;
        const copia = structuredClone(atual);
        fn(copia);
        setSite(copia);
        setSujo(true);
    }, []);

    async function salvar(): Promise<IModasConfiguracaoResposta | null> {
        if (!site) return null;
        try {
            const { data } = await api.put('/ModasConfiguracao', { rascunho: JSON.stringify(site) });
            setInfo(data);
            setSujo(false);
            return data;
        } catch (err) {
            toast.error(`Erro ao salvar. ${(err as AxiosError).response?.data || (err as Error).message}`);
            return null;
        }
    }

    async function onSalvar() {
        setOcupado(true);
        if (await salvar()) toast.success('Rascunho salvo.');
        setOcupado(false);
    }

    async function onPublicar() {
        if (!window.confirm('Publicar o site? As alterações ficarão visíveis para os clientes.')) return;
        setOcupado(true);
        if (await salvar()) {
            try {
                const { data } = await api.post('/ModasConfiguracao/Publicar');
                setInfo(data);
                toast.success('Site publicado!');
            } catch (err) {
                toast.error(`Erro ao publicar. ${(err as AxiosError).response?.data || (err as Error).message}`);
            }
        }
        setOcupado(false);
    }

    async function onDescartar() {
        if (!info?.publicado) { toast.info('Ainda não há versão publicada.'); return; }
        if (!window.confirm('Descartar o rascunho e voltar para a versão publicada?')) return;
        setOcupado(true);
        try {
            const { data } = await api.post('/ModasConfiguracao/Descartar');
            aplicar(data);
            toast.success('Rascunho descartado.');
        } catch (err) {
            toast.error(`Erro ao descartar. ${(err as AxiosError).response?.data || (err as Error).message}`);
        }
        setOcupado(false);
    }

    const Atual = useMemo(() => ABAS.find((a) => a.id === aba)!.Componente, [aba]);

    if (carregando) return <div className={styles.centro}><Spinner size="sm" /></div>;
    if (!permitido) return <div className={styles.centro}>O site da loja está disponível apenas para o sistema de Loja de Roupas.</div>;
    if (!site) return <div className={styles.centro}>Não foi possível carregar a configuração do site.</div>;

    const status = sujo ? 'Alterações não salvas' : info?.temAlteracoes ? 'Rascunho salvo — não publicado' : info?.publicado ? 'Publicado' : 'Nunca publicado';

    return (
        <div className={styles.page}>
            <div className={styles.topo}>
                <div>
                    <h4>Site da loja</h4>
                    <span className={`${styles.status} ${sujo || info?.temAlteracoes ? styles.pendente : styles.ok}`}>{status}</span>
                    {info?.versao ? <small> · versão {info.versao}</small> : null}
                </div>
                <div className={styles.acoes}>
                    <CustomButton typeButton="outline-main" onClick={onDescartar} disabled={ocupado}>Descartar</CustomButton>
                    <CustomButton typeButton="outline-main" onClick={onSalvar} loading={ocupado} disabled={!sujo}>Salvar rascunho</CustomButton>
                    <CustomButton onClick={onPublicar} loading={ocupado} disabled={!sujo && !info?.temAlteracoes}>Publicar</CustomButton>
                </div>
            </div>

            <div className={styles.corpo}>
                <div className={styles.editor}>
                    <nav className={styles.abas}>
                        {ABAS.map((a) => (
                            <button key={a.id} type="button" className={a.id === aba ? styles.abaAtiva : ''} onClick={() => setAba(a.id)}>{a.rotulo}</button>
                        ))}
                    </nav>
                    <div className={styles.abaCorpo}>
                        <Atual site={site} update={update} />
                    </div>
                </div>

                <div className={styles.preview}>
                    <div className={styles.previewTopo}>
                        <b>Pré-visualização</b>
                        <div>
                            <button type="button" className={!mobile ? styles.abaAtiva : ''} onClick={() => setMobile(false)}>Computador</button>
                            <button type="button" className={mobile ? styles.abaAtiva : ''} onClick={() => setMobile(true)}>Celular</button>
                        </div>
                    </div>
                    <div className={styles.previewTela}>
                        <Preview site={site} mobile={mobile} />
                    </div>
                </div>
            </div>
        </div>
    );
}
