const TELEFONE = '19971037836'

export function whatsappUrl(mensagem: string) {
    return `https://wa.me/55${TELEFONE}?text=${encodeURIComponent(mensagem)}`
}

export interface Novidade {
    id: string
    tag: string
    titulo: string
    data: string
    descricao: string
    imagem?: string
    icone?: 'ifood'
    botao?: { texto: string; url: string }
}

// Novas novidades entram no topo da lista.
export const NOVIDADES: Novidade[] = [
    {
        id: 'tef',
        tag: 'Integração',
        titulo: 'Agora aceitamos TEF!',
        data: '29/10/2026',
        descricao: 'Receba pagamentos em cartão direto na maquininha, integrado ao seu sistema. Entre em contato para mais informações.',
        imagem: '/novidades/tef.webp',
        botao: { texto: 'Falar no WhatsApp (19) 97103-7836', url: whatsappUrl('Olá! Gostaria de saber mais sobre o TEF.') },
    },
    {
        id: 'ifood',
        tag: 'Integração',
        titulo: 'Agora temos integração com o iFood!',
        data: '19/10/2026',
        descricao: 'Gerencie o cardápio do iFood (produtos, preços e complementos) e receba e acompanhe os pedidos direto no sistema. A integração é gratuita: entre em contato com o suporte para ativá-la.',
        icone: 'ifood',
        botao: { texto: 'Falar com o suporte', url: whatsappUrl('Olá! Gostaria de ativar a integração gratuita com o iFood no meu sistema.') },
    },
]

export const TEF_WHATSAPP_URL = NOVIDADES[0].botao!.url

const CHAVE_VISTAS = '@web_front.novidadesVistas'

export function novidadesNaoVistas(): number {
    try {
        const vistas = (localStorage.getItem(CHAVE_VISTAS) || '').split(',')
        return NOVIDADES.filter((n) => !vistas.includes(n.id)).length
    } catch {
        return 0
    }
}

export function marcarNovidadesVistas() {
    try {
        localStorage.setItem(CHAVE_VISTAS, NOVIDADES.map((n) => n.id).join(','))
        window.dispatchEvent(new Event('novidades-vistas'))
    } catch { /* storage indisponivel */ }
}
