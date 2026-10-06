import { IModasMenuItem } from '@/interfaces/IModasSite';
import { uid } from '@/utils/modasSite';
import { Cor, Grupo, Linha, Lista, Num, Sel, Sw, Txt } from '../fields';
import { LinkEditor, TabProps } from '../common';

const novoItem = (): IModasMenuItem => ({
    id: uid(), rotulo: 'Novo item', tipo: 'categoria', destino: '', destaque: false, filhos: [],
});

function ItemMenu({ item, set, nivel }: { item: IModasMenuItem; set: (p: Partial<IModasMenuItem>) => void; nivel: number }) {
    return (
        <>
            <Txt label="Rótulo" value={item.rotulo} onChange={(v) => set({ rotulo: v })} />
            <LinkEditor tipo={item.tipo} destino={item.destino} onChange={(l) => set({ tipo: l.tipo, destino: l.destino })} />
            <Sw label="Destacar com a cor de destaque" value={item.destaque} onChange={(v) => set({ destaque: v })} />
            {nivel === 0 && (
                <Grupo titulo={`Submenu (${item.filhos.length})`} aberto={false}>
                    <Lista
                        itens={item.filhos}
                        onChange={(filhos) => set({ filhos })}
                        novo={novoItem}
                        titulo={(f) => f.rotulo}
                        render={(f, setF) => <ItemMenu item={f} set={setF} nivel={1} />}
                    />
                </Grupo>
            )}
        </>
    );
}

export default function CabecalhoTab({ site, update }: TabProps) {
    const c = site.cabecalho;
    return (
        <>
            <Grupo titulo="Barra de aviso (topo)">
                <Sw label="Exibir barra de aviso" value={c.barraAviso.ativa} onChange={(v) => update((d) => { d.cabecalho.barraAviso.ativa = v; })} />
                {c.barraAviso.ativa && (
                    <>
                        <Txt label="Texto" value={c.barraAviso.texto} onChange={(v) => update((d) => { d.cabecalho.barraAviso.texto = v; })} />
                        <Txt label="Link (opcional)" value={c.barraAviso.link} onChange={(v) => update((d) => { d.cabecalho.barraAviso.link = v; })} />
                        <Linha>
                            <Cor label="Cor de fundo" value={c.barraAviso.corFundo} onChange={(v) => update((d) => { d.cabecalho.barraAviso.corFundo = v; })} />
                            <Cor label="Cor do texto" value={c.barraAviso.corTexto} onChange={(v) => update((d) => { d.cabecalho.barraAviso.corTexto = v; })} />
                        </Linha>
                    </>
                )}
            </Grupo>

            <Grupo titulo="Cabeçalho">
                <Linha>
                    <Sel label="Layout" value={c.layout}
                        opcoes={[
                            { valor: 'logo-esquerda', rotulo: 'Logo à esquerda' },
                            { valor: 'logo-centro', rotulo: 'Logo centralizada' },
                            { valor: 'menu-abaixo', rotulo: 'Menu abaixo da logo' },
                        ]}
                        onChange={(v) => update((d) => { d.cabecalho.layout = v; })} />
                    <Num label="Altura da logo (px)" min={20} max={120} value={c.alturaLogo}
                        onChange={(v) => update((d) => { d.cabecalho.alturaLogo = v; })} />
                </Linha>
                <Sw label="Cabeçalho fixo ao rolar" value={c.fixo} onChange={(v) => update((d) => { d.cabecalho.fixo = v; })} />
                <Sw label="Transparente sobre o banner da home" value={c.transparenteNaHome} onChange={(v) => update((d) => { d.cabecalho.transparenteNaHome = v; })} />
                <Sw label="Mostrar busca" value={c.mostrarBusca} onChange={(v) => update((d) => { d.cabecalho.mostrarBusca = v; })} />
                <Sw label="Mostrar conta da cliente" value={c.mostrarConta} onChange={(v) => update((d) => { d.cabecalho.mostrarConta = v; })} />
                <Sw label="Mostrar favoritos" value={c.mostrarFavoritos} onChange={(v) => update((d) => { d.cabecalho.mostrarFavoritos = v; })} />
                <Sw label="Mostrar sacola" value={c.mostrarSacola} onChange={(v) => update((d) => { d.cabecalho.mostrarSacola = v; })} />
            </Grupo>

            <Grupo titulo="Menu principal">
                <Lista
                    itens={c.menu}
                    onChange={(menu) => update((d) => { d.cabecalho.menu = menu; })}
                    novo={novoItem}
                    titulo={(m) => m.rotulo}
                    render={(m, set) => <ItemMenu item={m} set={set} nivel={0} />}
                />
            </Grupo>
        </>
    );
}
