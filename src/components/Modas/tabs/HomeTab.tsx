import { useState } from 'react';
import { IModasSecao, ModasSecaoTipo } from '@/interfaces/IModasSite';
import { ICONES_BENEFICIO, novaSecao, novoCardCategoria, novoSlide, SECAO_META, uid } from '@/utils/modasSite';
import { Area, Cor, Grupo, Img, ItemLista, Linha, Lista, Num, Sel, Sw, Txt } from '../fields';
import { LinkEditor, TabProps } from '../common';
import styles from '../styles.module.scss';

type SetSecao = (fn: (s: any) => void) => void;

function CamposComuns({ s, set }: { s: IModasSecao; set: SetSecao }) {
    return (
        <>
            {s.tipo !== 'espaco' && s.tipo !== 'banner' && (
                <Linha>
                    <Txt label="Título da seção" value={s.titulo} onChange={(v) => set((x) => { x.titulo = v; })} />
                    <Txt label="Subtítulo" value={s.subtitulo} onChange={(v) => set((x) => { x.subtitulo = v; })} />
                </Linha>
            )}
        </>
    );
}

function Estilo({ s, set }: { s: IModasSecao; set: SetSecao }) {
    const e = s.estilo;
    return (
        <Grupo titulo="Aparência da seção" aberto={false}>
            <Linha>
                <Cor label="Cor de fundo" vazioHerda value={e.fundo} onChange={(v) => set((x) => { x.estilo.fundo = v; })} />
                <Cor label="Cor do texto" vazioHerda value={e.corTexto} onChange={(v) => set((x) => { x.estilo.corTexto = v; })} />
            </Linha>
            <Linha>
                <Num label="Espaço vertical (px)" min={0} max={200} value={e.paddingY} onChange={(v) => set((x) => { x.estilo.paddingY = v; })} />
                <Sel label="Alinhamento" value={e.alinhamento}
                    opcoes={[{ valor: 'esquerda', rotulo: 'Esquerda' }, { valor: 'centro', rotulo: 'Centro' }, { valor: 'direita', rotulo: 'Direita' }]}
                    onChange={(v) => set((x) => { x.estilo.alinhamento = v; })} />
            </Linha>
            <Sw label="Ocupar a largura toda da tela" value={e.larguraTotal} onChange={(v) => set((x) => { x.estilo.larguraTotal = v; })} />
            <Sw label="Ocultar no celular" value={e.ocultarNoMobile} onChange={(v) => set((x) => { x.estilo.ocultarNoMobile = v; })} />
            <Sw label="Ocultar no computador" value={e.ocultarNoDesktop} onChange={(v) => set((x) => { x.estilo.ocultarNoDesktop = v; })} />
        </Grupo>
    );
}

const POSICAO = [{ valor: 'esquerda', rotulo: 'Esquerda' }, { valor: 'centro', rotulo: 'Centro' }, { valor: 'direita', rotulo: 'Direita' }] as const;

