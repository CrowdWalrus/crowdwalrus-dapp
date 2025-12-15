export function HomeHeroBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute left-1/2 top-0 h-[980px] w-[1728px] -translate-x-1/2 -translate-y-[100px] overflow-hidden bg-white-50">
        <div className="absolute left-0 top-[8px] h-[972px] w-[1728px] overflow-hidden bg-white-50">
          <img
            src="/assets/images/home/hero/background-wave-noise.svg"
            alt=""
            className="absolute inset-[37.96%_-2.29%_-25.65%_0] block h-full w-full max-w-none"
            draggable={false}
          />
          <img
            src="/assets/images/home/hero/background-waves.svg"
            alt=""
            className="absolute inset-[24.07%_-2.55%_-25.65%_0] block h-full w-full max-w-none"
            draggable={false}
          />
          <img
            src="/assets/images/home/hero/blocks-vectors.svg"
            alt=""
            className="absolute inset-[10.56%_-0.68%_-6.2%_46.82%] block h-full w-full max-w-none"
            draggable={false}
          />

          <div className="absolute inset-[50.1%_12.11%_19.55%_67.25%] flex items-center justify-center">
            <div className="h-[295px] w-[356.778px] rotate-[180deg]">
              <img
                src="/assets/images/home/hero/block-1.svg"
                alt=""
                className="block h-full w-full max-w-none"
                draggable={false}
              />
            </div>
          </div>

          <img
            src="/assets/images/home/hero/token-3.png"
            alt=""
            className="absolute left-[1034px] top-[524px] h-[172px] w-[191px] object-cover"
            draggable={false}
          />

          <div className="absolute left-[1156.37px] top-[261.2px] flex h-[247.591px] w-[260.254px] items-center justify-center">
            <div className="rotate-[340.239deg]">
              <img
                src="/assets/images/home/hero/token-2.png"
                alt=""
                className="h-[188px] w-[209px] object-cover"
                draggable={false}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
