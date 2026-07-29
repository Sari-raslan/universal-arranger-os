import SingyMark from './SingyMark.jsx';

export default function ProductSection({ data }) {
  return (
    <section className="section" id={data.id} aria-labelledby={`${data.id}-heading`}>
      <div className="container">
        <div className="productCard">
          <div className="productVisual">
            <SingyMark title={data.imgAlt} />
          </div>
          <div className="productBody">
            <span className="statusPill">{data.status}</span>
            <h2 id={`${data.id}-heading`}>{data.title}</h2>
            <p className="productTagline">{data.tagline}</p>
            <ul className="pointList">
              {data.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
