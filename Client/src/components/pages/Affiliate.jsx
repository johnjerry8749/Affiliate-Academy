import React from 'react'
import './Affiliate.css'
import affiliateImage from '../../assets/images/Affiliate.jpg'
import { Link } from 'react-router-dom';

const Affiliate = () => {
  return (
    <div className="affiliate-page">
      {/* Banner Section */}
      <section className="affiliate-banner">
        <div className="banner-overlay"></div>
        <div className="container">
          <div className="row">
            <div className="col-12">
              <div className="banner-content text-center">
                <h1 className="banner-title">
                  How To Become An <span className="text-success">Affiliate</span>
                </h1>
                <h2 className="banner-subtitle">
                  A Home For <span className="text-success">Wealth Creation</span>
                </h2>
                <p className="banner-description">
                  Make True Wealth By Signing Up As An Affiliate On Affiliate Academy Through Our Generous Commission
                </p>
                <div className="banner-button">
                  <Link to="/register" className="btn btn-success btn-lg">
                    Register and Earn
                    <i className="bi bi-arrow-right ms-2"></i>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Additional sections will go here */}

      {/* Cards Section */}
      <section className="affiliate-cards-section py-5">
        <div className="container">
          {/* Top Card */}
          <div className="row mb-5">
            <div className="col-12 col-lg-8 mx-auto">
              <div className="feature-card animate-slide-up">
                <div className="card border-0 shadow-lg overflow-hidden h-100">
                  <div className="row g-0">
                    <div className="col-12 col-md-6">
                      <img
                        src={affiliateImage}
                        className="img-fluid h-100 w-100"
                        alt="Feature"
                        style={{ objectFit: 'cover', minHeight: '300px' }}
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <div className="card-body p-4 d-flex flex-column justify-content-center h-100">
                        <span className="badge bg-success mb-3 align-self-start">Featured</span>
                        <h3 className="card-title h4 fw-bold mb-3">Why Join Affiliate Academy?</h3>
                        <p className="card-text text-muted mb-3">
                          Become part of a thriving community of successful affiliates earning passive income. Our platform offers competitive commissions, comprehensive support, and proven marketing strategies to help you succeed.
                        </p>
                        <ul className="list-unstyled">
                          <li className="mb-2">
                            <i className="bi bi-check-circle-fill text-success me-2"></i>
                            <strong>Generous Commissions</strong> - Earn up to 40% per sale
                          </li>
                          <li className="mb-2">
                            <i className="bi bi-check-circle-fill text-success me-2"></i>
                            <strong>Lifetime Support</strong> - Dedicated team to help you grow
                          </li>
                          <li>
                            <i className="bi bi-check-circle-fill text-success me-2"></i>
                            <strong>Marketing Materials</strong> - Ready-to-use promotional assets
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Three Cards */}
          <div className="row g-4">
            {/* Card 1 */}
            <div className="col-12 col-md-6 col-lg-4">
              <div className="info-card animate-slide-up-delay-1">
                <div className="card border-0 shadow-lg h-100 overflow-hidden hover-lift">
                  <div className="card-body p-4 text-center">
                    <div className="card-icon mb-3">
                      <i className="bi bi-lightning-fill text-warning" style={{ fontSize: '3rem' }}></i>
                    </div>
                    <h4 className="card-title fw-bold mb-3">Easy Setup</h4>
                    <p className="card-text text-muted">
                      Get started in minutes. Simple registration process with instant activation of your affiliate account.
                      To register as an affiliate, individuals can visit our website and navigate to the registration page.
                      Fill out the necessary information, create an account, and agree to our terms and conditions.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2 */}
            <div className="col-12 col-md-6 col-lg-4">
              <div className="info-card animate-slide-up-delay-2">
                <div className="card border-0 shadow-lg h-100 overflow-hidden hover-lift">
                  <div className="card-body p-4 text-center">
                    <div className="card-icon mb-3">
                      <i className="bi bi-bar-chart-line-fill text-success" style={{ fontSize: '3rem' }}></i>
                    </div>
                    <h4 className="card-title fw-bold mb-3">Get Paid</h4>
                    <p className="card-text text-muted">
                      Once registered, affiliates gain access to a wide range of digital products and real estate properties to promote and earn commissions on each sale they generate through an email. Joining Affiliate Academy as an affiliate opens up a world of opportunities to monetize connections, share valuable products, and earn passive income.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3 */}
            <div className="col-12 col-md-6 col-lg-4">
              <div className="info-card animate-slide-up-delay-3">
                <div className="card border-0 shadow-lg h-100 overflow-hidden hover-lift">
                  <div className="card-body p-4 text-center">
                    <div className="card-icon mb-3">
                      <i className="bi bi-info-circle-fill text-danger" style={{ fontSize: '3rem' }}></i>
                    </div>
                    <h4 className="card-title fw-bold mb-3">NOTE</h4>
                    {/* <p className="card-text text-muted">
                      If an individual is not yet an affiliate on Affiliate Academy but wishes to join our network of promoters and earners, you can easily sign up as an affiliate by selecting the option to become an affiliate below and pay our yearly fee of $3.
                    </p> */}
                    <p className="card-text text-muted">
                      You can unlock the potential to earn commissions like thousands of others by promoting valuable digital products and real estate properties available on our platform.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Affiliate
