import { Star } from "lucide-react";

const Card = () => {
  return (
    <div
      className="
      relative
      bg-white
      rounded-3xl
      p-4
      w-56
      shadow-[6px_8px_0px_rgba(0,0,0,0.6)]
    "
    >
      {/* IMAGE */}
      <div className="flex justify-center -mt-16 mb-3">
        <div className="w-32 h-32 rounded-full border-6 border-[#E25540] overflow-hidden bg-white">
          <img
            src="/src/assets/images/food.png"
            alt="Berries Salad"
            className="w-full h-full object-cover rounded-full"
          />
        </div>
      </div>

      {/* PRICE + RATING */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xl font-bold">$50.00</span>
        <div className="flex items-center gap-1 text-[#F5A623] font-semibold">
          <Star size={16} fill="#F5A623" />
          5.0
        </div>
      </div>

      {/* TITLE */}
      <h3 className="text-xl font-carter mb-3 text-[#2D281A]">Berries Salad</h3>

      {/* CTA */}
      <button className="flex items-center gap-2 text-[#E25540] font-semibold hover:gap-3 transition-all">
        Order Now <span>→</span>
      </button>
    </div>
  );
};

export default Card;
