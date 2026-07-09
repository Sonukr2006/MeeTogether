import { Outlet, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import AuthBootstrap from '../components/Auth/AuthBootstrap'
import Navbar from '../components/Navbar/Navbar'
import { AlertProvider } from '../contexts/AlertProvider'


function App() {
  const location = useLocation()
  const { currentUser, initialized } = useSelector((state) => state.auth)
  const isHomeRoute = location.pathname === '/'
  const isLandingPage = isHomeRoute && !currentUser && initialized

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 transition-colors dark:bg-[radial-gradient(circle_at_top,#1e293b_0%,#020617_45%,#020617_100%)] dark:text-slate-100">
      <AlertProvider>
        <AuthBootstrap />
        {isLandingPage ? (
          <Outlet />
        ) : (
          <>
            <Navbar />
            <main
              className={`mx-auto max-w-7xl py-6 lg:px-8 ${
                isHomeRoute ? 'px-1 sm:px-3' : 'px-4 sm:px-6'
              }`}
            >
              <Outlet />
            </main>
          </>
        )}
      </AlertProvider>

    </div>
  )
}

export default App
