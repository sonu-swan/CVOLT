import React, { useState } from 'react';
import axios from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import { setUserData } from '../redux/user.Slice.js';
import { ServerUrl } from '../App.jsx';

// Loads Razorpay's checkout script on demand instead of adding it as a
// permanent <script> tag in index.html — keeps it out of the bundle for
// users who never open this modal.
function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

// 100 credits = ₹10. Keep in sync with RUPEES_PER_100_CREDITS on the backend.
const PACKS = [
  { credits: 100, price: 10 },
  { credits: 500, price: 50 },
  { credits: 1000, price: 100 },
];

function BuyCredits({ onClose }) {
  const { userData } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const [loadingPack, setLoadingPack] = useState(null);
  const [error, setError] = useState("");

  const handleBuy = async (pack) => {
    setError("");
    setLoadingPack(pack.credits);

    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        setError("Could not load payment gateway. Check your connection.");
        setLoadingPack(null);
        return;
      }

      const orderResult = await axios.post(
        `${ServerUrl}/api/payment/create-order`,
        { credits: pack.credits },
        { withCredentials: true }
      );

      const { orderId, amount, currency, keyId } = orderResult.data;

      const options = {
        key: keyId,
        amount,
        currency,
        name: "CVOLT",
        description: `${pack.credits} credits`,
        order_id: orderId,
        handler: async (response) => {
          try {
            const verifyResult = await axios.post(
              `${ServerUrl}/api/payment/verify`,
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                credits: pack.credits,
              },
              { withCredentials: true }
            );

            dispatch(setUserData({
              ...userData,
              credits: verifyResult.data.creditsLeft,
            }));
            onClose();
          } catch (err) {
            console.log(err);
            setError("Payment succeeded but verification failed. Contact support.");
          } finally {
            setLoadingPack(null);
          }
        },
        modal: {
          ondismiss: () => setLoadingPack(null),
        },
        prefill: {
          name: userData?.name || "",
          email: userData?.email || "",
        },
        theme: { color: "#16a34a" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.log(err);
      setError("Could not start payment. Try again.");
      setLoadingPack(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>

        <h2 className="text-2xl font-bold text-gray-800 mb-2">Buy Credits</h2>
        <p className="text-gray-500 mb-6">Each interview costs 50 credits.</p>

        {error && (
          <p className="text-red-500 text-sm mb-4">{error}</p>
        )}

        <div className="space-y-3">
          {PACKS.map((pack) => (
            <button
              key={pack.credits}
              onClick={() => handleBuy(pack)}
              disabled={loadingPack !== null}
              className="w-full flex justify-between items-center border border-gray-200 hover:border-green-500 rounded-xl px-5 py-4 transition disabled:opacity-50"
            >
              <span className="font-semibold text-gray-800">
                {pack.credits} credits
              </span>
              <span className="text-green-600 font-bold">
                {loadingPack === pack.credits ? "Processing..." : `₹${pack.price}`}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default BuyCredits;