import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import "./main.css"
import "./styles/theme.css"
import "./index.css"
// @github/spark/spark import is excluded and handled externally

createRoot(document.getElementById('root')!).render(
    <App />
)
