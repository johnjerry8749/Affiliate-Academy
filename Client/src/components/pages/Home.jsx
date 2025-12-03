import './Home.css';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Home = () => {
  const { t } = useTranslation();
  const scrollCarousel = (direction) => {
    const carousel = document.querySelector('.testimonials-carousel');
    if (carousel) {
      const scrollAmount = 380;
      carousel.scrollLeft += direction * scrollAmount;
    }
  };

  return (
    <div className="home-page">
      {/* Hero Banner Section */}
      <section className="hero-banner-cover">
        <div className="hero-overlay"></div>
        <div className="container">
          <div className="row">
            <div className="col-12">
              <div className="hero-content text-center">
                <h1 className="hero-title animate-fade-in">
                   <span className="text-white">{t("home.hero.title")}</span>
                </h1>
                <h2 className="hero-subtitle animate-fade-in-delay">
                      {t("home.hero.subtitle")}
                </h2>
                <p className="hero-description animate-fade-in-delay-2">
                  {t("home.hero.description")}
                </p>
                <div className="hero-buttons animate-fade-in-delay-3">
                  <Link to="/register" className="btn btn-success btn-lg me-0 me-sm-3 mb-2 mb-sm-3">
                    {t("home.hero.getStarted")}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Jumbotron Section */}
      <section className="jumbotron-section py-5">
        <div className="container">

          {/* Featured Card */}
          <div className="row mb-4">
            <div className="col-12">
              <div className="featured-card animate-slide-up">
                <div className="card border-0 shadow-lg overflow-hidden">
                  <div className="row g-0">

                    <div className="col-12 col-md-6">
                      <div className="card-img-wrapper">
                        <img 
                          src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80"
                          className="img-fluid h-100 w-100"
                          alt="Featured"
                          style={{ objectFit: 'cover', minHeight: '400px' }}
                        />
                        <div className="card-img-overlay-gradient"></div>
                      </div>
                    </div>

                    <div className="col-12 col-md-6">
                      <div className="card-body p-4 p-md-5 d-flex flex-column justify-content-center h-100">

                        <span className="badge bg-success mb-3 align-self-start">
                          {t("home.hero.featured.badge")}
                        </span>

                        <h2 className="card-title h3 fw-bold mb-3">
                          {t("home.hero.featured.title")}
                        </h2>

                        <p className="card-text lead mb-4">
                          {t("home.hero.featured.text")}
                        </p>

                        <ul className="list-unstyled mb-4">
                          <li className="mb-2">
                            <i className="bi bi-check-circle-fill text-success me-2"></i>
                            {t("home.hero.featured.list.signup")}
                          </li>
                          <li className="mb-2">
                            <i className="bi bi-check-circle-fill text-success me-2"></i>
                            {t("home.hero.featured.list.promote")}
                          </li>
                          <li className="mb-2">
                            <i className="bi bi-check-circle-fill text-success me-2"></i>
                            {t("home.hero.featured.list.earn")}
                          </li>
                        </ul>

                        <div>
                          <Link to="/register" className="btn btn-success btn-lg w-100 w-sm-auto">
                            {t("home.hero.featured.button")}
                            <i className="bi bi-arrow-right ms-2"></i>
                          </Link>
                        </div>

                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Two Bottom Cards */}
          <div className="row g-3 g-md-4">

            {/* Card 1 */}
            <div className="col-12 col-md-6">
              <div className="info-card animate-slide-up-delay-1">
                <div className="card border-0 shadow-lg h-100 overflow-hidden hover-lift">

                  <div className="card-img-top-wrapper position-relative">
                    <img 
                      src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&q=80"
                      className="card-img-top"
                      alt="Analytics"
                      style={{ height: '250px', objectFit: 'cover' }}
                    />
                    <div className="card-img-overlay-dark"></div>
                    <div className="position-absolute top-0 start-0 p-3">
                      <span className="badge bg-success bg-opacity-90">
                        <i className="bi bi-graph-up-arrow me-1"></i>
                        {t("home.hero.featured.badge")}
                      </span>
                    </div>
                  </div>

                  <div className="card-body p-4">
                    <div className="card-icon mb-3">
                      <i className="bi bi-bar-chart-line-fill text-success" style={{ fontSize: '2.5rem' }}></i>
                    </div>

                    <h3 className="card-title h4 fw-bold mb-3">
                      {t("home.hero.card1.title")}
                    </h3>

                    <p className="card-text text-muted">
                      {t("home.hero.card1.text")}
                    </p>
                  </div>

                </div>
              </div>
            </div>

            {/* Card 2 */}
            <div className="col-12 col-md-6">
              <div className="info-card animate-slide-up-delay-2">
                <div className="card border-0 shadow-lg h-100 overflow-hidden hover-lift">

                  <div className="card-img-top-wrapper position-relative">
                    <img 
                      src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&q=80"
                      className="card-img-top"
                      alt="Community"
                      style={{ height: '250px', objectFit: 'cover' }}
                    />
                    <div className="card-img-overlay-dark"></div>
                    <div className="position-absolute top-0 start-0 p-3">
                      <span className="badge bg-success bg-opacity-90">
                        <i className="bi bi-people-fill me-1"></i>
                        {t("home.hero.card2.badge")}
                      </span>
                    </div>
                  </div>

                  <div className="card-body p-4">
                    <div className="card-icon mb-3">
                      <i className="bi bi-people-fill text-success" style={{ fontSize: '2.5rem' }}></i>
                    </div>

                    <h3 className="card-title h4 fw-bold mb-3">
                      {t("home.hero.card2.title")}
                    </h3>

                    <p className="card-text text-muted">
                      {t("home.hero.card2.text")}
                    </p>
                  </div>

                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* Additional sections will go here */}
      
      {/* Video Advertisement Section */}
      <section className="video-advert-section py-4 py-md-5">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-12 col-lg-10">
              <div className="video-card animate-fade-scale">
                <div className="card border-0 shadow-lg overflow-hidden">
                  <div className="card-body p-0">
                    <div className="row g-0">
                      {/* Video Column */}
                      <div className="col-12 col-lg-7">
                        <div className="video-wrapper">
                          <div className="ratio ratio-16x9">
                            <video src="./affiliatevideo.mp4" controls></video>
                          </div>
                          <div className="video-overlay">
                            <div className="play-icon">
                              <i className="bi bi-play-circle-fill"></i>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Content Column */}
                      <div className="col-12 col-lg-5">
                        <div className="video-content p-3 p-md-4 p-lg-5 d-flex flex-column justify-content-center h-100">
                          <span className="badge bg-success mb-3 align-self-start">
                            <i className="bi bi-play-btn-fill me-1"></i>
                            {t("home.video.badge")}
                          </span>
                          <h3 className="h4 fw-bold mb-3">
                            {t("home.video.title")}
                          </h3>
                          <p className="text-muted mb-4">
                            {t("home.video.description")}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/** Additional sections will go here **/}
      
      {/* Top Selling Products Section */}
      <section className="top-products-section py-4 py-md-5 bg-light">
        <div className="container">
          {/* Section Header */}
          <div className="row mb-5">
            <div className="col-12 text-center">
              <h2 className="display-5 fw-bold mb-3 animate-fade-in">
                {t("home.products.title")} <span className="text-success">{t("home.products.titleHighlight")}</span>
              </h2>
              <p className="lead text-muted animate-fade-in-delay">
                {t("home.products.subtitle")}
              </p>
            </div>
          </div>

          {/* Products Grid */}
          <div className="row g-4">
            {/* Product cards will be added here */}
            <div className="col-12 text-center">
              <p className="text-muted">{t("home.products.comingSoon")}</p>
            </div>
          </div>
        </div>
      </section>
      {/** Additional sections will go here **/}
      
      {/* Call to Action Cards Section */}
      <section className="cta-cards-section py-4 py-md-5">
        <div className="container">
          <div className="row g-3 g-md-4">
            {/* Become an Affiliate Card */}
            <div className="col-12 col-lg-6">
              <div className="cta-card animate-slide-up">
                <div className="card border-0 shadow-lg h-100 overflow-hidden">
                  <div className="card-body p-4 p-md-5 text-center position-relative">
                    <div className="cta-icon mb-4">
                      <i className="bi bi-people-fill text-success" style={{ fontSize: '4rem' }}></i>
                    </div>
                    <h3 className="h2 fw-bold mb-3">{t("home.cta.affiliate.title")}</h3>
                    <p className="lead text-muted mb-4">
                      {t("home.cta.affiliate.description")}
                    </p>
                    <ul className="list-unstyled text-start mb-4">
                      <li className="mb-2">
                        <i className="bi bi-check-circle-fill text-success me-2"></i>
                        {t("home.cta.affiliate.benefits.commissions")}
                      </li>
                      <li className="mb-2">
                        <i className="bi bi-check-circle-fill text-success me-2"></i>
                        {t("home.cta.affiliate.benefits.materials")}
                      </li>
                      <li className="mb-2">
                        <i className="bi bi-check-circle-fill text-success me-2"></i>
                        {t("home.cta.affiliate.benefits.analytics")}
                      </li>
                      <li className="mb-2">
                        <i className="bi bi-check-circle-fill text-success me-2"></i>
                        {t("home.cta.affiliate.benefits.support")}
                      </li>
                    </ul>
                    <Link to="/affiliate" className="btn btn-success btn-lg w-100">
                      <i className="bi bi-person-plus-fill me-2"></i>
                      {t("home.cta.affiliate.button")}
                    </Link>
                  </div>
                  <div className="card-decoration"></div>
                </div>
              </div>
            </div>

            {/* Customer Card */}
            <div className="col-12 col-lg-6">
              <div className="cta-card animate-slide-up-delay-1">
                <div className="card border-0 shadow-lg h-100 overflow-hidden">
                  <div className="card-body p-4 p-md-5 text-center position-relative">
                    <div className="cta-icon mb-4">
                      <i className="bi bi-cart-fill text-success" style={{ fontSize: '4rem' }}></i>
                    </div>
                    <h3 className="h2 fw-bold mb-3">{t("home.cta.customer.title")}</h3>
                    <p className="lead text-muted mb-4">
                      {t("home.cta.customer.description")}
                    </p>
                    <ul className="list-unstyled text-start mb-4">
                      <li className="mb-2">
                        <i className="bi bi-check-circle-fill text-success me-2"></i>
                        {t("home.cta.customer.benefits.premium")}
                      </li>
                      <li className="mb-2">
                        <i className="bi bi-check-circle-fill text-success me-2"></i>
                        {t("home.cta.customer.benefits.instant")}
                      </li>
                      <li className="mb-2">
                        <i className="bi bi-check-circle-fill text-success me-2"></i>
                        {t("home.cta.customer.benefits.lifetime")}
                      </li>
                      <li className="mb-2">
                        <i className="bi bi-check-circle-fill text-success me-2"></i>
                        {t("home.cta.customer.benefits.guarantee")}
                      </li>
                    </ul>
                    {/* <a href="/register" className="btn btn-success btn-lg w-100">
                      <i className="bi bi-bag-fill me-2"></i>
                      Start Shopping
                    </a> */}
                  </div>
                  <div className="card-decoration"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/** Additional sections will go here **/}
      
      {/* FAQ Section */}
      <section className="faq-section py-5">
        <div className="container">
          <div className="row justify-content-center mb-5">
            <div className="col-12 col-lg-8 text-center">
              <h2 className="display-5 fw-bold mb-3 animate-fade-in">
                {t("home.faq.title")} <span className="text-success">{t("home.faq.titleHighlight")}</span>
              </h2>
              <p className="lead text-muted animate-fade-in-delay">
                {t("home.faq.subtitle")}
              </p>
            </div>
          </div>

          <div className="row justify-content-center">
            <div className="col-12 col-lg-8">
              <div className="faq-accordion">
                <details className="faq-item animate-fade-in">
                  <summary className="faq-question">
                    <i className="bi bi-question-circle-fill me-2 text-success"></i>
                    {t("home.faq.items.q1.question")}
                    <i className="bi bi-chevron-down ms-auto"></i>
                  </summary>
                  <p className="faq-answer">
                    {t("home.faq.items.q1.answer")}
                  </p>
                </details>

                <details className="faq-item animate-fade-in">
                  <summary className="faq-question">
                    <i className="bi bi-question-circle-fill me-2 text-success"></i>
                    {t("home.faq.items.q2.question")}
                    <i className="bi bi-chevron-down ms-auto"></i>
                  </summary>
                  <p className="faq-answer">
                    {t("home.faq.items.q2.answer")}
                  </p>
                </details>

                <details className="faq-item animate-fade-in">
                  <summary className="faq-question">
                    <i className="bi bi-question-circle-fill me-2 text-success"></i>
                    {t("home.faq.items.q3.question")}
                    <i className="bi bi-chevron-down ms-auto"></i>
                  </summary>
                  <p className="faq-answer">
                    {t("home.faq.items.q3.answer")}
                  </p>
                </details>

                <details className="faq-item animate-fade-in">
                  <summary className="faq-question">
                    <i className="bi bi-question-circle-fill me-2 text-success"></i>
                    {t("home.faq.items.q4.question")}
                    <i className="bi bi-chevron-down ms-auto"></i>
                  </summary>
                  <p className="faq-answer">
                    {t("home.faq.items.q4.answer")}
                  </p>
                </details>

                <details className="faq-item animate-fade-in">
                  <summary className="faq-question">
                    <i className="bi bi-question-circle-fill me-2 text-success"></i>
                    {t("home.faq.items.q5.question")}
                    <i className="bi bi-chevron-down ms-auto"></i>
                  </summary>
                  <p className="faq-answer">
                    {t("home.faq.items.q5.answer")}
                  </p>
                </details>

                <details className="faq-item animate-fade-in">
                  <summary className="faq-question">
                    <i className="bi bi-question-circle-fill me-2 text-success"></i>
                    {t("home.faq.items.q6.question")}
                    <i className="bi bi-chevron-down ms-auto"></i>
                  </summary>
                  <p className="faq-answer">
                    {t("home.faq.items.q6.answer")}
                  </p>
                </details>

                <details className="faq-item animate-fade-in">
                  <summary className="faq-question">
                    <i className="bi bi-question-circle-fill me-2 text-success"></i>
                    {t("home.faq.items.q7.question")}
                    <i className="bi bi-chevron-down ms-auto"></i>
                  </summary>
                  <p className="faq-answer">
                    {t("home.faq.items.q7.answer")}
                  </p>
                </details>

                <details className="faq-item animate-fade-in">
                  <summary className="faq-question">
                    <i className="bi bi-question-circle-fill me-2 text-success"></i>
                    {t("home.faq.items.q8.question")}
                    <i className="bi bi-chevron-down ms-auto"></i>
                  </summary>
                  <p className="faq-answer">
                    {t("home.faq.items.q8.answer")}
                  </p>
                </details>

                <details className="faq-item animate-fade-in">
                  <summary className="faq-question">
                    <i className="bi bi-question-circle-fill me-2 text-success"></i>
                    {t("home.faq.items.q9.question")}
                    <i className="bi bi-chevron-down ms-auto"></i>
                  </summary>
                  <p className="faq-answer">
                    {t("home.faq.items.q9.answer")}
                  </p>
                </details>

                <details className="faq-item animate-fade-in">
                  <summary className="faq-question">
                    <i className="bi bi-question-circle-fill me-2 text-success"></i>
                    {t("home.faq.items.q10.question")}
                    <i className="bi bi-chevron-down ms-auto"></i>
                  </summary>
                  <p className="faq-answer">
                    {t("home.faq.items.q10.answer")}
                  </p>
                </details>
              </div>
            </div>
          </div>

          {/* Contact Support CTA */}
          <div className="row justify-content-center mt-5">
            <div className="col-12 col-lg-8 text-center">
              <div className="support-cta p-4 rounded-3 bg-light">
                <h4 className="fw-bold mb-2">{t("home.faq.support.heading")}</h4>
                <p className="text-muted mb-3">{t("home.faq.support.description")}</p>
                <Link to="/contact" className="btn btn-success">
                  <i className="bi bi-envelope-fill me-2"></i>
                  {t("home.faq.support.button")}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/** Additional sections will go here **/}
      
      {/* Testimonials Carousel Section */}
      <section className="testimonials-section py-5">
        <div className="container">
          <div className="row justify-content-center mb-5">
            <div className="col-12 col-lg-8 text-center">
              <h2 className="display-5 fw-bold mb-3 animate-fade-in">
                {t("home.testimonials.title")} <span className="text-success">{t("home.testimonials.titleHighlight")}</span>
              </h2>
              <p className="lead text-muted animate-fade-in-delay">
                {t("home.testimonials.subtitle")}
              </p>
            </div>
          </div>

          <div className="row justify-content-center">
            <div className="col-12 col-lg-10">
              <div className="testimonials-carousel">
                {/* Testimonial 1 */}
                <div className="testimonial-card">
                  <div className="card border-0 shadow-lg h-100">
                    <div className="testimonial-image-wrapper">
                      <img 
                        src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop" 
                        alt="Testimonial" 
                        className="testimonial-image"
                      />
                    </div>
                    <div className="card-body text-center">
                      <div className="testimonial-rating mb-3">
                        <i className="bi bi-star-fill text-warning"></i>
                        <i className="bi bi-star-fill text-warning"></i>
                        <i className="bi bi-star-fill text-warning"></i>
                        <i className="bi bi-star-fill text-warning"></i>
                        <i className="bi bi-star-fill text-warning"></i>
                      </div>
                      <p className="card-text mb-4">
                        "{t("home.testimonials.items.t1.text")}"
                      </p>
                      <h5 className="fw-bold mb-1">{t("home.testimonials.items.t1.name")}</h5>
                      <p className="text-muted small">{t("home.testimonials.items.t1.role")}</p>
                    </div>
                  </div>
                </div>

                {/* Testimonial 2 */}
                <div className="testimonial-card">
                  <div className="card border-0 shadow-lg h-100">
                    <div className="testimonial-image-wrapper">
                      <img 
                        src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=300&fit=crop" 
                        alt="Testimonial" 
                        className="testimonial-image"
                      />
                    </div>
                    <div className="card-body text-center">
                      <div className="testimonial-rating mb-3">
                        <i className="bi bi-star-fill text-warning"></i>
                        <i className="bi bi-star-fill text-warning"></i>
                        <i className="bi bi-star-fill text-warning"></i>
                        <i className="bi bi-star-fill text-warning"></i>
                        <i className="bi bi-star-fill text-warning"></i>
                      </div>
                      <p className="card-text mb-4">
                        "{t("home.testimonials.items.t2.text")}"
                      </p>
                      <h5 className="fw-bold mb-1">{t("home.testimonials.items.t2.name")}</h5>
                      <p className="text-muted small">{t("home.testimonials.items.t2.role")}</p>
                    </div>
                  </div>
                </div>

                {/* Testimonial 3 */}
                <div className="testimonial-card">
                  <div className="card border-0 shadow-lg h-100">
                    <div className="testimonial-image-wrapper">
                      <img 
                        src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&h=300&fit=crop" 
                        alt="Testimonial" 
                        className="testimonial-image"
                      />
                    </div>
                    <div className="card-body text-center">
                      <div className="testimonial-rating mb-3">
                        <i className="bi bi-star-fill text-warning"></i>
                        <i className="bi bi-star-fill text-warning"></i>
                        <i className="bi bi-star-fill text-warning"></i>
                        <i className="bi bi-star-fill text-warning"></i>
                        <i className="bi bi-star-fill text-warning"></i>
                      </div>
                      <p className="card-text mb-4">
                        "{t("home.testimonials.items.t3.text")}"
                      </p>
                      <h5 className="fw-bold mb-1">{t("home.testimonials.items.t3.name")}</h5>
                      <p className="text-muted small">{t("home.testimonials.items.t3.role")}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Carousel Controls */}
              <div className="testimonials-controls mt-5">
                <button className="carousel-btn prev" onClick={() => scrollCarousel(-1)}>
                  <i className="bi bi-chevron-left"></i>
                </button>
                <button className="carousel-btn next" onClick={() => scrollCarousel(1)}>
                  <i className="bi bi-chevron-right"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/** Additional sections will go here **/}
      
    </div>
  );
};

export default Home;
                    
                   