import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './Footer.css';

const Footer = () => {
  const { t } = useTranslation();
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
              {t('home.footer.tagline1')}pp
            </p>
            <p className="text-muted small">
              {t('home.footer.tagline2')}
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
            <h5 className="mb-3 text-success footer-heading">{t('home.footer.quickLinks')}</h5>
            <ul className="list-unstyled footer-links">
              <li className="mb-2">
                <Link to="/" className="footer-link">
                  <i className="bi bi-chevron-right me-1"></i>
                  {t('home.footer.home')}
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/affiliate" className="footer-link">
                  <i className="bi bi-chevron-right me-1"></i>
                  {t('home.footer.affiliate')}
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/Services" className="footer-link">
                  <i className="bi bi-chevron-right me-1"></i>
                  {t('home.footer.services')}
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/real-estate" className="footer-link">
                  <i className="bi bi-chevron-right me-1"></i>
                  {t('home.footer.realEstate')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div className="col-lg-3 col-md-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <h5 className="mb-3 text-success footer-heading">{t('home.footer.support')}</h5>
            <ul className="list-unstyled footer-links">
              <li className="mb-2">
                <a href="/contact" className="footer-link">
                  <i className="bi bi-chevron-right me-1"></i>
                  {t('home.footer.helpCenter')}
                </a>
              </li>
              <li className="mb-2">
                <a href="#faq" className="footer-link">
                  <i className="bi bi-chevron-right me-1"></i>
                  {t('home.footer.faq')}
                </a>
              </li>
              <li className="mb-2">
                <a href="/register" className="footer-link">
                  <i className="bi bi-chevron-right me-1"></i>
                  {t('home.footer.becomeAffiliate')}
                </a>
              </li>
              <li className="mb-2">
                <a href="/Login" className="footer-link">
                  <i className="bi bi-chevron-right me-1"></i>
                  {t('home.footer.login')}
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="col-lg-3 col-md-6 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <h5 className="mb-3 text-success footer-heading">{t('home.footer.contact')}</h5>
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
              <h6 className="text-success mb-2">{t('home.footer.newsletter')}</h6>
              <div className="input-group input-group-sm newsletter-form">
                <input
                  type="email"
                  className="form-control"
                  placeholder={t('home.footer.yourEmail')}
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
              &copy; {currentYear} {t('home.footer.rights')}{' '}
              <span className="text-success fw-bold">Affiliate Academy</span>
            </p>
          </div>
          <div className="col-md-6 text-center text-md-end">
            <p className="text--success small mb-0">
              {t('home.footer.designedBy')}{' '}
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
