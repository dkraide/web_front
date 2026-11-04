import { NextRequest, NextResponse } from 'next/server';

// Páginas abertas: landing, login, política, vitrine do setor (tag NFC), tutoriais e páginas de links/download.
const ROTAS_PUBLICAS = ['/', '/login', '/home', '/vitrine', '/tutoriais', '/baixe-app', '/downloads', '/links', '/acessoRemoto'];

function ehPublica(pathname: string) {
    return ROTAS_PUBLICAS.some(r => pathname === r || (r !== '/' && pathname.startsWith(`${r}/`)));
}

/**
 * Barreira de navegação: sem cookie de sessão vai para o login, guardando a rota pedida.
 * Não substitui a autorização da API (o cookie só é checado quanto à presença); evita renderizar
 * telas do painel para quem nunca entrou.
 */
export function middleware(req: NextRequest) {
    const { pathname, search } = req.nextUrl;
    if (ehPublica(pathname) || req.cookies.get('@web_front.token')) {
        return NextResponse.next();
    }
    const login = req.nextUrl.clone();
    login.pathname = '/login';
    login.search = `?redirect=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(login);
}

export const config = {
    // Ignora assets, rotas internas do Next e arquivos com extensão.
    matcher: ['/((?!api|_next|.*\\..*).*)'],
};
