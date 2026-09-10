import { createBrowserRouter, Navigate } from 'react-router-dom';

import EventForm from '../features/event/EventForm';

import EditorPage from './EditorPage';
import GuestViewPage from './GuestViewPage';
import HomePage from './HomePage';

export const router = createBrowserRouter([
  { path: '/', element: <HomePage /> },
  { path: '/nuevo', element: <EventForm /> },
  { path: '/plano', element: <EditorPage /> },
  { path: '/invitado', element: <GuestViewPage /> },
  { path: '*', element: <Navigate to="/" replace /> },
]);
