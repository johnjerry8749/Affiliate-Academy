import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import LanguageSwitcher from '../pages/LanguageSwitcher'
import './Nav.css';

const Nav = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 50;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrolled]);

  // Close menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  return (
    <nav className={`navbar navbar-expand-lg navbar-dark bg-dark sticky-top shadow-lg ${scrolled ? 'navbar-scrolled' : ''}`}>
      <div className="container">
        {/* Logo/Brand with Animation */}
        <Link className="navbar-brand fw-bold fs-4 brand-animated" to="/" onClick={closeMenu}>
          <span className="text-success brand-text">Affiliate</span>
          <span className="text-white brand-text"> Academy</span>
          <img src='logo.png' alt="affliate"  width={70} />
        </Link>

        {/* Animated Mobile Toggle Button */}
        <button
          className={`navbar-toggler custom-toggler ${isOpen ? 'active' : ''}`}
          type="button"
          onClick={toggleMenu}
          aria-controls="navbarNav"
          aria-expanded={isOpen}
          aria-label="Toggle navigation"
        >
          <span className="toggler-line"></span>
          <span className="toggler-line"></span>
          <span className="toggler-line"></span>
        </button>

        {/* Navigation Links */}
        <div className={`collapse navbar-collapse ${isOpen ? 'show' : ''}`} id="navbarNav">
          <ul className="navbar-nav ms-auto align-items-lg-center">
            <li className="nav-item nav-item-animated" style={{ animationDelay: '0.1s' }}>
              <Link
                className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
                to="/"
                onClick={closeMenu}
              >
                Home
              </Link>
            </li>
            <li className="nav-item nav-item-animated" style={{ animationDelay: '0.2s' }}>
              <Link
                className={`nav-link ${location.pathname === '/affiliate' ? 'active' : ''}`}
                to="/affiliate"
                onClick={closeMenu}
              >
                Affiliate
              </Link>
            </li>
            <li className="nav-item nav-item-animated" style={{ animationDelay: '0.3s' }}>
              <Link
                className={`nav-link ${location.pathname === '/services' ? 'active' : ''}`}
                to="/services"
                onClick={closeMenu}
              >
                Services
              </Link>
            </li>
            <li className="nav-item nav-item-animated" style={{ animationDelay: '0.4s' }}>
              <Link
                className={`nav-link ${location.pathname === '/real-estate' ? 'active' : ''}`}
                to="/real-estate"
                onClick={closeMenu}
              >
                Real Estate
              </Link>
            </li>
            <li className="nav-item nav-item-animated" style={{ animationDelay: '0.5s' }}>
              <Link className="nav-link" to="/faqs" onClick={closeMenu}>
                FAQs
              </Link>
            </li>
            <li className="nav-item nav-item-animated" style={{ animationDelay: '0.6s' }}>
              <Link
                className={`nav-link ${location.pathname === '/login' ? 'active' : ''}`}
                to="/login"
                onClick={closeMenu}
              >
                Login
              </Link>
            </li>
            <li className="nav-item nav-item-animated" style={{ animationDelay: "0.6s" }}>
              <LanguageSwitcher />
            </li>
            <li className="nav-item nav-item-animated mt-2 mt-lg-0" style={{ animationDelay: '0.7s' }}>
              <Link
                to="/register"
                className="btn btn-success text-white fw-bold px-4 cta-button d-block"
                onClick={closeMenu}
              >
                <i className="bi bi-rocket-takeoff me-2"></i>
                Get Started
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Nav;
