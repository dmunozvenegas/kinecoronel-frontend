import React from 'react'
import ReactDOM from 'react-dom/client'
// 👇 AQUÍ ESTABA MI ERROR: Ahora sí apunta a react-router-dom
import { BrowserRouter } from 'react-router-dom' 
import App from './App'
import { AuthProvider } from './context/AuthContext'
import './index.css'

// Brújula global
import axios from 'axios';
// Si estás en local usa localhost, si estás en producción (build) usa tu dominio
axios.defaults.baseURL = import.meta.env.MODE === 'development' 
    ? 'http://localhost:3000' 
    : 'https://'https://kinecoronel-backend.onrender.com'';
axios.defaults.withCredentials = true;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)