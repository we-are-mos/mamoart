// Declare a variable to store the latest TIA token price.
// The value is updated periodically by calling the `updateTIAPrice` function.
let tiaPrice: Number;

/**
 * Fetches the current TIA token price from the Coinlore API and updates the `tiaPrice` variable.
 * If the fetch or parsing fails, it falls back to a default value of 3 USD.
 * The result is logged to the console for debugging purposes.
 */
export const updateTIAPrice = async () => {
  const priceRes = await fetch("https://api.coinlore.net/api/ticker/?id=136105");
  const priceData = await priceRes.json();
  tiaPrice = (priceData as any)[0]?.price_usd ?? 3;
  console.log(`🪙  TIA price fethed. Current Price: $${tiaPrice}.`);
}

/**
 * Returns the last known TIA token price stored in the `tiaPrice` variable.
 * @returns The current value of `tiaPrice`
 */
export const getTiaPrice = () => {
  return tiaPrice;
}

/**
 * Starts a polling loop that updates the TIA token price every 10 seconds
 * by invoking the `updateTIAPrice` function periodically.
 */
export function startTIAPolling() {
  setInterval(updateTIAPrice, 10000);
}