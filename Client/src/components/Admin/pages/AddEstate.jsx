
import React, { useState, useEffect } from 'react';
import AdminSidebar from '../adminLayout/AdminSidebar';
import Smallfooter from '../../Users/UserLayout/smallfooter';

/**
 * IMPORTANT: Before using image upload, create a storage bucket in Supabase:
 * 1. Go to Supabase Dashboard > Storage
 * 2. Create a new bucket named "estate-images"
 * 3. Set it to Public bucket
 * 4. Configure allowed MIME types: image/jpeg, image/png, image/webp, image/jpg
 */

const AddEstate = () => {
  const [estates, setEstates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEstate, setSelectedEstate] = useState(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    price: '',
    currency: 'USD',
    listing_type: 'sale',
    bedrooms: '',
    bathrooms: '',
    area: '',
    property_type: 'house',
    status: 'available',
    image_url: '',
    agent_email: ''
  });

  // Live Alert Function
  const showLiveAlert = (message, type = 'success') => {
    const alertPlaceholder = document.getElementById('liveAlertPlaceholder');
    if (!alertPlaceholder) return;

    const wrapper = document.createElement('div');
    wrapper.innerHTML = `
      <div class="alert alert-${type} alert-dismissible fade show" role="alert">
        <i class="bi bi-${type === 'success' ? 'check-circle' : type === 'danger' ? 'exclamation-triangle' : 'info-circle'} me-2"></i>
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      </div>
    `;

    alertPlaceholder.append(wrapper);

    setTimeout(() => {
      wrapper.remove();
    }, 5000);
  };

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchEstates();
    
    const checkSidebarState = () => {
      const sidebar = document.querySelector('.admin-sidebar');
      if (sidebar) {
        setIsSidebarCollapsed(sidebar.classList.contains('collapsed'));
      }
    };

    checkSidebarState();

    const sidebar = document.querySelector('.admin-sidebar');
    if (sidebar) {
      const observer = new MutationObserver(checkSidebarState);
      observer.observe(sidebar, { attributes: true, attributeFilter: ['class'] });
      
      return () => observer.disconnect();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchEstates = async () => {
    try {
      setLoading(true);
      
      // Use backend API instead of direct Supabase call
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api/estate/all`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch estates');
      }
      
      console.log('Fetched estates:', result.estates); // Debug log
      setEstates(result.estates || []);
    } catch (error) {
      console.error('Error fetching estates:', error);
      showLiveAlert('Failed to fetch estates: ' + error.message, 'danger');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      showLiveAlert('Please upload a valid image file (JPEG, PNG, or WebP)', 'danger');
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      showLiveAlert('Image file size must be less than 5MB', 'danger');
      return;
    }

    setImageFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleImageUpload = async () => {
    if (!imageFile) {
      showLiveAlert('Please select an image first', 'danger');
      return;
    }

    try {
      setUploading(true);

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('image', imageFile);

      // Upload via backend API (bypasses RLS)
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api/estate/upload-image`, {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to upload image');
      }

      setFormData(prev => ({ ...prev, image_url: result.imageUrl }));
      setImageFile(null);
      showLiveAlert('Image uploaded successfully!', 'success');
    } catch (error) {
      console.error('Image upload error:', error);
      showLiveAlert('Failed to upload image: ' + error.message, 'danger');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.price || !formData.location) {
      showLiveAlert('Please fill in all required fields', 'danger');
      return;
    }

    try {
      setLoading(true);

      const estateData = {
        title: formData.title,
        description: formData.description,
        location: formData.location,
        price: formData.price,
        currency: formData.currency,
        listing_type: formData.listing_type,
        bedrooms: formData.bedrooms,
        bathrooms: formData.bathrooms,
        area: formData.area,
        property_type: formData.property_type,
        status: formData.status,
        image_url: formData.image_url,
        agent_email: formData.agent_email
      };

      // Use backend API instead of direct Supabase call
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api/estate/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(estateData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to add estate');
      }

      showLiveAlert('Real estate added successfully!', 'success');
      resetForm();
      setShowAddForm(false);
      
      // Fetch estates after a short delay to ensure backend has committed
      setTimeout(() => {
        fetchEstates();
      }, 500);
    } catch (error) {
      console.error('Error adding estate:', error);
      showLiveAlert('Failed to add estate: ' + error.message, 'danger');
    } finally {
      setLoading(false);
    }
  };

  const handleEditEstate = (estate) => {
    setSelectedEstate(estate);
    setFormData({
      title: estate.title || '',
      description: estate.description || '',
      location: estate.location || '',
      price: estate.price?.toString() || '',
      currency: estate.currency || 'USD',
      listing_type: estate.listing_type || 'sale',
      bedrooms: estate.bedrooms?.toString() || '',
      bathrooms: estate.bathrooms?.toString() || '',
      area: estate.area?.toString() || '',
      property_type: estate.property_type || 'house',
      status: estate.status || 'available',
      image_url: estate.image_url || '',
      agent_email: estate.agent_email || ''
    });
    setImagePreview(estate.image_url || '');
    setShowEditModal(true);
  };

  const handleUpdateEstate = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      const estateData = {
        title: formData.title,
        description: formData.description,
        location: formData.location,
        price: formData.price,
        currency: formData.currency,
        listing_type: formData.listing_type,
        bedrooms: formData.bedrooms,
        bathrooms: formData.bathrooms,
        area: formData.area,
        property_type: formData.property_type,
        status: formData.status,
        image_url: formData.image_url,
        agent_email: formData.agent_email
      };

      // Use backend API instead of direct Supabase call
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api/estate/update/${selectedEstate.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(estateData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to update estate');
      }

      showLiveAlert('Real estate updated successfully!', 'success');
      setShowEditModal(false);
      setSelectedEstate(null);
      resetForm();
      
      // Fetch estates after a short delay
      setTimeout(() => {
        fetchEstates();
      }, 500);
    } catch (error) {
      console.error('Error updating estate:', error);
      showLiveAlert('Failed to update estate: ' + error.message, 'danger');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEstate = async (id) => {
    if (!window.confirm('Are you sure you want to delete this property?')) return;

    try {
      // Use backend API instead of direct Supabase call
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api/estate/delete/${id}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to delete estate');
      }

      showLiveAlert('Real estate deleted successfully!', 'success');
      
      // Fetch estates after a short delay
      setTimeout(() => {
        fetchEstates();
      }, 500);
    } catch (error) {
      console.error('Error deleting estate:', error);
      showLiveAlert('Failed to delete estate: ' + error.message, 'danger');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      location: '',
      price: '',
      currency: 'USD',
      listing_type: 'sale',
      bedrooms: '',
      bathrooms: '',
      area: '',
      property_type: 'house',
      status: 'available',
      image_url: '',
      agent_email: ''
    });
    setImageFile(null);
    setImagePreview('');
  };

  const formatPrice = (price, currency = 'USD') => {
    const symbols = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      NGN: '₦',
      CAD: 'C$',
      AUD: 'A$',
      GHS: '₵',
      KES: 'KSh',
      ZAR: 'R'
    };
    const symbol = symbols[currency] || '$';
    return `${symbol}${parseFloat(price).toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`;
  };

  return (
    <>
      <div className="admin-layout d-flex">
        <AdminSidebar />
        
        <div 
          id="liveAlertPlaceholder" 
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 10000,
            minWidth: '300px'
          }}
        ></div>
        
        <div 
          className="main-content flex-grow-1 p-3 p-md-4"
          style={{
            marginLeft: windowWidth <= 768 ? '0' : (isSidebarCollapsed ? '80px' : '250px'),
            transition: 'margin-left 0.3s ease',
            minHeight: '100vh',
            backgroundColor: '#f8f9fa',
            overflowX: 'hidden'
          }}
        >
          <div className="d-flex justify-content-between align-items-center mb-4 mt-5">
            <div>
              <h2 className="mb-2 fw-bold">
                <i className="bi bi-building me-2 text-primary"></i>
                Real Estate Management
              </h2>
              <p className="text-muted mb-0">Add and manage real estate properties</p>
            </div>
            <button
              className="btn btn-primary"
              onClick={() => setShowAddForm(!showAddForm)}
            >
              <i className={`bi bi-${showAddForm ? 'x-lg' : 'plus-lg'} me-2`}></i>
              {showAddForm ? 'Cancel' : 'Add Property'}
            </button>
          </div>

          {showAddForm && (
            <div className="card mb-4 shadow-sm" style={{ backgroundColor: 'white' }}>
              <div className="card-header bg-primary text-white">
                <h5 className="mb-0">
                  <i className="bi bi-plus-circle me-2"></i>
                  Add New Property
                </h5>
              </div>
              <div className="card-body">
                <form onSubmit={handleSubmit}>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-bold text-dark">
                        Title <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        placeholder="e.g., Luxury Villa in Downtown"
                        required
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-bold text-dark">
                        Location <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        name="location"
                        value={formData.location}
                        onChange={handleInputChange}
                        placeholder="e.g., New York, NY"
                        required
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label fw-bold text-dark">
                        Price <span className="text-danger">*</span>
                      </label>
                      <input
                        type="number"
                        className="form-control"
                        name="price"
                        value={formData.price}
                        onChange={handleInputChange}
                        placeholder="e.g., 500000"
                        required
                        step="0.01"
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label fw-bold text-dark">Currency</label>
                      <select
                        className="form-select"
                        name="currency"
                        value={formData.currency}
                        onChange={handleInputChange}
                      >
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                        <option value="NGN">NGN (₦)</option>
                        <option value="CAD">CAD (C$)</option>
                        <option value="AUD">AUD (A$)</option>
                      </select>
                    </div>

                    <div className="col-md-4">
                      <label className="form-label fw-bold text-dark">Listing Type</label>
                      <select
                        className="form-select"
                        name="listing_type"
                        value={formData.listing_type}
                        onChange={handleInputChange}
                      >
                        <option value="sale">For Sale</option>
                        <option value="rent">For Rent</option>
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-bold text-dark">Property Type</label>
                      <select
                        className="form-select"
                        name="property_type"
                        value={formData.property_type}
                        onChange={handleInputChange}
                      >
                        <option value="house">House</option>
                        <option value="apartment">Apartment</option>
                        <option value="villa">Villa</option>
                        <option value="condo">Condo</option>
                        <option value="land">Land</option>
                        <option value="commercial">Commercial</option>
                      </select>
                    </div>

                    <div className="col-md-4">
                      <label className="form-label fw-bold text-dark">Bedrooms</label>
                      <input
                        type="number"
                        className="form-control"
                        name="bedrooms"
                        value={formData.bedrooms}
                        onChange={handleInputChange}
                        placeholder="e.g., 3"
                        min="0"
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label fw-bold text-dark">Bathrooms</label>
                      <input
                        type="number"
                        className="form-control"
                        name="bathrooms"
                        value={formData.bathrooms}
                        onChange={handleInputChange}
                        placeholder="e.g., 2"
                        min="0"
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label fw-bold text-dark">Area (sq ft)</label>
                      <input
                        type="number"
                        className="form-control"
                        name="area"
                        value={formData.area}
                        onChange={handleInputChange}
                        placeholder="e.g., 2500"
                        min="0"
                        step="0.01"
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-bold text-dark">Status</label>
                      <select
                        className="form-select"
                        name="status"
                        value={formData.status}
                        onChange={handleInputChange}
                      >
                        <option value="available">Available</option>
                        <option value="sold">Sold</option>
                        <option value="pending">Pending</option>
                        <option value="rented">Rented</option>
                      </select>
                    </div>

                    <div className="col-12">
                      <label className="form-label fw-bold text-dark">Description</label>
                      <textarea
                        className="form-control"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows="4"
                        placeholder="Enter property description..."
                      ></textarea>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-bold text-dark">
                        Agent Email (Optional)
                      </label>
                      <input
                        type="email"
                        className="form-control"
                        name="agent_email"
                        value={formData.agent_email}
                        onChange={handleInputChange}
                        placeholder="agent@example.com"
                      />
                      <small className="text-muted">
                        If provided, inquiries will be sent to this agent
                      </small>
                    </div>

                    <div className="col-12">
                      <label className="form-label fw-bold text-dark">Property Image</label>
                      <div className="row g-3">
                        <div className="col-md-6">
                          <input
                            type="file"
                            className="form-control"
                            accept="image/*"
                            onChange={handleImageSelect}
                          />
                          <small className="text-muted">
                            Supported formats: JPEG, PNG, WebP (max 5MB)
                          </small>
                        </div>
                        <div className="col-md-6">
                          {imageFile && (
                            <button
                              type="button"
                              className="btn btn-success w-100"
                              onClick={handleImageUpload}
                              disabled={uploading}
                            >
                              {uploading ? (
                                <>
                                  <span className="spinner-border spinner-border-sm me-2"></span>
                                  Uploading...
                                </>
                              ) : (
                                <>
                                  <i className="bi bi-cloud-upload me-2"></i>
                                  Upload Image
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                      {imagePreview && (
                        <div className="mt-3">
                          <img 
                            src={imagePreview} 
                            alt="Preview" 
                            className="img-thumbnail"
                            style={{ maxHeight: '200px', objectFit: 'cover' }}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4">
                    <button
                      type="submit"
                      className="btn btn-primary me-2"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Adding...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-save me-2"></i>
                          Add Property
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => {
                        setShowAddForm(false);
                        resetForm();
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {loading && !showAddForm ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-3 text-muted">Loading properties...</p>
            </div>
          ) : estates.length === 0 ? (
            <div className="card shadow-sm" style={{ backgroundColor: 'white' }}>
              <div className="card-body text-center py-5">
                <i className="bi bi-building display-1 text-muted mb-3"></i>
                <h5 className="text-muted">No properties found</h5>
                <p className="text-muted">Click "Add Property" to create your first listing.</p>
              </div>
            </div>
          ) : (
            <div className="card shadow-sm" style={{ backgroundColor: 'white' }}>
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Image</th>
                        <th>Title</th>
                        <th>Location</th>
                        <th>Price</th>
                        <th>Type</th>
                        <th>Beds/Baths</th>
                        <th>Area</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {estates.map((estate) => (
                        <tr key={estate.id}>
                          <td>
                            {estate.image_url ? (
                              <img 
                                src={estate.image_url} 
                                alt={estate.title}
                                style={{ 
                                  width: '60px', 
                                  height: '60px', 
                                  objectFit: 'cover',
                                  borderRadius: '4px'
                                }}
                              />
                            ) : (
                              <div 
                                className="bg-light d-flex align-items-center justify-content-center"
                                style={{ 
                                  width: '60px', 
                                  height: '60px',
                                  borderRadius: '4px'
                                }}
                              >
                                <i className="bi bi-image text-muted"></i>
                              </div>
                            )}
                          </td>
                          <td>
                            <strong>{estate.title}</strong>
                            <br />
                            <small className="text-muted text-capitalize">
                              {estate.property_type}
                            </small>
                          </td>
                          <td>
                            <i className="bi bi-geo-alt text-muted me-1"></i>
                            {estate.location}
                          </td>
                          <td>
                            <strong className="text-primary">
                              {formatPrice(estate.price, estate.currency)}
                            </strong>
                            <br />
                            <small className="text-muted text-capitalize">
                              For {estate.listing_type}
                            </small>
                          </td>
                          <td className="text-capitalize">{estate.property_type}</td>
                          <td>
                            <i className="bi bi-door-closed me-1"></i>{estate.bedrooms}
                            <span className="mx-1">/</span>
                            <i className="bi bi-droplet me-1"></i>{estate.bathrooms}
                          </td>
                          <td>{estate.area} sqft</td>
                          <td>
                            <span className={`badge ${
                              estate.status === 'available' ? 'bg-success' :
                              estate.status === 'sold' ? 'bg-danger' :
                              estate.status === 'pending' ? 'bg-warning text-dark' :
                              'bg-info'
                            }`}>
                              {estate.status?.toUpperCase()}
                            </span>
                          </td>
                          <td>
                            <div className="btn-group btn-group-sm">
                              <button
                                className="btn btn-outline-primary"
                                onClick={() => handleEditEstate(estate)}
                                title="Edit"
                              >
                                <i className="bi bi-pencil"></i>
                              </button>
                              <button
                                className="btn btn-outline-danger"
                                onClick={() => handleDeleteEstate(estate.id)}
                                title="Delete"
                              >
                                <i className="bi bi-trash"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          <Smallfooter />
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && selectedEstate && (
        <div 
          className="modal fade show d-block"
          style={{ backgroundColor: 'transparent' }}
          onClick={() => setShowEditModal(false)}
        >
          <div 
            className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-pencil me-2"></i>
                  Edit Property
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowEditModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleUpdateEstate}>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-bold text-dark">
                        Title <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-bold text-dark">
                        Location <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        name="location"
                        value={formData.location}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label fw-bold text-dark">
                        Price <span className="text-danger">*</span>
                      </label>
                      <input
                        type="number"
                        className="form-control"
                        name="price"
                        value={formData.price}
                        onChange={handleInputChange}
                        required
                        step="0.01"
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label fw-bold text-dark">Currency</label>
                      <select
                        className="form-select"
                        name="currency"
                        value={formData.currency}
                        onChange={handleInputChange}
                      >
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                        <option value="NGN">NGN (₦)</option>
                        <option value="CAD">CAD (C$)</option>
                        <option value="AUD">AUD (A$)</option>
                      </select>
                    </div>

                    <div className="col-md-4">
                      <label className="form-label fw-bold text-dark">Listing Type</label>
                      <select
                        className="form-select"
                        name="listing_type"
                        value={formData.listing_type}
                        onChange={handleInputChange}
                      >
                        <option value="sale">For Sale</option>
                        <option value="rent">For Rent</option>
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-bold text-dark">Property Type</label>
                      <select
                        className="form-select"
                        name="property_type"
                        value={formData.property_type}
                        onChange={handleInputChange}
                      >
                        <option value="house">House</option>
                        <option value="apartment">Apartment</option>
                        <option value="villa">Villa</option>
                        <option value="condo">Condo</option>
                        <option value="land">Land</option>
                        <option value="commercial">Commercial</option>
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-bold text-dark">Status</label>
                      <select
                        className="form-select"
                        name="status"
                        value={formData.status}
                        onChange={handleInputChange}
                      >
                        <option value="available">Available</option>
                        <option value="sold">Sold</option>
                        <option value="pending">Pending</option>
                        <option value="rented">Rented</option>
                      </select>
                    </div>

                    <div className="col-md-4">
                      <label className="form-label fw-bold text-dark">Bedrooms</label>
                      <input
                        type="number"
                        className="form-control"
                        name="bedrooms"
                        value={formData.bedrooms}
                        onChange={handleInputChange}
                        min="0"
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label fw-bold text-dark">Bathrooms</label>
                      <input
                        type="number"
                        className="form-control"
                        name="bathrooms"
                        value={formData.bathrooms}
                        onChange={handleInputChange}
                        min="0"
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label fw-bold text-dark">Area (sq ft)</label>
                      <input
                        type="number"
                        className="form-control"
                        name="area"
                        value={formData.area}
                        onChange={handleInputChange}
                        min="0"
                        step="0.01"
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label fw-bold text-dark">Description</label>
                      <textarea
                        className="form-control"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows="3"
                      ></textarea>
                    </div>

                    <div className="col-12">
                      <label className="form-label fw-bold text-dark">Property Image</label>
                      <div className="row g-3">
                        <div className="col-md-6">
                          <input
                            type="file"
                            className="form-control"
                            accept="image/*"
                            onChange={handleImageSelect}
                          />
                        </div>
                        <div className="col-md-6">
                          {imageFile && (
                            <button
                              type="button"
                              className="btn btn-success w-100"
                              onClick={handleImageUpload}
                              disabled={uploading}
                            >
                              {uploading ? (
                                <>
                                  <span className="spinner-border spinner-border-sm me-2"></span>
                                  Uploading...
                                </>
                              ) : (
                                <>
                                  <i className="bi bi-cloud-upload me-2"></i>
                                  Upload Image
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                      {imagePreview && (
                        <div className="mt-3">
                          <img 
                            src={imagePreview} 
                            alt="Preview" 
                            className="img-thumbnail"
                            style={{ maxHeight: '200px', objectFit: 'cover' }}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setShowEditModal(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Updating...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-save me-2"></i>
                          Update Property
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>
        {`
          .hover-shadow {
            transition: all 0.3s ease;
          }
          .hover-shadow:hover {
            transform: translateY(-5px);
            box-shadow: 0 0.5rem 1rem rgba(0,0,0,0.15) !important;
          }
        `}
      </style>
    </>
  );
}

export default AddEstate;
