import { createContext, ReactNode, useState, useEffect  } from "react";
import {destroyCookie, setCookie, parseCookies} from 'nookies';
import Router from 'next/router';
import { api } from "../services/apiClient";
import { toast } from "react-toastify";
import IUsuario from "@/interfaces/IUsuario";

type AuthContextData = {
    signIn: (credentials: SignInProps) =>  Promise<void>;
    signOut: () => void;
    signUp: (credentials: SignUpPropos) => Promise<void>;
    getUser: () => Promise<IUsuario | undefined>;
    updateUser: (user) => Promise<void>;
}
type UserProps = {
    id: string;
    nome: string;
    userName: string;
    type: string;
}
type SignInProps = {
    userName: string;
    password: string;
    empresa?: number
}
type SignUpPropos = {
    name: string;
    userName: string;
    password: string;
}
type AuthProviderProps = {
    children: ReactNode
}

export const AuthContext = createContext({} as AuthContextData)


export function signOut (){
    try{
        console.log('caiu aqui');
        destroyCookie(undefined, '@web_front.token', {
            path: '/'
        });
        destroyCookie(undefined, '@web_front.user', {
            path: '/'
        });
        destroyCookie(undefined, '@web_front.admin',  {
            path: '/'
        });
        sessionStorage.removeItem('user');
        window.location.href = "/";
    }catch{
       console.log('erro ao deslogar');
    }
}

export function AuthProvider({children}: AuthProviderProps){
    async function signIn({userName, password, empresa}: SignInProps){
        try{
            var url = '/User/Login';
            var isPdv = false;
            if(empresa && empresa > 0){
                 url = '/user/LoginPDV',
                 isPdv = true;
            }
          const response = await api.post(url, {
             email: userName,
             password,
             empresaId: empresa
          });
          const {token,  nome,empresaId, empresas, caixa, isContador} =  response.data;
          var user = {
               nome,
               isContador,
               empresaSelecionada: empresaId,
               isPdv,
               usuarioCaixa: caixa,
          }
          setCookie(undefined, '@web_front.token',   token, {
             maxAge: 60 * 60 * 24 * 30, //expirar em 1 mes,
             path: "/" //quais caminhos terao acesso aos cookies
          });
          setCookie(undefined, '@web_front.user',   JSON.stringify(user), {
            maxAge: 60 * 60 * 24 * 30, //expirar em 1 mes,
            path: "/" //quais caminhos terao acesso aos cookies
         });
         setCookie(undefined, '@web_front.empresas',   JSON.stringify(empresas), {
            maxAge: 60 * 60 * 24 * 30, //expirar em 1 mes,
            path: "/" //quais caminhos terao acesso aos cookies
         });
         api.defaults.headers['Authorization'] = `Bearer ${token}`;
         window.location.reload();
         toast.success('Logado com sucesso')
         Router.push('/dashboard');
        }catch(err: any){
            console.log(err);
         toast.error(`Erro ao Acessar: ${err.toString()}`);
        }
    }

    async function signUp({name, userName, password}: SignUpPropos){
        try{ 
            const response = await api.post('/users', {
               name,
               userName,
               password
            });
           toast.success('Conta criada com sucesso')
           Router.push('/');
          }catch(err){
           toast.error("Erro ao acessar");
          }
    }

    async function getUser(): Promise<IUsuario | undefined>{
           var cookies =  parseCookies(undefined);
           var userStr =  cookies['@web_front.user'];
           if(!userStr){
                return undefined;
           }
           return JSON.parse(userStr) as IUsuario;
    }
    async function updateUser(user: IUsuario): Promise<void>{
        setCookie(undefined, '@web_front.user',   JSON.stringify(user), {
            maxAge: 60 * 60 * 24 * 30, //expirar em 1 mes,
            path: "/" //quais caminhos terao acesso aos cookies
         });
 }


    return(
        <AuthContext.Provider value={{updateUser, getUser, signIn, signOut, signUp}}>
              {children}
        </AuthContext.Provider>
    )
}