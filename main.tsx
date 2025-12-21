import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

if (typeof window !== 'undefined') {
  console.log("App Version 10.6 initialized");
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)