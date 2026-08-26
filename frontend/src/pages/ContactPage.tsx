export function ContactPage() {
  return (
    <div className="contact-page">
      <div className="page-hero">
        <h1>Contact us</h1>
        <p>Questions about an order, a bespoke design, or delivery? We're happy to help.</p>
      </div>

      <div className="contact-grid">
        <div className="run-detail">
          <h3>Head Office</h3>
          <address>
            Bespoke Furniture Creations
            <br />
            Effingham Works, Effingham Road
            <br />
            Sheffield, S9 1AT
            <br />
            United Kingdom
          </address>
        </div>

        <div className="run-detail">
          <h3>Email</h3>
          <p>
            General enquiries:
            <br />
            <a href="mailto:hello@bespokefurniturecreations.co.uk">hello@bespokefurniturecreations.co.uk</a>
          </p>
          <p>
            Order support:
            <br />
            <a href="mailto:orders@bespokefurniturecreations.co.uk">orders@bespokefurniturecreations.co.uk</a>
          </p>
        </div>

        <div className="run-detail">
          <h3>Phone</h3>
          <p>
            <a href="tel:+441144960142">0114 496 0142</a>
          </p>
          <p className="hint">Monday–Friday, 9am–5pm. Closed weekends and bank holidays.</p>
        </div>
      </div>
    </div>
  );
}
