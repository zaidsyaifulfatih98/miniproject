import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import RootLayout from './components/RootLayout'
import Event from './page/Event'
import Ticket from './page/Ticket'
import Customers from './page/Customers'
import Transactions from './page/Transactions'
import Report from './page/Report'
import Dashboard from './page/Dashboard'
import Admin from './page/Admin'

const router = createBrowserRouter([
  {
    element : <RootLayout/>,
    children: [
      {
        path: '/dashboard',
        Component: Dashboard,

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
        path: '/customers',
        Component: Customers,
      },
      {
        path: '/transactions',
        Component: Transactions,
      },
      {
        path: '/report',
        Component: Report,
      },
      {
        path: '/admin',
        Component: Admin,
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