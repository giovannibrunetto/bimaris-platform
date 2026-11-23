export function getOperatorDestination(next?: string) {
  if (typeof next !== "string") return undefined;
  return /^\/area-operatore(?:[/?#]|$)/.test(next) ? next : undefined;
}
