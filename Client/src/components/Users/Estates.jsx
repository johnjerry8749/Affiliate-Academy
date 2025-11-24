import { useState, useEffect } from "react";
import Sidebar from "./UserLayout/sidebar";
import Smallfooter from "./UserLayout/smallfooter";
import { useAuth } from "../../context/AuthProvider";

const Estates = () => {
  const { user } = useAuth();
  const [estates, setEstates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sendingInquiry, setSendingInquiry] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("available");
  const [selectedEstate, setSelectedEstate] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const backendURL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

  useEffect(() => {
    fetchEstates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterType, filterStatus]);

  const fetchEstates = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (filterType !== 'all') params.append('listing_type', filterType);

      const response = await fetch(`${backendURL}/api/estate/all?${params.toString()}`);
      const result = await response.json();

      if (result.success) {
        setEstates(result.estates || []);
      } else {
        console.error('Failed to fetch estates:', result.message);
        setEstates([]);
      }
    } catch (error) {
      console.error("Error fetching estates:", error);
      setEstates([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const filteredEstates = estates.filter(
    (estate) =>
      estate.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      estate.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      estate.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatCurrency = (amount, currency = "USD") => {
    const symbols = {
      USD: "$",
      EUR: "€",
      GBP: "£",
      NGN: "₦",
      GHS: "₵",
      KES: "KSh",
      ZAR: "R",
    };
    return `${symbols[currency] || "$"}${parseFloat(amount).toLocaleString(
      "en-US",
      { minimumFractionDigits: 2, maximumFractionDigits: 2 }
    )}`;
  };

  const handleViewDetails = (estate) => {
    setSelectedEstate(estate);
    setShowModal(true);
  };

  const handleContactAgent = () => {
    if (!user) {
      alert('Please log in to contact an agent');
      return;
    }
    setShowConfirmModal(true);
  };

  const confirmAndSendInquiry = async () => {
    setShowConfirmModal(false);

    try {
      setSendingInquiry(true);

      const response = await fetch(`${backendURL}/api/estate/contact-agent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          estate: {
            id: selectedEstate.id,
            title: selectedEstate.title,
            location: selectedEstate.location,
            price: selectedEstate.price,
            currency: selectedEstate.currency,
            listing_type: selectedEstate.listing_type,
            property_type: selectedEstate.property_type,
            bedrooms: selectedEstate.bedrooms,
            bathrooms: selectedEstate.bathrooms,
            area: selectedEstate.area,
            image_url: selectedEstate.image_url,
            agent_email: selectedEstate.agent_email
          },
          userId: user.id
        })
      });

      const result = await response.json();

      if (result.success) {
        setInquiryAlert({ type: 'success', message: 'Your inquiry has been sent! An agent will contact you soon.' });
        setTimeout(() => {
          setInquiryAlert(null);
          setShowModal(false);
        }, 2500);
      } else {
        setInquiryAlert({ type: 'danger', message: 'Failed to send inquiry: ' + result.message });
      }
    } catch (error) {
      console.error('Error sending inquiry:', error);
      setInquiryAlert({ type: 'danger', message: 'Failed to send inquiry. Please try again.' });
    } finally {
      setSendingInquiry(false);
    }
  };

  const [inquiryAlert, setInquiryAlert] = useState(null);

  return (
    <div>
      <Sidebar />
      <div className="main-content" style={{ marginLeft: "0", padding: "1rem" }}>
        <style>
          {`
            @media (min-width: 768px) {
              .main-content {
                margin-left: 250px !important;
                padding: 2rem !important;
              }
            }
            
            .estate-card {
              transition: transform 0.3s ease, box-shadow 0.3s ease;
              height: 100%;
              border: none;
              overflow: hidden;
            }
            
            .estate-card:hover {
              transform: translateY(-5px);
              box-shadow: 0 8px 20px rgba(0,0,0,0.15);
            }
            
            .estate-img {
              height: 220px;
              object-fit: cover;
              width: 100%;
            }
            
            .badge-custom {
              font-size: 0.75rem;
              padding: 0.35rem 0.75rem;
              font-weight: 600;
            }
            
            .filter-btn {
              transition: all 0.2s ease;
            }
            
            .filter-btn.active {
              background-color: #0d6efd;
              color: white;
            }
            
            @media (max-width: 768px) {
              .estate-img {
                height: 180px;
              }
            }
          `}
        </style>
        <div className="container-fluid mt-3 mt-md-5">

          {/* Header Section */}
          <div className="mb-4">
            <h2 className="fw-bold mb-2">
              <i className="bi bi-building me-2 text-primary"></i>
              Real Estate Properties
            </h2>
            <p className="text-muted">Browse available properties for sale and rent</p>
          </div>

          {/* Search and Filter Section */}
          <div className="card shadow-sm mb-4">
            <div className="card-body">
              <div className="row g-3">
                <div className="col-12 col-md-6">
                  <div className="input-group">
                    <span className="input-group-text">
                      <i className="bi bi-search"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search by title, location, or description..."
                      value={searchQuery}
                      onChange={handleSearch}
                    />
                  </div>
                </div>
                <div className="col-6 col-md-3">
                  <select
                    className="form-select"
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                  >
                    <option value="all">All Types</option>
                    <option value="sale">For Sale</option>
                    <option value="rent">For Rent</option>
                  </select>
                </div>
                <div className="col-6 col-md-3">
                  <select
                    className="form-select"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <option value="all">All Status</option>
                    <option value="available">Available</option>
                    <option value="sold">Sold</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Estates Grid */}
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-3 text-muted">Loading properties...</p>
            </div>
          ) : filteredEstates.length === 0 ? (
            <div className="card shadow-sm">
              <div className="card-body text-center py-5">
                <i className="bi bi-inbox display-1 text-muted mb-3"></i>
                <h5 className="text-muted">No properties found</h5>
                <p className="text-muted">
                  No properties match your search criteria. Try adjusting your filters.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="row g-3 g-md-4">
                {filteredEstates.map((estate) => (
                  <div key={estate.id} className="col-12 col-sm-6 col-lg-4">
                    <div className="card estate-card shadow-sm">
                      <div className="position-relative">
                        <img
                          src={
                            estate.image_url ||
                            "https://via.placeholder.com/400x250?text=No+Image"
                          }
                          className="card-img-top estate-img"
                          alt={estate.title}
                        />
                        <span
                          className={`position-absolute top-0 start-0 m-3 badge ${
                            estate.listing_type === "sale"
                              ? "bg-success"
                              : "bg-info"
                          } badge-custom`}
                        >
                          For {estate.listing_type === "sale" ? "Sale" : "Rent"}
                        </span>
                        <span
                          className={`position-absolute top-0 end-0 m-3 badge ${
                            estate.status === "available"
                              ? "bg-primary"
                              : estate.status === "sold"
                              ? "bg-danger"
                              : "bg-warning"
                          } badge-custom`}
                        >
                          {estate.status.charAt(0).toUpperCase() +
                            estate.status.slice(1)}
                        </span>
                      </div>
                      <div className="card-body">
                        <h5 className="card-title fw-bold mb-2">
                          {estate.title}
                        </h5>
                        <p className="text-muted mb-2">
                          <i className="bi bi-geo-alt me-1"></i>
                          {estate.location}
                        </p>
                        <p className="card-text text-muted small mb-3" style={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}>
                          {estate.description || "No description available"}
                        </p>
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <div className="text-muted small">
                            <i className="bi bi-house-door me-1"></i>
                            {estate.property_type}
                          </div>
                          <div className="text-muted small">
                            <i className="bi bi-rulers me-1"></i>
                            {estate.area} sqft
                          </div>
                        </div>
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <div className="text-muted small">
                            <i className="bi bi-door-closed me-1"></i>
                            {estate.bedrooms} beds
                          </div>
                          <div className="text-muted small">
                            <i className="bi bi-droplet me-1"></i>
                            {estate.bathrooms} baths
                          </div>
                        </div>
                        <div className=" justify-content-between align-items-center">
                          <h4 className="text-primary fw-bold mb-0">
                            {formatCurrency(estate.price, estate.currency)}
                          </h4>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleViewDetails(estate)}
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Modal for Estate Details */}
          {showModal && selectedEstate && (
            <div
              className="modal fade show"
              style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}
              onClick={() => setShowModal(false)}
            >
              <div
                className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title fw-bold">
                      {selectedEstate.title}
                    </h5>
                    <button
                      type="button"
                      className="btn-close"
                      onClick={() => setShowModal(false)}
                    ></button>
                  </div>
                  <div className="modal-body">
                    {inquiryAlert && (
                      <div className={`alert alert-${inquiryAlert.type}`} role="alert">
                        {inquiryAlert.message}
                      </div>
                    )}
                    <img
                      src={
                        selectedEstate.image_url ||
                        "https://via.placeholder.com/800x400?text=No+Image"
                      }
                      className="img-fluid rounded mb-3 w-100"
                      alt={selectedEstate.title}
                      style={{ maxHeight: "400px", objectFit: "cover" }}
                    />
                    <div className="row mb-3">
                      <div className="col-6">
                        <span
                          className={`badge ${
                            selectedEstate.listing_type === "sale"
                              ? "bg-success"
                              : "bg-info"
                          } me-2`}
                        >
                          For{" "}
                          {selectedEstate.listing_type === "sale"
                            ? "Sale"
                            : "Rent"}
                        </span>
                        <span
                          className={`badge ${
                            selectedEstate.status === "available"
                              ? "bg-primary"
                              : selectedEstate.status === "sold"
                              ? "bg-danger"
                              : "bg-warning"
                          }`}
                        >
                          {selectedEstate.status.charAt(0).toUpperCase() +
                            selectedEstate.status.slice(1)}
                        </span>
                      </div>
                      <div className="col-6 text-end">
                        <h6 className="text-primary fw-bold mb-0">
                          {formatCurrency(
                            selectedEstate.price,
                            selectedEstate.currency
                          )}
                        </h6>
                      </div>
                    </div>
                    <p className="text-muted mb-3">
                      <i className="bi bi-geo-alt me-2"></i>
                      {selectedEstate.location}
                    </p>
                    <h6 className="fw-bold mb-2">Description</h6>
                    <p className="mb-4">
                      {selectedEstate.description ||
                        "No description available"}
                    </p>
                    <h6 className="fw-bold mb-3">Property Details</h6>
                    <div className="row g-3 mb-4">
                      <div className="col-6 col-md-3">
                        <div className="text-center p-3 bg-light rounded">
                          <i className="bi bi-house-door fs-4 text-primary mb-2"></i>
                          <p className="mb-1 fw-semibold">Type</p>
                          <p className="mb-0 text-muted small text-capitalize">
                            {selectedEstate.property_type}
                          </p>
                        </div>
                      </div>
                      <div className="col-6 col-md-3">
                        <div className="text-center p-3 bg-light rounded">
                          <i className="bi bi-rulers fs-4 text-primary mb-2"></i>
                          <p className="mb-1 fw-semibold">Area</p>
                          <p className="mb-0 text-muted small">
                            {selectedEstate.area} sqft
                          </p>
                        </div>
                      </div>
                      <div className="col-6 col-md-3">
                        <div className="text-center p-3 bg-light rounded">
                          <i className="bi bi-door-closed fs-4 text-primary mb-2"></i>
                          <p className="mb-1 fw-semibold">Bedrooms</p>
                          <p className="mb-0 text-muted small">
                            {selectedEstate.bedrooms}
                          </p>
                        </div>
                      </div>
                      <div className="col-6 col-md-3">
                        <div className="text-center p-3 bg-light rounded">
                          <i className="bi bi-droplet fs-4 text-primary mb-2"></i>
                          <p className="mb-1 fw-semibold">Bathrooms</p>
                          <p className="mb-0 text-muted small">
                            {selectedEstate.bathrooms}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="alert alert-info">
                      <i className="bi bi-info-circle me-2"></i>
                      <strong>Interested?</strong> Contact our sales team for
                      more information and to schedule a viewing.
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setShowModal(false)}
                    >
                      Close
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-primary"
                      onClick={handleContactAgent}
                      disabled={sendingInquiry}
                    >
                      {sendingInquiry ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Sending...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-envelope me-2"></i>
                         Send Inquires
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Confirmation Modal */}
          {showConfirmModal && (
            <div
              className="modal fade show"
              style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}
              onClick={() => setShowConfirmModal(false)}
            >
              <div
                className="modal-dialog modal-dialog-centered"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title fw-bold">
                      <i className="bi bi-exclamation-circle text-warning me-2"></i>
                      Confirm Inquiry
                    </h5>
                    <button
                      type="button"
                      className="btn-close"
                      onClick={() => setShowConfirmModal(false)}
                    ></button>
                  </div>
                  <div className="modal-body">
                    <p className="mb-3">
                      Are you sure you want to send an inquiry for this property?
                    </p>
                    <div className="card bg-light">
                      <div className="card-body">
                        <h6 className="fw-bold mb-2">{selectedEstate?.title}</h6>
                        <p className="mb-1 text-muted small">
                          <i className="bi bi-geo-alt me-1"></i>
                          {selectedEstate?.location}
                        </p>
                        <p className="mb-0 text-primary fw-bold">
                          {formatCurrency(selectedEstate?.price, selectedEstate?.currency)}
                        </p>
                      </div>
                    </div>
                    <p className="mt-3 mb-0 small text-muted">
                      <i className="bi bi-info-circle me-1"></i>
                      An agent will contact you via email or phone regarding this property.
                    </p>
                  </div>
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setShowConfirmModal(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={confirmAndSendInquiry}
                      disabled={sendingInquiry}
                    >
                      {sendingInquiry ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Sending...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-check-circle me-2"></i>
                          Confirm & Send
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="footer-space mt-4">
        <Smallfooter />
      </div>
    </div>
  )
}

export default Estates

   