function EditorSecao({ s, set }: { s: IModasSecao; set: SetSecao }) {
    return (
        <>
            <CamposComuns s={s} set={set} />

            {s.tipo === 'banner' && (
                <>
                    <Linha>
                        <Num label="Altura no computador (px)" min={150} max={1000} value={s.alturaDesktop} onChange={(v) => set((x) => { x.alturaDesktop = v; })} />
                        <Num label="Altura no celular (px)" min={150} max={800} value={s.alturaMobile} onChange={(v) => set((x) => { x.alturaMobile = v; })} />
                        <Num label="Segundos por slide" min={2} max={30} value={s.intervaloSegundos} onChange={(v) => set((x) => { x.intervaloSegundos = v; })} />
                    </Linha>
                    <Sw label="Passar slides automaticamente" value={s.autoplay} onChange={(v) => set((x) => { x.autoplay = v; })} />
                    <Sw label="Mostrar setas" value={s.mostrarSetas} onChange={(v) => set((x) => { x.mostrarSetas = v; })} />
                    <Sw label="Mostrar pontos" value={s.mostrarPontos} onChange={(v) => set((x) => { x.mostrarPontos = v; })} />
                    <Grupo titulo={`Slides (${s.slides.length})`}>
                        <Lista
                            itens={s.slides}
                            onChange={(slides) => set((x) => { x.slides = slides; })}
                            novo={novoSlide}
                            titulo={(sl, i) => sl.titulo || `Slide ${i + 1}`}
                            render={(sl, setSl) => (
                                <>
                                    <Linha>
                                        <Img label="Imagem (computador)" dica="Sugestão: 1920×700" value={sl.imagemDesktop} onChange={(v) => setSl({ imagemDesktop: v })} />
                                        <Img label="Imagem (celular)" dica="Sugestão: 800×1000. Vazio = usa a do computador." value={sl.imagemMobile} onChange={(v) => setSl({ imagemMobile: v })} />
                                    </Linha>
                                    <Txt label="Título" value={sl.titulo} onChange={(v) => setSl({ titulo: v })} />
                                    <Txt label="Subtítulo" value={sl.subtitulo} onChange={(v) => setSl({ subtitulo: v })} />
                                    <Txt label="Texto do botão" dica="Vazio = sem botão" value={sl.textoBotao} onChange={(v) => setSl({ textoBotao: v })} />
                                    <LinkEditor tipo={sl.linkTipo} destino={sl.linkDestino} onChange={(l) => setSl({ linkTipo: l.tipo, linkDestino: l.destino })} />
                                    <Linha>
                                        <Sel label="Posição do texto" value={sl.posicaoTexto} opcoes={[...POSICAO]} onChange={(v) => setSl({ posicaoTexto: v })} />
                                        <Num label="Escurecer imagem (%)" min={0} max={80} value={sl.escurecerImagem} onChange={(v) => setSl({ escurecerImagem: v })} />
                                    </Linha>
                                </>
                            )}
                        />
                    </Grupo>
                </>
            )}

            {s.tipo === 'vitrine' && (
                <>
                    <Sel label="Quais produtos mostrar" value={s.origem}
                        opcoes={[
                            { valor: 'novidades', rotulo: 'Novidades' },
                            { valor: 'promocoes', rotulo: 'Em promoção' },
                            { valor: 'destaques', rotulo: 'Destaques' },
                            { valor: 'mais-vendidos', rotulo: 'Mais vendidos' },
                            { valor: 'categoria', rotulo: 'De uma categoria' },
                            { valor: 'colecao', rotulo: 'De uma coleção' },
                            { valor: 'manual', rotulo: 'Seleção manual' },
                        ]}
                        onChange={(v) => set((x) => { x.origem = v; })} />
                    {(s.origem === 'categoria' || s.origem === 'colecao') && (
                        <Txt label={s.origem === 'categoria' ? 'Categoria (código/slug)' : 'Coleção (código/slug)'} value={s.origemId} onChange={(v) => set((x) => { x.origemId = v; })} />
                    )}
                    {s.origem === 'manual' && (
                        <Txt label="Códigos dos produtos (separados por vírgula)" value={s.produtoIds.join(', ')}
                            onChange={(v) => set((x) => { x.produtoIds = v.split(',').map((n) => parseInt(n.trim(), 10)).filter((n) => Number.isFinite(n)); })} />
                    )}
                    <Linha>
                        <Sel label="Layout" value={s.layout} opcoes={[{ valor: 'grade', rotulo: 'Grade' }, { valor: 'carrossel', rotulo: 'Carrossel' }]} onChange={(v) => set((x) => { x.layout = v; })} />
                        <Num label="Quantidade" min={1} max={48} value={s.quantidade} onChange={(v) => set((x) => { x.quantidade = v; })} />
                        <Num label="Colunas (computador)" min={2} max={6} value={s.colunasDesktop} onChange={(v) => set((x) => { x.colunasDesktop = v; })} />
                        <Num label="Colunas (celular)" min={1} max={3} value={s.colunasMobile} onChange={(v) => set((x) => { x.colunasMobile = v; })} />
                    </Linha>
                    <Txt label="Texto do link “ver todos”" dica="Vazio = sem link" value={s.textoBotaoVerTodos} onChange={(v) => set((x) => { x.textoBotaoVerTodos = v; })} />
                </>
            )}

            {s.tipo === 'categorias' && (
                <>
                    <Linha>
                        <Sel label="Formato" value={s.formato}
                            opcoes={[{ valor: 'retrato', rotulo: 'Retrato' }, { valor: 'quadrado', rotulo: 'Quadrado' }, { valor: 'paisagem', rotulo: 'Paisagem' }, { valor: 'redondo', rotulo: 'Redondo' }]}
                            onChange={(v) => set((x) => { x.formato = v; })} />
                        <Num label="Colunas (computador)" min={2} max={6} value={s.colunasDesktop} onChange={(v) => set((x) => { x.colunasDesktop = v; })} />
                        <Num label="Colunas (celular)" min={1} max={3} value={s.colunasMobile} onChange={(v) => set((x) => { x.colunasMobile = v; })} />
                    </Linha>
                    <Sw label="Rótulo sobre a imagem" value={s.mostrarRotuloSobreImagem} onChange={(v) => set((x) => { x.mostrarRotuloSobreImagem = v; })} />
                    <Grupo titulo={`Cards (${s.cards.length})`}>
                        <Lista
                            itens={s.cards}
                            onChange={(cards) => set((x) => { x.cards = cards; })}
                            novo={novoCardCategoria}
                            titulo={(c) => c.rotulo}
                            render={(c, setC) => (
                                <>
                                    <Txt label="Rótulo" value={c.rotulo} onChange={(v) => setC({ rotulo: v })} />
                                    <Img label="Imagem" value={c.imagem} onChange={(v) => setC({ imagem: v })} />
                                    <LinkEditor tipo={c.linkTipo} destino={c.linkDestino} onChange={(l) => setC({ linkTipo: l.tipo, linkDestino: l.destino })} />
                                </>
                            )}
                        />
                    </Grupo>
                </>
            )}

            {s.tipo === 'colecao' && (
                <>
                    <Linha>
                        <Img label="Imagem (computador)" value={s.imagem} onChange={(v) => set((x) => { x.imagem = v; })} />
                        <Img label="Imagem (celular)" value={s.imagemMobile} onChange={(v) => set((x) => { x.imagemMobile = v; })} />
                    </Linha>
                    <Sel label="Posição da imagem" value={s.posicaoImagem}
                        opcoes={[{ valor: 'esquerda', rotulo: 'Esquerda do texto' }, { valor: 'direita', rotulo: 'Direita do texto' }, { valor: 'fundo', rotulo: 'Como fundo (texto sobre a imagem)' }]}
                        onChange={(v) => set((x) => { x.posicaoImagem = v; })} />
                    <Txt label="Texto do botão" value={s.textoBotao} onChange={(v) => set((x) => { x.textoBotao = v; })} />
                    <LinkEditor tipo={s.linkTipo} destino={s.linkDestino} onChange={(l) => set((x) => { x.linkTipo = l.tipo; x.linkDestino = l.destino; })} />
                </>
            )}

            {s.tipo === 'beneficios' && (
                <Lista
                    itens={s.itens}
                    onChange={(itens) => set((x) => { x.itens = itens; })}
                    novo={() => ({ id: uid(), icone: 'star' as const, titulo: 'Novo benefício', descricao: '' })}
                    titulo={(b) => b.titulo}
                    render={(b, setB) => (
                        <>
                            <Sel label="Ícone" value={b.icone} opcoes={ICONES_BENEFICIO.map((i) => ({ valor: i, rotulo: i }))} onChange={(v) => setB({ icone: v })} />
                            <Txt label="Título" value={b.titulo} onChange={(v) => setB({ titulo: v })} />
                            <Txt label="Descrição" value={b.descricao} onChange={(v) => setB({ descricao: v })} />
                        </>
                    )}
                />
            )}

            {s.tipo === 'texto' && (
                <>
                    <Area label="Conteúdo" rows={6} value={s.conteudo} onChange={(v) => set((x) => { x.conteudo = v; })} />
                    <Txt label="Texto do botão" dica="Vazio = sem botão" value={s.textoBotao} onChange={(v) => set((x) => { x.textoBotao = v; })} />
                    <LinkEditor tipo={s.linkTipo} destino={s.linkDestino} onChange={(l) => set((x) => { x.linkTipo = l.tipo; x.linkDestino = l.destino; })} />
                </>
            )}

            {s.tipo === 'video' && (
                <>
                    <Txt label="Endereço do vídeo" placeholder="https://www.youtube.com/watch?v=…" value={s.url} onChange={(v) => set((x) => { x.url = v; })} />
                    <Sel label="Proporção" value={s.proporcao} opcoes={[{ valor: '16:9', rotulo: '16:9 (horizontal)' }, { valor: '9:16', rotulo: '9:16 (vertical)' }, { valor: '1:1', rotulo: '1:1 (quadrado)' }]} onChange={(v) => set((x) => { x.proporcao = v; })} />
                    <Sw label="Tocar automaticamente (sem som)" value={s.autoplay} onChange={(v) => set((x) => { x.autoplay = v; })} />
                </>
            )}

            {s.tipo === 'depoimentos' && (
                <Lista
                    itens={s.itens}
                    onChange={(itens) => set((x) => { x.itens = itens; })}
                    novo={() => ({ id: uid(), nome: '', texto: '', foto: '', nota: 5 })}
                    titulo={(d) => d.nome || 'Depoimento'}
                    render={(d, setD) => (
                        <>
                            <Txt label="Nome" value={d.nome} onChange={(v) => setD({ nome: v })} />
                            <Area label="Depoimento" rows={3} value={d.texto} onChange={(v) => setD({ texto: v })} />
                            <Linha>
                                <Img label="Foto" value={d.foto} onChange={(v) => setD({ foto: v })} />
                                <Num label="Nota (1 a 5)" min={1} max={5} value={d.nota} onChange={(v) => setD({ nota: v })} />
                            </Linha>
                        </>
                    )}
                />
            )}

            {s.tipo === 'instagram' && (
                <>
                    <Txt label="Usuário do Instagram" placeholder="@sualoja" value={s.usuario} onChange={(v) => set((x) => { x.usuario = v; })} />
                    <Lista
                        itens={s.imagens}
                        onChange={(imagens) => set((x) => { x.imagens = imagens; })}
                        novo={() => ({ id: uid(), imagem: '', link: '' })}
                        titulo={(_, i) => `Foto ${i + 1}`}
                        render={(im, setIm) => (
                            <>
                                <Img label="Foto" value={im.imagem} onChange={(v) => setIm({ imagem: v })} />
                                <Txt label="Link da publicação" value={im.link} onChange={(v) => setIm({ link: v })} />
                            </>
                        )}
                    />
                </>
            )}

            {s.tipo === 'newsletter' && (
                <>
                    <Linha>
                        <Txt label="Texto do botão" value={s.textoBotao} onChange={(v) => set((x) => { x.textoBotao = v; })} />
                        <Txt label="Texto do campo" value={s.placeholder} onChange={(v) => set((x) => { x.placeholder = v; })} />
                    </Linha>
                    <Txt label="Mensagem de sucesso" value={s.mensagemSucesso} onChange={(v) => set((x) => { x.mensagemSucesso = v; })} />
                </>
            )}

            {s.tipo === 'espaco' && (
                <Linha>
                    <Num label="Altura (px)" min={0} max={400} value={s.altura} onChange={(v) => set((x) => { x.altura = v; })} />
                    <Sw label="Mostrar linha divisória" value={s.mostrarLinha} onChange={(v) => set((x) => { x.mostrarLinha = v; })} />
                </Linha>
            )}

            <Estilo s={s} set={set} />
        </>
    );
}

