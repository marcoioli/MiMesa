import EventForm from '../features/event/EventForm';
import { useEventStore } from '../store/useEventStore';

import AppLayout from './AppLayout';

/** RF-02: the editor shell only exists once an event has been created. */
export default function EditorPage() {
  const event = useEventStore((s) => s.event);

  return event ? <AppLayout /> : <EventForm />;
}
