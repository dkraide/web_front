import { GetServerSideProps, GetServerSidePropsContext, GetServerSidePropsResult } from 'next';
import { parseCookies, destroyCookie } from 'nookies';
import { AuthTokenError } from '../services/errors/AuthTokenError';
import IUsuario from '@/interfaces/IUsuario';

//funcao para paginas que so logados podem teer acesso

export function canSSRAuth<P>(fn: GetServerSideProps<P>) {



    return async (ctx: GetServerSidePropsContext): Promise<GetServerSidePropsResult<P>> => {

        const cookies = parseCookies(ctx);

        // Rota que o usuário tentava acessar, para voltar após o login.
        const loginComRedirect = `/login?redirect=${encodeURIComponent(ctx.resolvedUrl)}`;

        const token = cookies['@web_front.token'];
        if (!token) {
            return { redirect: { destination: loginComRedirect, permanent: false } }
        }
        let u: IUsuario | undefined;
        try {
            u = JSON.parse(cookies['@web_front.user']) as IUsuario;
        } catch {
            return { redirect: { destination: loginComRedirect, permanent: false } }
        }

        if (u.isPdv) {
            return {
                redirect: {
                    destination: '/pdv',
                    permanent: false
                }
            }
        }
        if (u.isContador) {
            return {
                redirect: {
                    destination: '/contador',
                    permanent: false
                }
            }
        }



        try {
            return await fn(ctx);
        } catch (err) {
            if (err instanceof AuthTokenError) {
                destroyCookie(ctx, '@web_front.token');

                return {
                    redirect: {
                        destination: loginComRedirect,
                        permanent: false
                    }
                }
            }
            throw err;
        }
    }
}

