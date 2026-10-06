import { IModasCores } from '@/interfaces/IModasSite';
import { FONTES } from '@/utils/modasSite';
import { Cor, Grupo, Linha, Num, Sel, Sw } from '../fields';
import { TabProps } from '../common';

const CORES: { chave: keyof IModasCores; rotulo: string }[] = [
    { chave: 'primaria', rotulo: 'Primária (botões, links)' },
    { chave: 'primariaTexto', rotulo: 'Texto sobre a primária' },
    { chave: 'secundaria', rotulo: 'Secundária' },
    { chave: 'destaque', rotulo: 'Destaque (promoção, badges)' },
    { chave: 'fundo', rotulo: 'Fundo da página' },
    { chave: 'superficie', rotulo: 'Superfície (cards, faixas)' },
    { chave: 'texto', rotulo: 'Texto' },
    { chave: 'textoSuave', rotulo: 'Texto secundário' },
    { chave: 'borda', rotulo: 'Bordas' },
    { chave: 'sucesso', rotulo: 'Sucesso' },
    { chave: 'erro', rotulo: 'Erro' },
];

const fontes = FONTES.map((f) => ({ valor: f, rotulo: f }));

export default function TemaTab({ site, update }: TabProps) {
    const t = site.tema;
    return (
        <>
            <Grupo titulo="Cores">
                <Sel label="Modo de cor" value={t.modoCor} dica="Auto segue a preferência do aparelho da cliente."
                    opcoes={[{ valor: 'claro', rotulo: 'Claro' }, { valor: 'escuro', rotulo: 'Escuro' }, { valor: 'auto', rotulo: 'Automático' }]}
                    onChange={(v) => update((d) => { d.tema.modoCor = v; })} />
                <Linha>
                    {CORES.map((c) => (
                        <Cor key={c.chave} label={c.rotulo} value={t.cores[c.chave]}
                            onChange={(v) => update((d) => { d.tema.cores[c.chave] = v; })} />
                    ))}
                </Linha>
            </Grupo>

            <Grupo titulo="Tipografia">
                <Linha>
                    <Sel label="Fonte dos títulos" value={t.tipografia.fonteTitulo} opcoes={fontes}
                        onChange={(v) => update((d) => { d.tema.tipografia.fonteTitulo = v; })} />
                    <Sel label="Fonte do texto" value={t.tipografia.fonteCorpo} opcoes={fontes}
                        onChange={(v) => update((d) => { d.tema.tipografia.fonteCorpo = v; })} />
                </Linha>
                <Linha>
                    <Num label="Tamanho base (px)" min={12} max={20} value={t.tipografia.tamanhoBase}
                        onChange={(v) => update((d) => { d.tema.tipografia.tamanhoBase = v; })} />
                    <Sel label="Peso dos títulos" value={t.tipografia.pesoTitulo}
                        opcoes={[400, 500, 600, 700, 800].map((p) => ({ valor: p as 400, rotulo: String(p) }))}
                        onChange={(v) => update((d) => { d.tema.tipografia.pesoTitulo = v; })} />
                    <Num label="Espaço entre letras (centésimos de em)" min={0} max={30} value={t.tipografia.espacamentoLetrasTitulo}
                        onChange={(v) => update((d) => { d.tema.tipografia.espacamentoLetrasTitulo = v; })} />
                </Linha>
                <Sw label="Títulos em CAIXA ALTA" value={t.tipografia.caixaAltaTitulos}
                    onChange={(v) => update((d) => { d.tema.tipografia.caixaAltaTitulos = v; })} />
            </Grupo>

            <Grupo titulo="Forma e estilo">
                <Linha>
                    <Sel label="Estilo dos botões" value={t.forma.estiloBotao}
                        opcoes={[{ valor: 'solido', rotulo: 'Sólido' }, { valor: 'contorno', rotulo: 'Contorno' }, { valor: 'minimalista', rotulo: 'Minimalista (só texto)' }]}
                        onChange={(v) => update((d) => { d.tema.forma.estiloBotao = v; })} />
                    <Sel label="Sombra dos cards" value={t.forma.sombraCards}
                        opcoes={[{ valor: 'nenhuma', rotulo: 'Nenhuma' }, { valor: 'suave', rotulo: 'Suave' }, { valor: 'forte', rotulo: 'Forte' }]}
                        onChange={(v) => update((d) => { d.tema.forma.sombraCards = v; })} />
                </Linha>
                <Linha>
                    <Num label="Arredondamento dos botões (px)" min={0} max={40} value={t.forma.raioBotao}
                        onChange={(v) => update((d) => { d.tema.forma.raioBotao = v; })} />
                    <Num label="Arredondamento dos cards (px)" min={0} max={40} value={t.forma.raioCard}
                        onChange={(v) => update((d) => { d.tema.forma.raioCard = v; })} />
                    <Num label="Arredondamento das imagens (px)" min={0} max={40} value={t.forma.raioImagem}
                        onChange={(v) => update((d) => { d.tema.forma.raioImagem = v; })} />
                    <Num label="Largura máxima do site (px)" min={960} max={1920} step={20} value={t.forma.larguraMaxima}
                        onChange={(v) => update((d) => { d.tema.forma.larguraMaxima = v; })} />
                </Linha>
            </Grupo>
        </>
    );
}
