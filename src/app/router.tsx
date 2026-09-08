import { createBrowserRouter, Navigate } from 'react-router-dom';

import EditorPage from './EditorPage';
import GuestViewPage from './GuestViewPage';

export const router = createBrowserRouter([
  { path: '/', element: <EditorPage /> },
  { path: '/invitado', element: <GuestViewPage /> },
  { path: '*', element: <Navigate to="/" replace /> },
]);
