import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import RootLayout from './components/RootLayout'
import Event from './page/Event'
import Ticket from './page/Ticket'
import Transactions from './page/Transactions'
import Report from './page/Report'
import Dashboard from './page/Dashboard'
import Admin from './page/Admin'
import Promos from './page/Promos'
import Register from './page/Register'
import LoginOrganizer from './page/LoginOrganizer'

const router = createBrowserRouter([
  {
    path : '/register',
    Component : Register
  },
  {
    path: '/login',
    Component : LoginOrganizer
  },

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
        path: '/promos',
        Component: Promos,
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