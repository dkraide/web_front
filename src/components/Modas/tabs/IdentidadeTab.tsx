import { Area, Grupo, Img, Linha, Txt } from '../fields';
import { TabProps } from '../common';

export default function IdentidadeTab({ site, update }: TabProps) {
    const i = site.identidade;
    return (
        <>
            <Grupo titulo="Marca">
                <Linha>
                    <Txt label="Nome da loja" value={i.nomeLoja} onChange={(v) => update((d) => { d.identidade.nomeLoja = v; })} />
                    <Txt label="Slogan" value={i.slogan} onChange={(v) => update((d) => { d.identidade.slogan = v; })} />
                </Linha>
                <Linha>
                    <Img label="Logo" value={i.logoUrl} onChange={(v) => update((d) => { d.identidade.logoUrl = v; })} />
                    <Img label="Logo para fundo escuro" dica="Opcional. Usada quando o cabeçalho é transparente sobre o banner."
                        value={i.logoEscuraUrl} onChange={(v) => update((d) => { d.identidade.logoEscuraUrl = v; })} />
                    <Img label="Favicon" dica="Ícone quadrado da aba do navegador."
                        value={i.faviconUrl} onChange={(v) => update((d) => { d.identidade.faviconUrl = v; })} />
                </Linha>
            </Grupo>
            <Grupo titulo="Contato">
                <Linha>
                    <Txt label="WhatsApp" placeholder="5519999998888" dica="Somente números, com DDI e DDD."
                        value={i.whatsapp} onChange={(v) => update((d) => { d.identidade.whatsapp = v; })} />
                    <Txt label="E-mail" value={i.email} onChange={(v) => update((d) => { d.identidade.email = v; })} />
                    <Txt label="Telefone" value={i.telefone} onChange={(v) => update((d) => { d.identidade.telefone = v; })} />
                </Linha>
                <Area label="Endereço da loja" rows={2} value={i.endereco} onChange={(v) => update((d) => { d.identidade.endereco = v; })} />
                <Txt label="Horário de atendimento" placeholder="Seg a Sáb, 9h às 18h"
                    value={i.horarioAtendimento} onChange={(v) => update((d) => { d.identidade.horarioAtendimento = v; })} />
            </Grupo>
        </>
    );
}
