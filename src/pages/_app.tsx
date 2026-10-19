import React from 'react';
import '../styles/globals.scss';
import { AuthProvider } from '../contexts/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import SideBar from '@/components/ui/SideBar';
import type { AppProps } from 'next/app'
import { useRouter } from 'next/router';
import AnuncioIfood from '@/components/Modals/AnuncioIfood';

export default function App({ Component, pageProps }: AppProps) {
      const router = useRouter();
      // Paginas publicas (vitrine do setor, aberta pela tag NFC): sem login nem menu lateral.
      if (router.pathname.startsWith('/vitrine')) {
            return <Component {...pageProps} />;
      }
      return (
            <AuthProvider>
              <SideBar>
                  <Component {...pageProps} />
                  <ToastContainer autoClose={3000} theme={'dark'}/>
                  <AnuncioIfood />
              </SideBar>
            </AuthProvider>
      );
 }