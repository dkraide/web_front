import {GetServerSideProps, GetServerSidePropsContext, GetServerSidePropsResult} from 'next';
import {parseCookies, destroyCookie} from'nookies';
import { AuthTokenError } from '../services/errors/AuthTokenError';
import IUsuario from '@/interfaces/IUsuario';

//funcao para paginas que so logados podem teer acesso

export function CanSSRContador<P>(fn: GetServerSideProps<P>){
   


    return async (ctx:GetServerSidePropsContext): Promise<GetServerSidePropsResult<P>> =>{

        const cookies = parseCookies(ctx);
       
        const token  = cookies['@web_front.token'];
        var userStr =  cookies['@web_front.user'];
        var u =  JSON.parse(userStr) as IUsuario;
        if(!token){
            return{
                redirect:{
                      destination: '/',
                      permanent: false
                }
            }
        }

        if(u.isPdv){
            return{
                redirect:{
                      destination: '/pdv',
                      permanent: false
                }
            }
        }
        if(!u.isContador){
            return{
                redirect:{
                    destination: '/dashboard',
                    permanent: false
                }
            }
        }



        try{
        return await fn(ctx);
        }catch(err){
          if(err instanceof AuthTokenError){
             destroyCookie(ctx, '@nextauth.token');

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

