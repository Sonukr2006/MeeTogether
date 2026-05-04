import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import App from './routes/App.jsx'
import SignIn from './components/SignIn/SignIn.jsx'
import Signup from './components/Signup/Signup.jsx'
import Discussions from './components/Discussions/Discussions.jsx'
import Profile from './components/Profile/Profile.jsx'
import Home from './components/Home/Home.jsx'
import ProjectRoom from './components/Project/ProjectRoom.jsx'
import Requests from './components/Requests/Requests.jsx'
import Resume from './components/Resume/Resume.jsx'
import { store } from './store/store.js'

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
        path: '/discussions',
        element: <Discussions />,
      },
      {
        path: '/profile/:userId',
        element: <Profile />,
      },
      {
        path: '/projects/:projectId',
        element: <ProjectRoom />,
      },
      {
        path: '/requests',
        element: <Requests />,
      },
      {
        path: '/resume/:userId',
        element: <Resume />,
      }
    ]
  },
])

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>
  </StrictMode>,
)
