import { useState, useEffect } from "react"
import { supabase } from "../../../supabase"
// import { useUser } from "../../context/userContext"
import { useAuth } from "../../context/AuthProvider"
import Sidebar from "./UserLayout/sidebar"
import Smallfooter from "./UserLayout/smallfooter"

const Invite = ({ embedded = false , numOfReferral}) => {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    totalInvites: 0,
    totalCommission: 0,
    activeReferrals: 0
  })
  const [loadingStats, setLoadingStats] = useState(true)
  const [referralLink, setReferralLink] = useState('')
  const [copySuccess, setCopySuccess] = useState(false)

  // Generate referral link
  useEffect(() => {
    if (user?.id) {
      const baseUrl = window.location.origin
      setReferralLink(`${baseUrl}/register?ref=${user.id}`)
    }
  }, [user?.id])

  // Fetch referral statistics
  const fetchStats = async () => {
    if (!user?.id) return
    
    setLoadingStats(true)
    try {
      // Fetch total invited users
      const { data: invites, error: inviteError } = await supabase
        .from('referral_commissions')
          .select('balance_amount')
          .eq('referrer_id', user.id);
        // console.log('invites', invites)

      if (inviteError) throw inviteError

      // Fetch commission data
      const { data: commissions, error: commissionError } = await supabase
        .from('referral_commissions')
        .select('amount')
        .eq('referrer_id', user.id)

      if (commissionError) throw commissionError

      // Calculate stats
      const totalInvites = invites?.length || 0
      const activeReferrals = invites?.filter(invite => invite.is_active)?.length || 0
      const totalCommission = commissions?.reduce((sum, comm) => sum + (comm.amount || 0), 0) || 0

      setStats({
        totalInvites: embedded && numOfReferral !== undefined ? numOfReferral : totalInvites,
        activeReferrals,
        totalCommission
      })
      

    } catch (error) {
      console.error('Error fetching stats:', error)
      setStats({ 
        totalInvites: embedded && numOfReferral !== undefined ? numOfReferral : 0, 
        totalCommission: 0, 
        activeReferrals: 0 
      })
    } finally {
      setLoadingStats(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [user?.id, numOfReferral, embedded]) // eslint-disable-line react-hooks/exhaustive-deps

  // Copy referral link
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(referralLink)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (error) {
      console.error('Copy failed:', error)
    }
  }

  // Share via social media
  const shareToSocial = (platform) => {
    const message = "Join me on Affiliate Academy and start earning! 🚀"
    const encodedMessage = encodeURIComponent(message)
    const encodedLink = encodeURIComponent(referralLink)
    
    const urls = {
      twitter: `https://twitter.com/intent/tweet?text=${encodedMessage}&url=${encodedLink}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedLink}`,
      whatsapp: `https://wa.me/?text=${encodedMessage}%20${encodedLink}`,
      telegram: `https://t.me/share/url?url=${encodedLink}&text=${encodedMessage}`
    }
    
    window.open(urls[platform], '_blank', 'width=600,height=400')
  }

  // Content to render
  const inviteContent = (
        
        <div className="container-fluid">
          {/* Header */}
          <div className="row mb-3 mb-md-4">
            <div className="col-12">
              <h2 className="mb-1 fs-3 fs-md-2">
                <i className="bi bi-people me-2 text-primary"></i>
                <span className="d-none d-sm-inline">Invite & Earn</span>
                <span className="d-inline d-sm-none">Referrals</span>
              </h2>
              <p className="text-muted mb-0 small">Share your referral link and earn commissions from successful referrals</p>
            </div>
          </div>



          <div className="row">
            {/* Referral Link Section */}
            <div className="col-12 col-lg-8 mb-4">
              <div className="card shadow-sm border-0">
                <div className="card-header bg-white py-3">
                  <h5 className="mb-0 fs-6 fs-md-5">
                    <i className="bi bi-link-45deg me-2 text-success"></i>
                    Your Referral Link
                  </h5>
                </div>
                <div className="card-body p-3 p-md-4">
                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Share this link to invite friends:</label>
                    <div className="input-group">
                      <input
                        type="text"
                        className="form-control"
                        value={referralLink}
                        readOnly
                        style={{ backgroundColor: '#f8f9fa' }}
                      />
                      <button 
                        className="btn btn-outline-primary"
                        onClick={copyToClipboard}
                      >
                        <i className={`bi ${copySuccess ? 'bi-check-lg text-success' : 'bi-clipboard'}`}></i>
                        <span className="d-none d-sm-inline ms-1">
                          {copySuccess ? 'Copied!' : 'Copy'}
                        </span>
                      </button>
                    </div>
                    <div className="form-text small">
                      When someone registers using your link, you'll earn commission from their purchases
                    </div>
                  </div>

                  {/* Social Media Share Buttons */}
                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Share on social media:</label>
                    <div className="d-flex flex-wrap gap-2">
                      <button 
                        className="btn btn-primary btn-sm"
                        onClick={() => shareToSocial('twitter')}
                      >
                        <i className="bi bi-twitter me-1"></i>
                        Twitter
                      </button>
                      <button 
                        className="btn btn-primary btn-sm"
                        onClick={() => shareToSocial('facebook')}
                      >
                        <i className="bi bi-facebook me-1"></i>
                        Facebook
                      </button>
                      <button 
                        className="btn btn-success btn-sm"
                        onClick={() => shareToSocial('whatsapp')}
                      >
                        <i className="bi bi-whatsapp me-1"></i>
                        WhatsApp
                      </button>
                      <button 
                        className="btn btn-info btn-sm text-white"
                        onClick={() => shareToSocial('telegram')}
                      >
                        <i className="bi bi-telegram me-1"></i>
                        Telegram
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* How It Works */}
            <div className="col-12 col-lg-4">
              <div className="card shadow-sm border-0 h-100">
                <div className="card-header bg-light py-3">
                  <h6 className="mb-0 fs-6">
                    <i className="bi bi-lightbulb me-2"></i>
                    How It Works
                  </h6>
                </div>
                <div className="card-body p-3">
                  <div className="d-flex align-items-start mb-3">
                    <div className="bg-primary bg-opacity-10 rounded-circle p-2 me-3 flex-shrink-0">
                      <span className="fw-bold text-primary small">1</span>
                    </div>
                    <div>
                      <h6 className="mb-1 small fw-semibold">Share Your Link</h6>
                      <p className="text-muted small mb-0">Copy and share your unique referral link with friends</p>
                    </div>
                  </div>
                  
                  <div className="d-flex align-items-start mb-3">
                    <div className="bg-success bg-opacity-10 rounded-circle p-2 me-3 flex-shrink-0">
                      <span className="fw-bold text-success small">2</span>
                    </div>
                    <div>
                      <h6 className="mb-1 small fw-semibold">They Register</h6>
                      <p className="text-muted small mb-0">When someone signs up using your link, they become your referral</p>
                    </div>
                  </div>
                  
                  <div className="d-flex align-items-start">
                    <div className="bg-warning bg-opacity-10 rounded-circle p-2 me-3 flex-shrink-0">
                      <span className="fw-bold text-warning small">3</span>
                    </div>
                    <div>
                      <h6 className="mb-1 small fw-semibold">Earn Commission</h6>
                      <p className="text-muted small mb-0">You earn a percentage from their Registration and activities</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Statistics Bar Chart */}
          <div className="row mt-5">
            <div className="col-12">
              <div className="card shadow-sm border-0">
                <div className="card-header bg-white py-3">
                  <h5 className="mb-0 fs-6 fs-md-5">
                    <i className="bi bi-bar-chart me-2 text-info"></i>
                    Referral Statistics
                  </h5>
                </div>
                <div className="card-body p-3 p-md-4">
                  {loadingStats ? (
                    <div className="text-center py-4">
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      <span className="text-muted">Loading statistics...</span>
                    </div>
                  ) : (
                    <div className="row g-4">
                      {/* Total Invites Bar */}
                      <div className="col-12">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <span className="fw-semibold small text-primary">
                            <i className="bi bi-person-plus me-1"></i>
                            Total Invites
                          </span>
                          <span className="badge bg-primary">{stats.totalInvites}</span>
                        </div>
                        <div className="progress mb-2" style={{ height: '20px' }}>
                          <div 
                            className="progress-bar bg-primary" 
                            role="progressbar" 
                            style={{ width: `${Math.min((stats.totalInvites / Math.max(stats.totalInvites, 10)) * 100, 100)}%` }}
                            aria-valuenow={stats.totalInvites}
                            aria-valuemin="0" 
                            aria-valuemax="100"
                          >
                            <span className="visually-hidden">{stats.totalInvites} invites</span>
                          </div>
                        </div>
                        <small className="text-muted">Users you've invited</small>
                      </div>


                    </div>
                  )}

                  {/* Summary Row */}
                  <div className="row mt-4">
                    <div className="col-12">
                      <div className="bg-light rounded p-3">
                        <div className="text-center">
                          <div className="text-primary fw-bold display-6">{stats.totalInvites}</div>
                          <p className="text-muted mb-0">Total Users Invited</p>
                          <small className="text-muted">Keep sharing your referral link to invite more users!</small>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
  );

  // Conditional rendering based on embedded prop
  if (embedded) {
    return inviteContent;
  }

  return (
    <div>
      <Sidebar />
      
      <div className="main-content" style={{ marginLeft: '0', padding: '1rem' }}>
        <style>
          {`
            @media (min-width: 768px) {
              .main-content {
                margin-left: 250px !important;
                padding: 2rem !important;
              }
            }
          `}
        </style>

        {inviteContent}
      </div>
             
      <div className="footer-space mt-4">
        <Smallfooter />
      </div>
    </div>
  )
}

export default Invite
