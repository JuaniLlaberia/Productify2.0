import { useRef } from 'react';
import { useQuery } from 'convex/react';

//Not fully reactive query fn => Ideal when filtering data
export const useStableQuery = ((name, ...args) => {
  const result = useQuery(name, ...args);
  const stored = useRef(result);

  if (result !== undefined) stored.current = result;

  return stored.current;
}) as typeof useQuery;