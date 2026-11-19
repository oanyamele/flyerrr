export const secondsRemaining = (expiresAt: number) =>
  Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
