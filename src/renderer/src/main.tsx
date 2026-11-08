import './assets/main.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { ListProvider } from './context/ListContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ListProvider>
      <App />
    </ListProvider>
  </StrictMode>
)
