import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ChakraProvider } from '@chakra-ui/react'
import theme from './theme'
import App from './App'
import { AuthProvider } from './lib/auth'
import { RosterProvider } from './lib/rosterStore'
import { SplashProvider } from './components/ui/Splash'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ChakraProvider theme={theme}>
        <AuthProvider>
          <RosterProvider>
            <SplashProvider>
              <App />
            </SplashProvider>
          </RosterProvider>
        </AuthProvider>
      </ChakraProvider>
    </BrowserRouter>
  </React.StrictMode>
)
