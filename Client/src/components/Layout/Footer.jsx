import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer bg-dark text-light pt-5 pb-3">
      <div className="container">
        <div className="row g-4 animate-fade-in">
          {/* Brand Section */}
          <div className="col-lg-4 col-md-6 animate-slide-up">
            <h3 className="mb-3 footer-brand">
              <span className="text-success">Affiliate</span> Academy
            </h3>
            <p className="text-muted mb-3">
              Information Is Our Commodity. Wealth. Power.
            </p>
            <p className="text-muted small">
              We are not just a platform; we are a dynamic digital marketplace where dreams
              are fueled by knowledge, and success is within reach.
            </p>
            
            {/* Social Media Icons with Hover Animation */}
            <div className="social-links mt-4">
              <a
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                className="social-icon me-3"
                aria-label="Twitter"
              >
                <i className="bi bi-twitter-x"></i>
              </a>
              <a
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                className="social-icon me-3"
                aria-label="Facebook"
              >
                <i className="bi bi-facebook"></i>
              </a>
              <a
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                className="social-icon me-3"
                aria-label="Instagram"
              >
                <i className="bi bi-instagram"></i>
              </a>
              <a
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                className="social-icon"
                aria-label="LinkedIn"
              >
                <i className="bi bi-linkedin"></i>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="col-lg-2 col-md-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <h5 className="mb-3 text-success footer-heading">Quick Links</h5>
            <ul className="list-unstyled footer-links">
              <li className="mb-2">
                <Link to="/" className="footer-link">
                  <i className="bi bi-chevron-right me-1"></i>
                  Home
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/affiliate" className="footer-link">
                  <i className="bi bi-chevron-right me-1"></i>
                  Affiliate
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/Services" className="footer-link">
                  <i className="bi bi-chevron-right me-1"></i>
                  Services
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/real-estate" className="footer-link">
                  <i className="bi bi-chevron-right me-1"></i>
                  Real Estate
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div className="col-lg-3 col-md-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <h5 className="mb-3 text-success footer-heading">Support</h5>
            <ul className="list-unstyled footer-links">
              <li className="mb-2">
                <a href="/contact" className="footer-link">
                  <i className="bi bi-chevron-right me-1"></i>
                  Help Center
                </a>
              </li>
              <li className="mb-2">
                <a href="#faq" className="footer-link">
                  <i className="bi bi-chevron-right me-1"></i>
                  FAQ
                </a>
              </li>
              <li className="mb-2">
                <a href="/register" className="footer-link">
                  <i className="bi bi-chevron-right me-1"></i>
                  Become an Affiliate
                </a>
              </li>
              <li className="mb-2">
                <a href="/Login" className="footer-link">
                  <i className="bi bi-chevron-right me-1"></i>
                  Login
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="col-lg-3 col-md-6 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <h5 className="mb-3 text-success footer-heading">Contact Us</h5>
            <ul className="list-unstyled footer-contact">
              <li className="mb-3 contact-item">
                <i className="bi bi-telephone-fill text-success me-2"></i>
                <a href="tel:+1 (985) 397-1302" className="footer-link">
                  +1 (985) 397-1302
                </a>
              </li>
              <li className="mb-3 contact-item">
                <i className="bi bi-envelope-fill text-success me-2"></i>
                <a href="mailto:info@affiliateacademy.com" className="footer-link">
                  info@affiliateacademy.com
                </a>
              </li>
              <li className="contact-item">
                <i className="bi bi-geo-alt-fill text-success me-2"></i>
                <span className="text-grey">Usa</span>
              </li>
            </ul>

            {/* Newsletter Subscription (Optional) */}
            <div className="mt-4">
              <h6 className="text-success mb-2">Newsletter</h6>
              <div className="input-group input-group-sm newsletter-form">
                <input
                  type="email"
                  className="form-control"
                  placeholder="Your email"
                  aria-label="Email"
                />
                <button className="btn btn-success" type="button">
                  <i className="bi bi-send-fill"></i>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <hr className="border-secondary my-4 animate-fade-in" />
        <div className="row animate-fade-in">
          <div className="col-md-6 text-center text-md-start mb-3 mb-md-0">
            <p className="text--success small mb-0">
              &copy; {currentYear} All Rights Reserved by{' '}
              <span className="text-success fw-bold">Affiliate Academy</span>
            </p>
          </div>
          <div className="col-md-6 text-center text-md-end">
            <p className="text--success small mb-0">
              Designed by{' '}
              <a
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                className="text-success text-decoration-none footer-designer-link"
              >
                AthTech Digitals
              </a>
            </p>
          </div>
        </div>

        {/* Back to Top Button */}
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="back-to-top btn btn-success"
          aria-label="Back to top"
        >
          <i className="bi bi-arrow-up-short"></i>
        </button>
      </div>
    </footer>
  );
};

export default Footer;
