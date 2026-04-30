import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import App from './routes/App.jsx'
import SignIn from './components/SignIn/SignIn.jsx'
import { Route } from 'lucide-react'
import Signup from './components/Signup/Signup.jsx'
import Profile from './components/Profile/Profile.jsx'
import Home from './components/Home/Home.jsx'

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children : [
      {
        path: '/',
        element: <Home />,
      },
      {
        path: '/sign-in',
        element: <SignIn />,
      },
      {
        path: '/sign-up',
        element: <Signup />,
      },
      {
        path: '/profile/:user-id',
        element: <Profile />,
      }
    ]
  },
])

createRoot(document.getElementById('root')).render(
  <StrictMode>
      <RouterProvider router={router} />
  </StrictMode>,
)
