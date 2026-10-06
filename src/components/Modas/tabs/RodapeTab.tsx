import { IModasRedeSocial } from '@/interfaces/IModasSite';
import { uid } from '@/utils/modasSite';
import { Area, Cor, Grupo, Linha, Lista, Sel, Sw, Txt } from '../fields';
import { LinkEditor, TabProps } from '../common';

const REDES: { valor: IModasRedeSocial['rede']; rotulo: string }[] = [
    { valor: 'instagram', rotulo: 'Instagram' }, { valor: 'facebook', rotulo: 'Facebook' }, { valor: 'tiktok', rotulo: 'TikTok' },
    { valor: 'youtube', rotulo: 'YouTube' }, { valor: 'pinterest', rotulo: 'Pinterest' }, { valor: 'x', rotulo: 'X (Twitter)' },
    { valor: 'whatsapp', rotulo: 'WhatsApp' },
];

const PAGAMENTOS = ['pix', 'visa', 'mastercard', 'elo', 'amex', 'hipercard', 'boleto'];

const slugify = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export default function RodapeTab({ site, update }: TabProps) {
    const r = site.rodape;
    return (
        <>
            <Grupo titulo="Colunas de links">
                <Lista
                    itens={r.colunas}
                    onChange={(colunas) => update((d) => { d.rodape.colunas = colunas; })}
                    novo={() => ({ id: uid(), titulo: 'Institucional', links: [] })}
                    titulo={(c) => c.titulo}
                    render={(c, setC) => (
                        <>
                            <Txt label="Título da coluna" value={c.titulo} onChange={(v) => setC({ titulo: v })} />
                            <Lista
                                itens={c.links}
                                onChange={(links) => setC({ links })}
                                novo={() => ({ id: uid(), rotulo: 'Link', tipo: 'pagina' as const, destino: '' })}
                                titulo={(l) => l.rotulo}
                                render={(l, setL) => (
                                    <>
                                        <Txt label="Rótulo" value={l.rotulo} onChange={(v) => setL({ rotulo: v })} />
                                        <LinkEditor tipo={l.tipo} destino={l.destino} onChange={(x) => setL({ tipo: x.tipo, destino: x.destino })} />
                                    </>
                                )}
                            />
                        </>
                    )}
                />
            </Grupo>

            <Grupo titulo="Redes sociais">
                <Lista
                    itens={r.redes}
                    onChange={(redes) => update((d) => { d.rodape.redes = redes; })}
                    novo={() => ({ id: uid(), rede: 'instagram' as const, url: '' })}
                    titulo={(x) => REDES.find((o) => o.valor === x.rede)?.rotulo ?? x.rede}
                    render={(x, setX) => (
                        <Linha>
                            <Sel label="Rede" value={x.rede} opcoes={REDES} onChange={(v) => setX({ rede: v })} />
                            <Txt label="Endereço do perfil" value={x.url} onChange={(v) => setX({ url: v })} />
                        </Linha>
                    )}
                />
            </Grupo>

            <Grupo titulo="Aparência do rodapé">
                <Sw label="Mostrar logo" value={r.mostrarLogo} onChange={(v) => update((d) => { d.rodape.mostrarLogo = v; })} />
                <Sw label="Mostrar contato e endereço" value={r.mostrarContato} onChange={(v) => update((d) => { d.rodape.mostrarContato = v; })} />
                <Sw label="Mostrar formas de pagamento" value={r.mostrarFormasPagamento} onChange={(v) => update((d) => { d.rodape.mostrarFormasPagamento = v; })} />
                {r.mostrarFormasPagamento && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
                        {PAGAMENTOS.map((p) => (
                            <Sw key={p} label={p} value={r.formasPagamento.includes(p)}
                                onChange={(on) => update((d) => {
                                    d.rodape.formasPagamento = on ? [...d.rodape.formasPagamento, p] : d.rodape.formasPagamento.filter((x) => x !== p);
                                })} />
                        ))}
                    </div>
                )}
                <Linha>
                    <Cor label="Cor de fundo" vazioHerda value={r.corFundo} onChange={(v) => update((d) => { d.rodape.corFundo = v; })} />
                    <Cor label="Cor do texto" vazioHerda value={r.corTexto} onChange={(v) => update((d) => { d.rodape.corTexto = v; })} />
                </Linha>
                <Area label="Texto legal" rows={2} dica="Ex.: CNPJ, razão social, direitos reservados." value={r.textoLegal} onChange={(v) => update((d) => { d.rodape.textoLegal = v; })} />
            </Grupo>

            <Grupo titulo="Páginas da loja (Sobre, Trocas, Política…)">
                <Lista
                    itens={site.paginas}
                    onChange={(paginas) => update((d) => { d.paginas = paginas; })}
                    novo={() => ({ id: uid(), slug: '', titulo: 'Nova página', conteudo: '', publicada: true })}
                    titulo={(p) => p.titulo}
                    render={(p, setP) => (
                        <>
                            <Linha>
                                <Txt label="Título" value={p.titulo}
                                    onChange={(v) => setP({ titulo: v, slug: p.slug && p.slug !== slugify(p.titulo) ? p.slug : slugify(v) })} />
                                <Txt label="Endereço (slug)" dica="Usado nos links do tipo “Página da loja”." value={p.slug} onChange={(v) => setP({ slug: slugify(v) })} />
                            </Linha>
                            <Area label="Conteúdo" rows={8} value={p.conteudo} onChange={(v) => setP({ conteudo: v })} />
                            <Sw label="Publicada" value={p.publicada} onChange={(v) => setP({ publicada: v })} />
                        </>
                    )}
                />
            </Grupo>
        </>
    );
}
