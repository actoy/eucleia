import { Navigate } from "react-router-dom";

import Home from '../views/Home'

const routes = [
  { path: '/', element: <Navigate to="/index" replace/> },
  {
    path: '/index',
    element: <Home />
  }
]

export default routes