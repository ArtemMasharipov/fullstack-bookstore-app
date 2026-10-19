/** Break equal sort values by id in the same direction, keeping pages stable. */
export function sortOf(sortBy) {
  const direction = sortBy.startsWith("-") ? -1 : 1;
  return { [sortBy.replace(/^-/, "")]: direction, _id: direction };
}
