/** Shows a whole number as is. (It used to count up from zero; decorative motion was removed in the design-system pass.) */
export function CountUp({ value }: { value: number; ms?: number }) {
  return <>{value}</>;
}
