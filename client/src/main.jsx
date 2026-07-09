/* eslint-disable react-refresh/only-export-components */
import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import App from './routes/App.jsx'
import RequireAuth from './components/Auth/RequireAuth.jsx'
import GuestOnlyRoute from './components/Auth/GuestOnlyRoute.jsx'
import PageLoadingState from './components/ui/PageLoadingState.jsx'
import { store } from './store/store.js'

const SignIn = lazy(() => import('./components/SignIn/SignIn.jsx'))
const Signup = lazy(() => import('./components/Signup/Signup.jsx'))
const Discussions = lazy(() => import('./components/Discussions/Discussions.jsx'))
const Deployments = lazy(() => import('./components/Deployments/Deployments.jsx'))
const Issues = lazy(() => import('./components/Issues/Issues.jsx'))
const CreatePostPage = lazy(() => import('./components/CreatePost/CreatePostPage.jsx'))
const CreateProjectPage = lazy(() => import('./components/CreateProject/CreateProjectPage.jsx'))
const ForgotPassword = lazy(() => import('./components/Auth/ForgotPassword.jsx'))
const ResetPassword = lazy(() => import('./components/Auth/ResetPassword.jsx'))
const VerifyEmail = lazy(() => import('./components/Auth/VerifyEmail.jsx'))
const Profile = lazy(() => import('./components/Profile/Profile.jsx'))
const LandingOrHome = lazy(() => import('./components/Landing/LandingOrHome.jsx'))
const ProjectRoom = lazy(() => import('./components/Project/ProjectRoom.jsx'))
const Requests = lazy(() => import('./components/Requests/Requests.jsx'))
const Resume = lazy(() => import('./components/Resume/Resume.jsx'))

function withSuspense(element, title, message) {
  return (
    <Suspense
      fallback={
        <PageLoadingState
          className="max-w-3xl"
          title={title}
          message={message}
        />
      }
    >
      {element}
    </Suspense>
  )
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children : [
      {
        index: true,
        element: withSuspense(
          <LandingOrHome />,
          'Loading',
          'Preparing your experience.',
        ),
      },
      {
        element: <GuestOnlyRoute />,
        children: [
          {
            path: '/sign-in',
            element: withSuspense(
              <SignIn />,
              'Loading sign in',
              'We’re getting the authentication screen ready.',
            ),
          },
          {
            path: '/sign-up',
            element: withSuspense(
              <Signup />,
              'Loading sign up',
              'We’re preparing account creation for you.',
            ),
          },
        ],
      },
      {
        path: '/forgot-password',
        element: withSuspense(
          <ForgotPassword />,
          'Loading password help',
          'We’re opening the recovery flow.',
        ),
      },
      {
        path: '/reset-password',
        element: withSuspense(
          <ResetPassword />,
          'Loading reset form',
          'We’re preparing your password reset screen.',
        ),
      },
      {
        path: '/verify-email',
        element: withSuspense(
          <VerifyEmail />,
          'Loading email verification',
          'We’re checking your verification flow.',
        ),
      },
      {
        element: <RequireAuth />,
        children: [
          {
            path: '/discussions',
            element: withSuspense(
              <Discussions />,
              'Loading discussions',
              'We’re opening live builder conversations.',
            ),
          },
          {
            path: '/deployments',
            element: withSuspense(
              <Deployments />,
              'Loading deployments',
              'We’re pulling the latest launch status.',
            ),
          },
          {
            path: '/issues',
            element: withSuspense(
              <Issues />,
              'Loading issues',
              'We’re fetching the active build blockers.',
            ),
          },
          {
            path: '/profile/:userId',
            element: withSuspense(
              <Profile />,
              'Loading profile',
              'We’re opening the builder profile.',
            ),
          },
          {
            path: '/projects/:projectId',
            element: withSuspense(
              <ProjectRoom />,
              'Loading project room',
              'We’re opening the build workspace.',
            ),
          },
          {
            path: '/create/project',
            element: withSuspense(
              <CreateProjectPage />,
              'Loading project creation',
              'We’re preparing the new build flow.',
            ),
          },
          {
            path: '/create/post',
            element: withSuspense(
              <CreatePostPage />,
              'Loading post creation',
              'We’re getting the update composer ready.',
            ),
          },
          {
            path: '/requests',
            element: withSuspense(
              <Requests />,
              'Loading requests',
              'We’re opening the collaboration queue.',
            ),
          },
          {
            path: '/resume/:userId',
            element: withSuspense(
              <Resume />,
              'Loading resume',
              'We’re preparing the proof resume view.',
            ),
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
