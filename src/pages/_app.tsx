import React from 'react';
import '../styles/globals.scss';
import { AuthProvider } from '../contexts/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import SideBar from '@/components/ui/SideBar';
import type { AppProps } from 'next/app'


export default function App({ Component, pageProps }: AppProps) {
      return (
            <AuthProvider>
              <SideBar>
                  <Component {...pageProps} />
                  <ToastContainer autoClose={3000} theme={'dark'}/>
              </SideBar>
            </AuthProvider>
      );
 }