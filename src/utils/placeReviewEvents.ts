export type PlaceReviewResource = 'destinations' | 'restaurants' | 'lodgings';

type PlaceReviewChange = {
  resource: PlaceReviewResource;
  resourceId: number;
};

type Listener = (change: PlaceReviewChange) => void;

const listeners = new Set<Listener>();

export function notifyPlaceReviewChanged(change: PlaceReviewChange) {
  listeners.forEach((listener) => listener(change));
}

export function subscribePlaceReviewChanged(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
