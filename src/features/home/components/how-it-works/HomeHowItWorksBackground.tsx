export function HomeHowItWorksBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute left-1/2 top-0 h-[980px] w-[1728px] -translate-x-1/2 overflow-hidden">
        <img
          src="/assets/images/home/patterns/grid-gradient.svg"
          alt=""
          className="absolute left-[709px] top-[-67px] h-[1135px] w-[1135px]"
          draggable={false}
        />

        <div className="absolute left-0 top-[8px] h-[972px] w-[1728px] overflow-hidden">
          <img
            src="/assets/images/home/patterns/hex-grid.svg"
            alt=""
            className="absolute inset-[10.56%_-0.68%_-6.2%_46.82%] block h-full w-full max-w-none"
            draggable={false}
          />
        </div>
      </div>
    </div>
  );
}
