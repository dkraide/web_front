import { CSSProperties, ReactNode } from 'react';
import { IModasSecao, IModasSite } from '@/interfaces/IModasSite';

// Preview simplificado: reflete tema, cabecalho, secoes da home e rodape.
// Nao e o site real (web-modas) — serve para a lojista ver o efeito das escolhas.

const RAZAO: Record<string, string> = { '1:1': '1 / 1', '4:5': '4 / 5', '3:4': '3 / 4', '2:3': '2 / 3' };
const ICONE: Record<string, string> = {
    truck: '🚚', refresh: '↺', shield: '🛡', 'credit-card': '💳', gift: '🎁', heart: '♡', star: '★', whatsapp: '💬', tag: '🏷',
};

export default function Preview({ site, mobile }: { site: IModasSite; mobile: boolean }) {
    const { cores: c, tipografia: t, forma: f } = site.tema;
    const sombra = f.sombraCards === 'nenhuma' ? 'none' : f.sombraCards === 'suave' ? '0 2px 8px rgba(0,0,0,.08)' : '0 8px 24px rgba(0,0,0,.2)';
    const fontes = Array.from(new Set([t.fonteTitulo, t.fonteCorpo]))
        .map((x) => `family=${encodeURIComponent(x).replace(/%20/g, '+')}:wght@400;500;600;700;800`).join('&');

    const titulo: CSSProperties = {
        fontFamily: `'${t.fonteTitulo}', serif`, fontWeight: t.pesoTitulo, margin: 0,
        textTransform: t.caixaAltaTitulos ? 'uppercase' : 'none', letterSpacing: `${t.espacamentoLetrasTitulo / 100}em`,
    };
    const botao: CSSProperties = {
        display: 'inline-block', padding: '8px 18px', borderRadius: f.raioBotao, fontSize: '0.85em', cursor: 'default',
        ...(f.estiloBotao === 'solido' ? { background: c.primaria, color: c.primariaTexto, border: `1px solid ${c.primaria}` }
            : f.estiloBotao === 'contorno' ? { background: 'transparent', color: c.primaria, border: `1px solid ${c.primaria}` }
                : { background: 'transparent', color: c.primaria, border: 0, textDecoration: 'underline' }),
    };
    const cardImg: CSSProperties = { aspectRatio: RAZAO[site.catalogo.proporcaoImagem], background: c.superficie, borderRadius: f.raioImagem, border: `1px solid ${c.borda}` };

    const raiz: CSSProperties = {
        width: mobile ? 390 : '100%', maxWidth: '100%', margin: '0 auto', background: c.fundo, color: c.texto,
        fontFamily: `'${t.fonteCorpo}', sans-serif`, fontSize: t.tamanhoBase * 0.8, overflow: 'hidden',
        border: '1px solid #cbd5e1', borderRadius: 8,
    };

    const wrap = (s: IModasSecao, children: ReactNode) => {
        const e = s.estilo;
        if (!s.ativa || (mobile ? e.ocultarNoMobile : e.ocultarNoDesktop)) return null;
        return (
            <div key={s.id} style={{ background: e.fundo || 'transparent', color: e.corTexto || 'inherit', padding: `${e.paddingY * 0.6}px 0`, textAlign: e.alinhamento === 'esquerda' ? 'left' : e.alinhamento === 'direita' ? 'right' : 'center' }}>
                <div style={{ maxWidth: e.larguraTotal ? 'none' : Math.min(f.larguraMaxima, 1200) * 0.8, margin: '0 auto', padding: e.larguraTotal ? 0 : '0 16px' }}>{children}</div>
            </div>
        );
    };
    const cab = (s: IModasSecao) => (s.tipo !== 'espaco' && s.tipo !== 'banner' && (s.titulo || s.subtitulo)) ? (
        <div style={{ marginBottom: 14 }}>
            {s.titulo && <h3 style={{ ...titulo, fontSize: '1.5em' }}>{s.titulo}</h3>}
            {s.subtitulo && <p style={{ color: c.textoSuave, margin: '4px 0 0' }}>{s.subtitulo}</p>}
        </div>
    ) : null;

    const grade = (n: number, itens: ReactNode[]) => (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${n}, 1fr)`, gap: 12 }}>{itens}</div>
    );

    function secao(s: IModasSecao) {
        switch (s.tipo) {
            case 'banner': {
                const sl = s.slides[0];
                const img = (mobile && sl?.imagemMobile) || sl?.imagemDesktop;
                return wrap(s, (
                    <div style={{ height: (mobile ? s.alturaMobile : s.alturaDesktop) * 0.6, position: 'relative', background: c.superficie, backgroundImage: img ? `url(${img})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', alignItems: 'center', justifyContent: sl?.posicaoTexto === 'direita' ? 'flex-end' : sl?.posicaoTexto === 'centro' ? 'center' : 'flex-start', padding: '0 32px' }}>
                        <div style={{ position: 'absolute', inset: 0, background: `rgba(0,0,0,${(sl?.escurecerImagem ?? 0) / 100})` }} />
                        {sl && (
                            <div style={{ position: 'relative', color: img ? '#fff' : c.texto, maxWidth: '60%', textAlign: sl.posicaoTexto === 'centro' ? 'center' : 'left' }}>
                                <h2 style={{ ...titulo, fontSize: '2em' }}>{sl.titulo}</h2>
                                {sl.subtitulo && <p>{sl.subtitulo}</p>}
                                {sl.textoBotao && <span style={botao}>{sl.textoBotao}</span>}
                            </div>
                        )}
                        {s.slides.length > 1 && s.mostrarPontos && <div style={{ position: 'absolute', bottom: 8, left: 0, right: 0, textAlign: 'center', color: '#fff' }}>{s.slides.map((_, i) => (i === 0 ? '●' : '○')).join(' ')}</div>}
                    </div>
                ));
            }
            case 'vitrine': {
                const n = mobile ? s.colunasMobile : s.colunasDesktop;
                return wrap(s, <>{cab(s)}{grade(n, Array.from({ length: Math.min(s.quantidade, n * 2) }, (_, i) => (
                    <div key={i} style={{ boxShadow: sombra, borderRadius: f.raioCard, textAlign: 'left' }}>
                        <div style={cardImg} />
                        <div style={{ padding: '6px 4px' }}>
                            <div style={{ fontSize: '0.85em' }}>Produto {i + 1}</div>
                            <b>R$ 129,90</b>
                            {site.catalogo.mostrarParcelamento && <div style={{ fontSize: '0.75em', color: c.textoSuave }}>até {site.catalogo.parcelasMaximas}x</div>}
                        </div>
                    </div>
                )))}{s.textoBotaoVerTodos && <div style={{ marginTop: 14 }}><span style={botao}>{s.textoBotaoVerTodos}</span></div>}</>);
            }
            case 'categorias': {
                const n = mobile ? s.colunasMobile : s.colunasDesktop;
                const ar = s.formato === 'quadrado' || s.formato === 'redondo' ? '1 / 1' : s.formato === 'paisagem' ? '4 / 3' : '3 / 4';
                return wrap(s, <>{cab(s)}{grade(n, s.cards.map((cd) => (
                    <div key={cd.id}>
                        <div style={{ aspectRatio: ar, background: c.superficie, backgroundImage: cd.imagem ? `url(${cd.imagem})` : undefined, backgroundSize: 'cover', borderRadius: s.formato === 'redondo' ? '50%' : f.raioImagem, border: `1px solid ${c.borda}`, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', color: '#fff' }}>
                            {s.mostrarRotuloSobreImagem && s.formato !== 'redondo' && <span style={{ padding: 6, background: 'rgba(0,0,0,.35)', width: '100%' }}>{cd.rotulo}</span>}
                        </div>
                        {(!s.mostrarRotuloSobreImagem || s.formato === 'redondo') && <div style={{ marginTop: 4 }}>{cd.rotulo}</div>}
                    </div>
                )))}</>);
            }
            case 'colecao':
                return wrap(s, (
                    <div style={{ display: 'flex', flexDirection: mobile ? 'column' : s.posicaoImagem === 'direita' ? 'row-reverse' : 'row', gap: 20, alignItems: 'center', background: s.posicaoImagem === 'fundo' && s.imagem ? `url(${s.imagem}) center/cover` : undefined, padding: s.posicaoImagem === 'fundo' ? 40 : 0, color: s.posicaoImagem === 'fundo' && s.imagem ? '#fff' : undefined }}>
                        {s.posicaoImagem !== 'fundo' && <div style={{ flex: 1, minHeight: 140, aspectRatio: '4 / 3', width: '100%', background: c.superficie, backgroundImage: s.imagem ? `url(${s.imagem})` : undefined, backgroundSize: 'cover', borderRadius: f.raioImagem }} />}
                        <div style={{ flex: 1 }}>{cab(s)}{s.textoBotao && <span style={botao}>{s.textoBotao}</span>}</div>
                    </div>
                ));
            case 'beneficios':
                return wrap(s, grade(mobile ? 1 : Math.max(1, s.itens.length), s.itens.map((b) => (
                    <div key={b.id}><div style={{ fontSize: '1.6em' }}>{ICONE[b.icone]}</div><b>{b.titulo}</b><div style={{ color: c.textoSuave, fontSize: '0.85em' }}>{b.descricao}</div></div>
                ))));
            case 'texto':
                return wrap(s, <>{cab(s)}{s.conteudo.split('\n').filter(Boolean).map((p, i) => <p key={i}>{p}</p>)}{s.textoBotao && <span style={botao}>{s.textoBotao}</span>}</>);
            case 'video':
                return wrap(s, <>{cab(s)}<div style={{ aspectRatio: s.proporcao.replace(':', ' / '), background: '#000', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', maxWidth: s.proporcao === '9:16' ? 220 : '100%', margin: '0 auto', borderRadius: f.raioImagem }}>▶ {s.url ? 'vídeo' : 'sem vídeo'}</div></>);
            case 'depoimentos':
                return wrap(s, <>{cab(s)}{grade(mobile ? 1 : Math.max(1, Math.min(3, s.itens.length)), s.itens.map((d) => (
                    <div key={d.id} style={{ border: `1px solid ${c.borda}`, borderRadius: f.raioCard, padding: 12, boxShadow: sombra }}>
                        <div style={{ color: c.destaque }}>{'★'.repeat(d.nota)}</div><p>{d.texto || '…'}</p><b>{d.nome}</b>
                    </div>
                )))}</>);
            case 'instagram':
                return wrap(s, <>{cab(s)}{s.usuario && <p style={{ color: c.textoSuave }}>{s.usuario}</p>}{grade(mobile ? 3 : 6, s.imagens.map((im) => (
                    <div key={im.id} style={{ aspectRatio: '1 / 1', background: c.superficie, backgroundImage: im.imagem ? `url(${im.imagem})` : undefined, backgroundSize: 'cover' }} />
                )))}</>);
            case 'newsletter':
                return wrap(s, <>{cab(s)}<div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}><span style={{ border: `1px solid ${c.borda}`, borderRadius: f.raioBotao, padding: '8px 12px', minWidth: 160, textAlign: 'left', color: c.textoSuave }}>{s.placeholder}</span><span style={botao}>{s.textoBotao}</span></div></>);
            case 'espaco':
                return wrap(s, <div style={{ height: s.altura * 0.6, borderBottom: s.mostrarLinha ? `1px solid ${c.borda}` : undefined }} />);
        }
    }

    const cb = site.cabecalho;
    const logo = site.identidade.logoUrl
        ? <img src={site.identidade.logoUrl} alt="" style={{ height: cb.alturaLogo * 0.7 }} />
        : <span style={{ ...titulo, fontSize: '1.3em' }}>{site.identidade.nomeLoja || 'Sua loja'}</span>;
    const menu = (
        <nav style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            {cb.menu.map((m) => <span key={m.id} style={{ color: m.destaque ? c.destaque : c.texto, fontWeight: 500 }}>{m.rotulo}{m.filhos.length > 0 ? ' ▾' : ''}</span>)}
        </nav>
    );
    const icones = <span style={{ display: 'flex', gap: 10 }}>{cb.mostrarBusca && '🔍'}{cb.mostrarConta && '👤'}{cb.mostrarFavoritos && '♡'}{cb.mostrarSacola && '👜'}</span>;
    const rod = site.rodape;

    return (
        <div style={raiz}>
            <link rel="stylesheet" href={`https://fonts.googleapis.com/css2?${fontes}&display=swap`} />
            {cb.barraAviso.ativa && <div style={{ background: cb.barraAviso.corFundo, color: cb.barraAviso.corTexto, textAlign: 'center', padding: 6, fontSize: '0.8em' }}>{cb.barraAviso.texto}</div>}
            <header style={{ background: c.superficie, borderBottom: `1px solid ${c.borda}`, padding: '12px 16px' }}>
                {cb.layout === 'menu-abaixo' ? (
                    <><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span /> {logo} {icones}</div><div style={{ marginTop: 10 }}>{menu}</div></>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: cb.layout === 'logo-centro' ? '1fr auto 1fr' : 'auto 1fr auto', alignItems: 'center', gap: 12 }}>
                        {cb.layout === 'logo-centro' ? <>{mobile ? <span>☰</span> : menu}{logo}<span style={{ justifySelf: 'end' }}>{icones}</span></> : <>{logo}{mobile ? <span /> : menu}{icones}</>}
                    </div>
                )}
            </header>

            {site.home.secoes.map(secao)}

            <footer style={{ background: rod.corFundo || c.superficie, color: rod.corTexto || c.texto, padding: '24px 16px', marginTop: 24, borderTop: `1px solid ${c.borda}` }}>
                <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : `repeat(${Math.max(1, rod.colunas.length + 1)}, 1fr)`, gap: 20 }}>
                    <div>
                        {rod.mostrarLogo && logo}
                        {rod.mostrarContato && <div style={{ marginTop: 8, fontSize: '0.85em', color: c.textoSuave }}>{site.identidade.endereco}<br />{site.identidade.whatsapp}<br />{site.identidade.horarioAtendimento}</div>}
                    </div>
                    {rod.colunas.map((col) => (
                        <div key={col.id}><b>{col.titulo}</b>{col.links.map((l) => <div key={l.id} style={{ fontSize: '0.85em' }}>{l.rotulo}</div>)}</div>
                    ))}
                </div>
                {rod.redes.length > 0 && <div style={{ marginTop: 14 }}>{rod.redes.map((r) => r.rede).join(' · ')}</div>}
                {rod.mostrarFormasPagamento && <div style={{ marginTop: 10, fontSize: '0.8em', textTransform: 'uppercase' }}>{rod.formasPagamento.join(' · ')}</div>}
                {rod.textoLegal && <div style={{ marginTop: 10, fontSize: '0.75em', color: c.textoSuave }}>{rod.textoLegal}</div>}
            </footer>
        </div>
    );
}
