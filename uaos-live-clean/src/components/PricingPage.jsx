import { StatusBadge } from "./StatusBadge.jsx";
import { launchOffer, pricingPlans } from "../config/pricing.js";

function Price({ plan }) {
  if (plan.launchPriceEur === 0) {
    return <strong className="price">Free</strong>;
  }

  if (plan.launchPriceEur == null) {
    return <strong className="price">{plan.regularPriceEur.toFixed(2)} EUR/month - planned / not for sale</strong>;
  }

  return (
    <div className="priceBlock">
      <strong className="price">{plan.launchPriceEur.toFixed(2)} EUR/month</strong>
      <span>for the first {plan.launchMonths} paid months</span>
      <span>then {plan.regularPriceEur.toFixed(2)} EUR/month</span>
    </div>
  );
}

export function PricingPage() {
  return (
    <main className="page">
      <section className="panel">
        <p className="eyebrow">Founders launch pricing</p>
        <h1>Introductory prices with visible renewal prices</h1>
        <p className="lead">
          The founders price applies to the first three paid months. The regular monthly price begins afterward. {launchOffer.cancellation}.
        </p>

        <div className="cards">
          {pricingPlans.map((plan) => (
            <article className="card" key={plan.id}>
              <StatusBadge status={plan.status} />
              <h2>{plan.name}</h2>
              <p>{plan.text}</p>
              <Price plan={plan} />
              <p><b>{plan.billingLabel}</b></p>

              {plan.requiresPayment && (
                <button type="button" disabled>
                  {plan.status === "planned" ? "Planned - not for sale" : "Checkout under schedule review"}
                </button>
              )}
            </article>
          ))}
        </div>

        <p className="lead">
          Checkout stays disabled until Stripe or PayPal is verified to charge the introductory price for exactly three months and then renew at the regular monthly price.
        </p>
      </section>
    </main>
  );
}
