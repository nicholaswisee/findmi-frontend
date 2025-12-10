import CarouselCard from "@/components/ui/carouselCard";

export default function HomePage() {
  return (
    <div className="flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-8 w-full overflow-x-hidden ">
      <div className="w-full max-w-7xl my-6 sm:my-8 lg:my-10">
        <CarouselCard />
      </div>

      <h1
        className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl my-3 sm:my-5 text-center tracking-wide"
        style={{
          color: "#ffd88c",
          textShadow: "0 4px 4px rgba(0,0,0,0.25)",
        }}
      >
        FindMi 2026
      </h1>

      <p
        className="w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-2xl leading-relaxed px-4 mb-8 md:mb-10 lg:mb-12 text-lg font-semibold text-center"
        style={{
          color: "#ffd88c",
          textShadow: "0 4px 4px rgba(0,0,0,0.25)",
          fontFamily: "var(--font-subheading)",
        }}
      >
        FINDMI 2026 merupakan sebuah platform pembelian merchandise dari acara
        tahunan di Insititut Teknologi Bandung yaitu Aku Masuk ITB {`(AMI)`}{" "}
        2026. Kamu dapat membeli seluruh kebutuhan merchandise serta
        perlengkapan panitia yang kamu inginkan di FINDMI!
      </p>

      <a
        href="/catalog"
        className="bg-[#FFC76E] text-[#302a77] font-bold py-2 px-6 rounded-full m-3 drop-shadow-xl hover:bg-[#e6c370] transition duration-300 hover:cursor-pointer text-xl md:text-2xl"
      >
        Lihat Katalog!
      </a>
    </div>
  );
}
