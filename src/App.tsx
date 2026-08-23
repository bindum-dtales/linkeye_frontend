/**
 * Application root.
 *
 * The router lives here and nowhere else — swapping `BrowserRouter` for
 * `HashRouter` is a one-line change, paired with `toHref` in `lib/routing.ts`.
 */
import { BrowserRouter } from 'react-router-dom'
import { AppRoutes } from './routes'

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}
