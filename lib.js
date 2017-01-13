import {union, intersection} from 'lodash'
export const getSameScore = function(a, b) {
  const sum = union(a, b);
  if (sum.length === 0) {
    return 0;
  }
  const intersectionResult = intersection(a, b);
  return intersectionResult.length / sum.length;
};