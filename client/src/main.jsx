import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import App from './routes/App.jsx'
import SignIn from './components/SignIn/SignIn.jsx'
import Signup from './components/Signup/Signup.jsx'
import Discussions from './components/Discussions/Discussions.jsx'
import Deployments from './components/Deployments/Deployments.jsx'
import Issues from './components/Issues/Issues.jsx'
import CreatePostPage from './components/CreatePost/CreatePostPage.jsx'
import CreateProjectPage from './components/CreateProject/CreateProjectPage.jsx'
import ForgotPassword from './components/Auth/ForgotPassword.jsx'
import ResetPassword from './components/Auth/ResetPassword.jsx'
import VerifyEmail from './components/Auth/VerifyEmail.jsx'
import RequireAuth from './components/Auth/RequireAuth.jsx'
import GuestOnlyRoute from './components/Auth/GuestOnlyRoute.jsx'
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
        element: <GuestOnlyRoute />,
        children: [
          {
            path: '/sign-in',
            element: <SignIn />,
          },
          {
            path: '/sign-up',
            element: <Signup />,
          },
        ],
      },
      {
        path: '/forgot-password',
        element: <ForgotPassword />,
      },
      {
        path: '/reset-password',
        element: <ResetPassword />,
      },
      {
        path: '/verify-email',
        element: <VerifyEmail />,
      },
      {
        element: <RequireAuth />,
        children: [
          {
            path: '/',
            element: <Home />,
          },
          {
            path: '/discussions',
            element: <Discussions />,
          },
          {
            path: '/deployments',
            element: <Deployments />,
          },
          {
            path: '/issues',
            element: <Issues />,
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
            path: '/create/project',
            element: <CreateProjectPage />,
          },
          {
            path: '/create/post',
            element: <CreatePostPage />,
          },
          {
            path: '/requests',
            element: <Requests />,
          },
          {
            path: '/resume/:userId',
            element: <Resume />,
          },
        ],
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
