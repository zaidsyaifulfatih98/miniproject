import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom'
import RootLayout from './layouts/RootLayout'
import MainLayout from './layouts/MainLayout'
import Event from './page/Event'
import Ticket from './page/Ticket'
import Transactions from './page/Transactions'
import Report from './page/Report'
import Dashboard from './page/Dashboard'
import Admin from './page/Admin'
import Promos from './page/Promos'
import Register from './page/Register'
import LoginOrganizer from './page/LoginOrganizer'
import LandingPage from './page/LandingPage'
import Explore from './page/Explore'
import DetailEvent from './page/DetailEvent'

// Public Layout
function PublicLayout() {
  return (
    <MainLayout>
      <Outlet />
    </MainLayout>
  )
}

// Auth Layout
function AuthLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100">
      <Outlet />
    </div>
  )
}

const router = createBrowserRouter([
  // ── Auth pages ──
  {
    element: <AuthLayout />,
    children: [
      {
        path: '/register',
        Component: Register
      },
      {
        path: '/login',
        Component: LoginOrganizer
      },
    ]
  },

  // ── Public pages ──
  {
    element: <PublicLayout />,
    children: [
      {
        path: '/',
        Component: LandingPage,
      },
      {
        path: '/explore',
        Component: Explore,
      },
      {
        path: '/events/:eventId',
        Component: DetailEvent,
      },
    ]
  },

  // ── Dashboard Organizer ──
  {
    element: <RootLayout />,
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
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
)