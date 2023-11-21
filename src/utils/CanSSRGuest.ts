import {GetServerSideProps, GetServerSidePropsContext, GetServerSidePropsResult} from 'next';

import {parseCookies} from'nookies';

export function canSSRGuest<P>(fn: GetServerSideProps<P>){
    return async (ctx: GetServerSidePropsContext): Promise<GetServerSidePropsResult<P>> =>{
         
        //se o cara tentar acessar com login, redirecionamos
        const cookies = parseCookies(ctx);
        const admin  = cookies['@web_front.admin'];
        if(cookies['@web_front.token']){
            return {
                redirect:{
                    destination: '/dashboard',
                    permanent: false
                }
            }
        }

        return await fn(ctx);

    }
}