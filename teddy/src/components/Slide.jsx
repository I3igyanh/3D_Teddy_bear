function Slide({ slide, scrollPct }) {
  const mid = (slide.from + slide.to) / 2;
  const halfW = (slide.to - slide.from) / 2;
  const dist = Math.abs(scrollPct - mid) / halfW;
  const opacity = dist < 1 ? Math.pow(Math.cos(dist * Math.PI * 0.5), 2) : 0;
  const isLeft = slide.side === "left";

  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        ...(isLeft ? { left: "5%" } : { right: "5%" }),
        transform: `translateY(calc(-50% + ${opacity < 0.01 ? "20px" : "0px"}))`,
        opacity,
        transition: "transform 0.6s ease",
        maxWidth: "220px",
        textAlign: isLeft ? "left" : "right",
        pointerEvents: "none",
      }}
    >
      <p style={{ fontSize: "0.6rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "", marginBottom: "0.5rem" }}>
        {slide.tag}
      </p>
      <h2 style={{ fontFamily: "sans-serif", fontWeight: 800, fontSize: "clamp(1.4rem, 3vw, 2rem)", lineHeight: 1.1, marginBottom: "0.6rem", whiteSpace: "pre-line", color: "#f2ede5" }}>
        {slide.title}
      </h2>
      <p style={{ fontSize: "0.85rem", lineHeight: 1.7, color: "#6a6660", whiteSpace: "pre-line" }}>
        {slide.body}
      </p>
    </div>
  );
}

export default Slide;