export default function CircleBadge() {
  return (
    <div
      className="
      relative
      mt-10
      w-48 h-48
      sm:w-64 sm:h-64
      lg:w-80 lg:h-80
    "
    >
      <img
        src="/src/assets/images/food.png"
        alt="Food"
        className="absolute inset-0 w-full h-full object-cover rounded-full"
      />

      {/* Outer ring */}
      <div className="absolute inset-0 rounded-full border-8 border-[#E25540]" />

      {/* Top Right Arc */}
      <svg
        viewBox="0 0 150 150"
        className="
          absolute -top-3 -right-10
          w-16 h-16
          md:w-24 md:h-24
          lg:w-32 lg:h-32
          pointer-events-none
        "
      >
        <path
          d="M 60 20 A 50 50 0 0 1 80 40"
          stroke="#E25540"
          strokeWidth="10"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M 70 10 A 60 60 0 0 1 95 35"
          stroke="#E25540"
          strokeWidth="10"
          fill="none"
          strokeLinecap="round"
        />
      </svg>

      {/* Bottom Left Arc */}
      <svg
        viewBox="0 0 150 150"
        className="
          absolute -bottom-3 -left-10
          w-16 h-16
          md:w-24 md:h-24
          lg:w-32 lg:h-32
          pointer-events-none
          rotate-180
        "
      >
        <path
          d="M 60 20 A 50 50 0 0 1 80 40"
          stroke="#E25540"
          strokeWidth="10"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M 70 10 A 60 60 0 0 1 95 35"
          stroke="#E25540"
          strokeWidth="10"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
