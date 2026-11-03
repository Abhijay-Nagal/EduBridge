import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import './index.css'

// Most forms await their save without a try/catch. If the server rejects one
// (duplicate phone number, server stopped, …) tell the user instead of failing silently.
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason?.name === 'Error' && 'status' in event.reason) {
    event.preventDefault()
    window.alert(event.reason.message)
  }
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
