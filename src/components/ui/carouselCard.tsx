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
      <Carousel 
        className="w-full max-w-3xl"
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

      
      <div className="flex gap-2">
        {Array.from({ length: count }).map((_, index) => (
          <button
            key={index}
            className={`h-2 rounded-full transition-all duration-300 ${
              index === current
                ? "w-8 bg-gray-800"
                : "w-2 bg-gray-300 hover:bg-gray-400"
            }`}
            onClick={() => api?.scrollTo(index)}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

export default CarouselCard;