export default function HomeTab({ site, update }: TabProps) {
    const secoes = site.home.secoes;
    const [novoTipo, setNovoTipo] = useState<ModasSecaoTipo>('vitrine');

    const mover = (i: number, d: number) => update((dr) => {
        const j = i + d;
        if (j < 0 || j >= dr.home.secoes.length) return;
        [dr.home.secoes[i], dr.home.secoes[j]] = [dr.home.secoes[j], dr.home.secoes[i]];
    });

    return (
        <>
            <p className={styles.dicaTopo}>
                Monte a página inicial empilhando seções. Use as setas para reordenar e o botão <b>Ativa</b> para ocultar sem apagar.
            </p>
            <div className={styles.lista}>
                {secoes.map((s, i) => (
                    <ItemLista
                        key={s.id}
                        titulo={`${SECAO_META[s.tipo].label}${s.titulo ? ` — ${s.titulo}` : ''}${s.ativa ? '' : ' (oculta)'}`}
                        onUp={i > 0 ? () => mover(i, -1) : undefined}
                        onDown={i < secoes.length - 1 ? () => mover(i, 1) : undefined}
                        onRemove={() => update((d) => { d.home.secoes.splice(i, 1); })}
                        extra={
                            <button type="button" title={s.ativa ? 'Ocultar' : 'Exibir'} onClick={() => update((d) => { d.home.secoes[i].ativa = !d.home.secoes[i].ativa; })}>
                                {s.ativa ? '👁' : '—'}
                            </button>
                        }
                    >
                        <EditorSecao s={s} set={(fn) => update((d) => { fn(d.home.secoes[i]); })} />
                    </ItemLista>
                ))}
            </div>

            <div className={styles.novaSecao}>
                <Sel label="Adicionar seção" value={novoTipo}
                    dica={SECAO_META[novoTipo].descricao}
                    opcoes={(Object.keys(SECAO_META) as ModasSecaoTipo[]).map((t) => ({ valor: t, rotulo: SECAO_META[t].label }))}
                    onChange={(v) => setNovoTipo(v as ModasSecaoTipo)} />
                <button type="button" className={styles.add} onClick={() => update((d) => { d.home.secoes.push(novaSecao(novoTipo)); })}>
                    + Adicionar à página
                </button>
            </div>
        </>
    );
}
