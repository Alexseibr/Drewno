export const HOUSES = [
  { id: "h1", title: "Домик 1 (до 4 гостей)", maxGuests: 4 },
  { id: "h2", title: "Домик 2 (до 4 гостей)", maxGuests: 4 },
  { id: "h3", title: "Домик 3 (до 4 гостей)", maxGuests: 4 },
  { id: "h4", title: "Большой дом (до 6 гостей)", maxGuests: 6 },
];

export interface AvailabilityEntry {
  roomId: string;
}

export function selectAvailableHouses(
  availability: AvailabilityEntry[],
  totalGuests: number,
) {
  return HOUSES.filter((house) => house.maxGuests >= totalGuests).filter((house) =>
    availability.some((entry) => entry.roomId === house.id),
  );
}
