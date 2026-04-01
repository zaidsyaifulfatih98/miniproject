import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Page from './page/Page'
import RootLayout from './components/RootLayout'
import Event from './page/Event'
import Ticket from './page/Ticket'
import Users from './page/Users'
import Transactions from './page/Transactions'

const router = createBrowserRouter([
  {
    element : <RootLayout/>,
    children: [
      {
        path: '/',
        Component: Page,

      }, 
      {
        path: '/event',
        Component: Event,
      },
      {
        path: '/ticket',
        Component: Ticket,
      },
      {
        path: '/users',
        Component: Users,
      },
      {
        path: '/transactions',
        Component: Transactions,
      }
    ]
  },
  {
    
  },
  
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
)