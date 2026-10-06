import { Area, Grupo, Img, Sw, Txt } from '../fields';
import { TabProps } from '../common';

export default function AvancadoTab({ site, update }: TabProps) {
    const s = site.seo;
    const i = site.integracoes;
    return (
        <>
            <Grupo titulo="Google e redes (SEO)">
                <Txt label="Título do site" dica="Aparece na aba do navegador e no Google." value={s.titulo} onChange={(v) => update((d) => { d.seo.titulo = v; })} />
                <Area label="Descrição" rows={3} dica="Até ~160 caracteres." value={s.descricao} onChange={(v) => update((d) => { d.seo.descricao = v; })} />
                <Img label="Imagem de compartilhamento" dica="Prévia ao compartilhar o link. Sugestão: 1200×630." value={s.imagemCompartilhamento} onChange={(v) => update((d) => { d.seo.imagemCompartilhamento = v; })} />
                <Sw label="Permitir que o Google indexe o site" value={s.indexavel} onChange={(v) => update((d) => { d.seo.indexavel = v; })} />
            </Grupo>

            <Grupo titulo="Integrações">
                <Txt label="Google Analytics (ID de medição)" placeholder="G-XXXXXXXXXX" value={i.googleAnalyticsId} onChange={(v) => update((d) => { d.integracoes.googleAnalyticsId = v.trim(); })} />
                <Txt label="Meta Pixel (ID)" placeholder="1234567890" value={i.metaPixelId} onChange={(v) => update((d) => { d.integracoes.metaPixelId = v.trim(); })} />
                <Sw label="Botão flutuante do WhatsApp" value={i.botaoWhatsappFlutuante} onChange={(v) => update((d) => { d.integracoes.botaoWhatsappFlutuante = v; })} />
                {i.botaoWhatsappFlutuante && (
                    <Txt label="Mensagem inicial" value={i.mensagemWhatsapp} onChange={(v) => update((d) => { d.integracoes.mensagemWhatsapp = v; })} />
                )}
            </Grupo>

            <Grupo titulo="CSS personalizado" aberto={false}>
                <Area label="CSS" rows={8} dica="Para ajustes finos de aparência. Não é possível inserir scripts."
                    value={i.cssPersonalizado} onChange={(v) => update((d) => { d.integracoes.cssPersonalizado = v; })} />
            </Grupo>
        </>
    );
}
