import {GetServerSideProps, GetServerSidePropsContext, GetServerSidePropsResult} from 'next';
import {parseCookies, destroyCookie} from'nookies';
import { AuthTokenError } from '../services/errors/AuthTokenError';

//funcao para paginas que so logados podem teer acesso

export function canSSRAdmin<P>(fn: GetServerSideProps<P>){
   


    return async (ctx:GetServerSidePropsContext): Promise<GetServerSidePropsResult<P>> =>{

        const cookies = parseCookies(ctx);
       
        const token  = cookies['@web_front.token'];
        const admin  = cookies['@web_front.admin'];
        
        if(!token || !admin){
            return{
                redirect:{
                      destination: '/',
                      permanent: false
                }
            }
        }


        try{
        return await fn(ctx);
        }catch(err){
          if(err instanceof AuthTokenError){
             destroyCookie(ctx, '@nextauth.token');
             destroyCookie(ctx, '@nextauth.admin');
             return{
                redirect:{
                    destination: '/',
                    permanent: false
                }
             }
          }
        }
    }
}

