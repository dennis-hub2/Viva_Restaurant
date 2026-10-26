/**
 * @file main.jsx
 * @description Application Entry Point and React DOM Root Mount.
 * 
 * Thesis Context:
 * Bootstraps the Viva Restaurant single-page web application, mounting the root
 * React component tree within HTML5 DOM with StrictMode runtime checks enabled.
 * 
 * @module main
 * @author Thesis Research Team
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Mount React component tree to DOM root element
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

