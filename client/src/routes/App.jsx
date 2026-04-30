import { Outlet } from 'react-router-dom'
import Navbar from '../components/Navbar/Navbar'
import { AlertProvider } from '../contexts/AlertProvider'


function App() {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 transition-colors dark:bg-[radial-gradient(circle_at_top,#1e293b_0%,#020617_45%,#020617_100%)] dark:text-slate-100">
      <AlertProvider>
        <Navbar />
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </AlertProvider>

    </div>
  )
}

export default App
