const crypto = require("crypto");

// ⚠️ ახალი (კრედიტული) გასაღები
const SECRET = "hP3gV40vV3yhKM2EUeRK1IOrEoTvvhwu";
const MERCH_ID = "4055351";
const CALLBACK = "https://lifestore.ge/api/payment/callback";

const amount = 100; // 1.00 GEL
const desc = "TestOrder";
const orderId = "TRY-CREDIT-KEY-" + Date.now();

// სტანდარტული ფორმულა (Secret თავში)
// Secret | Amount | Currency | MerchID | Desc | OrderID | Callback
const rawString = [
  SECRET,
  amount,
  "GEL",
  MERCH_ID,
  desc,
  orderId,
  CALLBACK,
].join("|");

console.log(`\n🔵 Testing with CREDIT KEY: ${SECRET}`);
console.log(`📝 String: "${rawString}"`);

const signature = crypto.createHash("sha1").update(rawString).digest("hex");

async function sendRequest() {
  const payload = {
    request: {
      amount: amount,
      currency: "GEL",
      merchant_id: Number(MERCH_ID),
      order_desc: desc,
      order_id: orderId,
      server_callback_url: CALLBACK,
      signature: signature,
    },
  };

  try {
    console.log("🚀 Sending request...");
    const res = await fetch("https://pay.flitt.com/api/checkout/url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();

    if (data.response?.response_status === "success") {
      console.log("\n✅✅✅ BINGO! ეს არის სწორი გასაღები!");
      console.log("🔗 Checkout URL:", data.response.checkout_url);
    } else {
      console.log("\n❌ Failed:", data.response?.error_message);
      console.log("დეტალები:", data);
    }
  } catch (e) {
    console.log("Error:", e.message);
  }
}

sendRequest();
