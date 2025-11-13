import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";

function CarouselCard() {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!api) {
      return;
    }
    
    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap());

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  useEffect(() => {
    if (!api) {
      return;
    }

    const intervalId = setInterval(() => {
      if (api.canScrollNext()) {
        api.scrollNext();
      } else {
        api.scrollTo(0); 
      }
    }, 3000); 

    return () => clearInterval(intervalId);
  }, [api]);

  return (
    <div className="flex flex-col items-center gap-4">
      
      <div className="relative w-full max-w-3xl rounded-2xl p-1 border-4 border-blue-400 bg-white/30 shadow-sm">
        {}
        <img
          src="/global/bunga-jeby-1.png"
          alt=""
          aria-hidden="true"
        className="absolute pointer-events-none z-20 select-none
                    -top-8 -left-8 w-20 h-20
                    sm:-top-12 sm:-left-12 sm:w-28 sm:h-28
                    md:-top-12 md:-left-12 md:w-36 md:h-36
                    lg:-top-20 lg:-left-20 lg:w-44 lg:h-44"
        />
        <img
          src="/global/bunga-jeby-1.png"
          alt=""
          aria-hidden="true"
          className="absolute pointer-events-none z-20 select-none
                    -bottom-8 -right-8 w-20 h-20
                    sm:-bottom-12 sm:-right-12 sm:w-28 sm:h-28
                    md:-bottom-12 md:-right-12 md:w-30 md:h-36
                    lg:-bottom-20 lg:-right-20 lg:w-44 lg:h-44"
          style={{ transform: "scaleX(-1)" }}
        />
        <Carousel 
          className="w-full"
          setApi={setApi}
          opts={{
            align: "start",
            loop: true,
          }}
        >
          <CarouselContent className="h-[150px] sm:h-[200px] w-full sm:w-[500px] md:w-[700px] lg:w-[800px]">
          {Array.from({ length: 5 }).map((_, index) => (
            <CarouselItem key={index}>
              <div className="p-1">
                <Card>
                  <CardContent className="flex items-center justify-center p-6">
                    <span className="text-4xl font-semibold">{index + 1}</span>
                  </CardContent>
                </Card>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
  </Carousel>
  </div>

      <div className="flex gap-2">
        {Array.from({ length: count }).map((_, index) => {
          const isActive = index === current;
          return (
            <button
              key={index}
            
              className={`h-2 rounded-full transition-all duration-300 ${isActive ? "w-8" : "w-2"} cursor-pointer focus:outline-none`}
              
              style={{
                backgroundColor: isActive
                  ? "var(--accent-light-blue, #DAFFF6)"
                  : "var(--semantic-inactive, #87C1FA)",
              }}
              onClick={() => api?.scrollTo(index)}
              aria-label={`Go to slide ${index + 1}`}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--accent-light-blue, #DAFFF6)")}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.backgroundColor = "var(--semantic-inactive, #87C1FA)";
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

export default CarouselCard;
