import { uid } from '@/utils/modasSite';
import { Area, Grupo, Linha, Lista, Num, Sel, Sw, Txt } from '../fields';
import { TabProps } from '../common';

export default function CatalogoTab({ site, update }: TabProps) {
    const c = site.catalogo;
    const p = site.produto;
    const k = site.checkout;
    return (
        <>
            <Grupo titulo="Listagem de produtos">
                <Linha>
                    <Num label="Colunas (computador)" min={2} max={6} value={c.colunasDesktop} onChange={(v) => update((d) => { d.catalogo.colunasDesktop = v; })} />
                    <Num label="Colunas (celular)" min={1} max={3} value={c.colunasMobile} onChange={(v) => update((d) => { d.catalogo.colunasMobile = v; })} />
                    <Sel label="Proporção da foto" value={c.proporcaoImagem}
                        opcoes={[{ valor: '1:1', rotulo: 'Quadrada (1:1)' }, { valor: '4:5', rotulo: '4:5' }, { valor: '3:4', rotulo: '3:4' }, { valor: '2:3', rotulo: 'Alta (2:3)' }]}
                        onChange={(v) => update((d) => { d.catalogo.proporcaoImagem = v; })} />
                    <Num label="Produtos por página" min={8} max={96} value={c.produtosPorPagina} onChange={(v) => update((d) => { d.catalogo.produtosPorPagina = v; })} />
                </Linha>
                <Sel label="Ordenação padrão" value={c.ordenacaoPadrao}
                    opcoes={[{ valor: 'recentes', rotulo: 'Mais recentes' }, { valor: 'menor-preco', rotulo: 'Menor preço' }, { valor: 'maior-preco', rotulo: 'Maior preço' }, { valor: 'nome', rotulo: 'Nome (A–Z)' }]}
                    onChange={(v) => update((d) => { d.catalogo.ordenacaoPadrao = v; })} />
                <Sw label="Trocar para a 2ª foto ao passar o mouse" value={c.trocarImagemNoHover} onChange={(v) => update((d) => { d.catalogo.trocarImagemNoHover = v; })} />
                <Sw label="Mostrar cores disponíveis no card" value={c.mostrarCoresNoCard} onChange={(v) => update((d) => { d.catalogo.mostrarCoresNoCard = v; })} />
                <Sw label="Mostrar selo de desconto (%)" value={c.mostrarBadgeDesconto} onChange={(v) => update((d) => { d.catalogo.mostrarBadgeDesconto = v; })} />
                <Sw label="Mostrar selo “Novidade”" value={c.mostrarBadgeNovidade} onChange={(v) => update((d) => { d.catalogo.mostrarBadgeNovidade = v; })} />
                <Sw label="Mostrar parcelamento" value={c.mostrarParcelamento} onChange={(v) => update((d) => { d.catalogo.mostrarParcelamento = v; })} />
                {c.mostrarParcelamento && (
                    <Linha>
                        <Num label="Máximo de parcelas" min={1} max={24} value={c.parcelasMaximas} onChange={(v) => update((d) => { d.catalogo.parcelasMaximas = v; })} />
                        <Num label="Valor mínimo da parcela (R$)" min={0} step={5} value={c.parcelaMinima} onChange={(v) => update((d) => { d.catalogo.parcelaMinima = v; })} />
                    </Linha>
                )}
            </Grupo>

            <Grupo titulo="Filtros disponíveis" aberto={false}>
                <Sw label="Categoria" value={c.filtros.categoria} onChange={(v) => update((d) => { d.catalogo.filtros.categoria = v; })} />
                <Sw label="Tamanho" value={c.filtros.tamanho} onChange={(v) => update((d) => { d.catalogo.filtros.tamanho = v; })} />
                <Sw label="Cor" value={c.filtros.cor} onChange={(v) => update((d) => { d.catalogo.filtros.cor = v; })} />
                <Sw label="Faixa de preço" value={c.filtros.preco} onChange={(v) => update((d) => { d.catalogo.filtros.preco = v; })} />
            </Grupo>

            <Grupo titulo="Página do produto">
                <Linha>
                    <Sel label="Galeria de fotos" value={p.estiloGaleria}
                        opcoes={[{ valor: 'miniaturas-lateral', rotulo: 'Miniaturas na lateral' }, { valor: 'miniaturas-abaixo', rotulo: 'Miniaturas abaixo' }, { valor: 'rolagem', rotulo: 'Rolagem vertical' }]}
                        onChange={(v) => update((d) => { d.produto.estiloGaleria = v; })} />
                    <Sel label="Seletor de cor" value={p.estiloSeletorCor}
                        opcoes={[{ valor: 'bolinha', rotulo: 'Bolinhas' }, { valor: 'miniatura', rotulo: 'Miniaturas da foto' }, { valor: 'texto', rotulo: 'Texto' }]}
                        onChange={(v) => update((d) => { d.produto.estiloSeletorCor = v; })} />
                    <Sel label="Seletor de tamanho" value={p.estiloSeletorTamanho}
                        opcoes={[{ valor: 'quadrado', rotulo: 'Quadrados' }, { valor: 'redondo', rotulo: 'Redondos' }, { valor: 'lista', rotulo: 'Lista' }]}
                        onChange={(v) => update((d) => { d.produto.estiloSeletorTamanho = v; })} />
                </Linha>
                <Sw label="Zoom na foto" value={p.zoomImagem} onChange={(v) => update((d) => { d.produto.zoomImagem = v; })} />
                <Sw label="Calcular frete por CEP" value={p.mostrarFreteCep} onChange={(v) => update((d) => { d.produto.mostrarFreteCep = v; })} />
                <Sw label="Mostrar produtos relacionados" value={p.mostrarRelacionados} onChange={(v) => update((d) => { d.produto.mostrarRelacionados = v; })} />
                <Sw label="Botão de compartilhar" value={p.mostrarCompartilhar} onChange={(v) => update((d) => { d.produto.mostrarCompartilhar = v; })} />
                <Sw label="Avisar “últimas unidades”" value={p.mostrarAvisoEstoqueBaixo} onChange={(v) => update((d) => { d.produto.mostrarAvisoEstoqueBaixo = v; })} />
                {p.mostrarAvisoEstoqueBaixo && (
                    <Num label="Avisar quando restar até (un.)" min={1} max={50} value={p.limiteEstoqueBaixo} onChange={(v) => update((d) => { d.produto.limiteEstoqueBaixo = v; })} />
                )}
                <Sw label="Mostrar tabela de medidas" value={p.mostrarTabelaMedidas} onChange={(v) => update((d) => { d.produto.mostrarTabelaMedidas = v; })} />
                {p.mostrarTabelaMedidas && (
                    <Area label="Tabela de medidas" rows={6} dica="Texto livre. Ex.: P — busto 84 / cintura 64…"
                        value={p.tabelaMedidas} onChange={(v) => update((d) => { d.produto.tabelaMedidas = v; })} />
                )}
                <Area label="Texto de trocas e devoluções (exibido no produto)" rows={3} value={p.textoTrocas} onChange={(v) => update((d) => { d.produto.textoTrocas = v; })} />
            </Grupo>

            <Grupo titulo="Pedido e finalização">
                <Sw label="Permitir entrega" value={k.permitirEntrega} onChange={(v) => update((d) => { d.checkout.permitirEntrega = v; })} />
                <Sw label="Permitir retirada na loja" value={k.permitirRetirada} onChange={(v) => update((d) => { d.checkout.permitirRetirada = v; })} />
                <Sw label="Exigir CPF" value={k.exigirCpf} onChange={(v) => update((d) => { d.checkout.exigirCpf = v; })} />
                <Sw label="Campo de observação do pedido" value={k.pedirObservacao} onChange={(v) => update((d) => { d.checkout.pedirObservacao = v; })} />
                <Sw label="Aceitar cupom de desconto" value={k.permitirCupom} onChange={(v) => update((d) => { d.checkout.permitirCupom = v; })} />
                <Sw label="Finalizar pedido pelo WhatsApp" value={k.finalizarPeloWhatsapp} onChange={(v) => update((d) => { d.checkout.finalizarPeloWhatsapp = v; })} />
                <Num label="Pedido mínimo (R$)" min={0} step={10} value={k.pedidoMinimo} onChange={(v) => update((d) => { d.checkout.pedidoMinimo = v; })} />
                <Num label="Taxa de entrega (R$)" min={0} step={1} value={k.taxaEntrega} onChange={(v) => update((d) => { d.checkout.taxaEntrega = v; })} />
                <Num label="Frete grátis acima de (R$, 0 = desligado)" min={0} step={10} value={k.freteGratisAcima} onChange={(v) => update((d) => { d.checkout.freteGratisAcima = v; })} />
                <Sw label="Aceitar Pix (na entrega/retirada)" value={k.aceitaPix} onChange={(v) => update((d) => { d.checkout.aceitaPix = v; })} />
                <Sw label="Aceitar dinheiro" value={k.aceitaDinheiro} onChange={(v) => update((d) => { d.checkout.aceitaDinheiro = v; })} />
                <Sw label="Aceitar cartão (maquininha)" value={k.aceitaCartao} onChange={(v) => update((d) => { d.checkout.aceitaCartao = v; })} />
                <Txt label="Mensagem na retirada" dica="Ex.: Retire de seg a sáb, das 9h às 18h." value={k.mensagemRetirada} onChange={(v) => update((d) => { d.checkout.mensagemRetirada = v; })} />
                <Txt label="Mensagem de pedido confirmado" value={k.mensagemConfirmacao} onChange={(v) => update((d) => { d.checkout.mensagemConfirmacao = v; })} />
            </Grupo>

            <Grupo titulo="Zonas de entrega (por CEP)" aberto={false}>
                <p style={{ fontSize: 13, opacity: 0.75, margin: '0 0 8px' }}>
                    Sem nenhuma zona, vale a taxa única acima para qualquer CEP. Com zonas, o site só entrega nos CEPs
                    listados (quem estiver fora pode escolher retirar na loja). Cada zona tem taxa e prazo próprios.
                    Se um CEP cair em mais de uma zona, vale a primeira da lista.
                </p>
                <Lista
                    itens={k.zonasEntrega ?? []}
                    onChange={(zonas) => update((d) => { d.checkout.zonasEntrega = zonas; })}
                    novo={() => ({ id: uid(), nome: 'Zona', cepInicial: '', cepFinal: '', taxa: 0, prazo: '' })}
                    titulo={(z) => `${z.nome} — R$ ${Number(z.taxa).toFixed(2).replace('.', ',')}`}
                    render={(z, setZ) => (
                        <>
                            <Txt label="Nome da zona" value={z.nome} onChange={(v) => setZ({ nome: v })} />
                            <Linha>
                                <Txt label="CEP inicial" placeholder="13000000" value={z.cepInicial}
                                    onChange={(v) => setZ({ cepInicial: v.replace(/\D/g, '').slice(0, 8) })} />
                                <Txt label="CEP final" placeholder="13099999" value={z.cepFinal}
                                    onChange={(v) => setZ({ cepFinal: v.replace(/\D/g, '').slice(0, 8) })} />
                            </Linha>
                            <Linha>
                                <Num label="Taxa (R$)" min={0} step={1} value={z.taxa} onChange={(v) => setZ({ taxa: v })} />
                                <Txt label="Prazo" placeholder="1 a 2 dias úteis" value={z.prazo} onChange={(v) => setZ({ prazo: v })} />
                            </Linha>
                        </>
                    )}
                />
            </Grupo>
        </>
    );
}
