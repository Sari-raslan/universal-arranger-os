export default function ProductCard({ product, onOpen }) {
  return (
    <article className="productCard homeCard">
      <span className="statusPill">{product.status}</span>
      <h2>{product.title}</h2>
      <p className="productTagline">{product.tagline}</p>
      <p className="proofLine">{product.proof}</p>
      <ul className="pointList">
        {product.points.slice(0, 3).map((point) => (
          <li key={point}>{point}</li>
        ))}
      </ul>
      <button type="button" className="btn btnPrimary" onClick={onOpen}>
        {product.title}
      </button>
    </article>
  );
}
