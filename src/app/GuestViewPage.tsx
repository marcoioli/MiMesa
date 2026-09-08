import GuestView from '../features/guest-view/GuestView';

// Never import useEventStore here: this route reads only the URL fragment.
export default function GuestViewPage() {
  return <GuestView />;
}
