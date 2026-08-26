import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="site-footer-brand">
          <strong>Bespoke Furniture Creations</strong>
          <p className="hint">Handmade furniture, built around you.</p>
        </div>

        <div className="site-footer-contact">
          <h4>Head Office</h4>
          <address>
            Effingham Works, Effingham Road
            <br />
            Sheffield, S9 1AT
            <br />
            United Kingdom
          </address>
        </div>

        <div className="site-footer-contact">
          <h4>Get in Touch</h4>
          <p>
            <a href="mailto:hello@bespokefurniturecreations.co.uk">hello@bespokefurniturecreations.co.uk</a>
          </p>
          <p>
            <a href="tel:+441144960142">0114 496 0142</a>
          </p>
          <p className="hint">Mon–Fri, 9am–5pm</p>
        </div>

        <div className="site-footer-links">
          <h4>More</h4>
          <Link to="/contact">Contact us</Link>
          <Link to="/products">Browse products</Link>
        </div>
      </div>

      <div className="site-footer-bottom">
        <span>© {new Date().getFullYear()} Bespoke Furniture Creations. All rights reserved.</span>
      </div>
    </footer>
  );
}
