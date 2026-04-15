import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom'
import RootLayout from './layouts/RootLayout'
import MainLayout from './layouts/MainLayout'
import ScrollToTop from './components/ScrollToTop'
import Event from './page/Event'
import Ticket from './page/Ticket'
import Transactions from './page/Transactions'
import Report from './page/Report'
import Dashboard from './page/Dashboard'
import Admin from './page/Admin'
import Promos from './page/Promos'
import Register from './page/Register'
import Login from './page/Login'
import Home from './page/Home'
import Explore from './page/Explore'
import DetailEvent from './page/DetailEvent'
import PaymentPortal from './page/PaymentPortal'
import CreateEvent from './page/CreateEvent'
import BecomeOrganizer from './page/BecomeOrganizer'
import Profile from './page/Profile'

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

// Root Layout with ScrollToTop
function RootElement() {
  return (
    <>
      <ScrollToTop />
      <Outlet />
    </>
  )
}

const router = createBrowserRouter([
  {
    element: <RootElement />,
    children: [
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
            Component: Login
          },
        ]
      },

      // ── Public pages ──
      {
        element: <PublicLayout />,
        children: [
          {
            path: '/',
            Component: Home,
          },
          {
            path: '/explore',
            Component: Explore,
          },
          {
            path: '/events/:eventId',
            Component: DetailEvent,
          },
          {
            path: '/payment/:bookingId',
            Component: PaymentPortal,
          },
          {
            path: '/become-organizer',
            Component: BecomeOrganizer,
          },
        ]
      },

      // ── Protected Customer Routes ──
      {
        element: <MainLayout />,
        children: [
          {
            path: '/create-event',
            Component: CreateEvent,
          },
          {
            path: '/profile',
            Component: Profile,
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
    ]
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
)