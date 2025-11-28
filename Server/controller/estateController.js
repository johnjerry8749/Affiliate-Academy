import { supabase } from '../utils/supabaseClient.js';
import { sendEmailDirect } from '../services/mailservices.js';

export const contactAgent = async (req, res) => {
  try {
    const { estate, userId } = req.body;

    if (!estate || !userId) {
      return res.status(400).json({
        success: false,
        message: 'Estate and user ID are required'
      });
    }

    // Fetch user details from database
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('full_name, email, phone_number')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      console.error('Error fetching user:', userError);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get admin email from environment variable
    const adminEmail = process.env.GMAIL_USER || process.env.ADMIN_EMAIL;

    if (!adminEmail) {
      console.error('Admin email not configured in environment variables');
      return res.status(500).json({
        success: false,
        message: 'Admin email not configured'
      });
    }

    // Format currency
    const currencySymbols = {
      USD: '$', EUR: '€', GBP: '£', NGN: '₦', CAD: 'C$', 
      AUD: 'A$', GHS: '₵', KES: 'KSh', ZAR: 'R'
    };
    const symbol = currencySymbols[estate.currency] || '$';
    const formattedPrice = `${symbol}${parseFloat(estate.price).toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`;

    const emailContent = `
      A user has expressed interest in a property listing.

      PROPERTY DETAILS:
      • Title: ${estate.title}
      • Location: ${estate.location}
      • Price: ${formattedPrice}
      • Type: ${estate.property_type} (For ${estate.listing_type})
      • Bedrooms: ${estate.bedrooms}
      • Bathrooms: ${estate.bathrooms}
      • Area: ${estate.area} sqft

      USER DETAILS:
      • Name: ${user.full_name}
      • Email: ${user.email}
      • Phone: ${user.phone_number || 'Not provided'}

      Please contact this user to discuss the property.
    `;

    // Send email to admin
    await sendEmailDirect({
      to: adminEmail,
      subject: `New Property Inquiry: ${estate.title}`,
      message: emailContent,
      name: 'Admin'
    });

    // If agent_email is provided for this estate, send to agent as well
    if (estate.agent_email && estate.agent_email.trim()) {
      await sendEmailDirect({
        to: estate.agent_email,
        subject: `New Property Inquiry: ${estate.title}`,
        message: emailContent,
        name: 'Agent'
      });
    }

    // Send confirmation email to user
    await sendEmailDirect({
      to: user.email,
      subject: 'Your Property Inquiry Has Been Received',
      message: `
        Thank you for your interest in ${estate.title}!

        We have received your inquiry and one of our agents will contact you shortly to discuss this property.

        Property Details:
        • Location: ${estate.location}
        • Price: ${formattedPrice}
        • Type: ${estate.property_type}

        If you have any urgent questions, please feel free to reach out to us directly.
      `,
      name: user.full_name
    });

    res.json({
      success: true,
      message: 'Inquiry sent successfully'
    });

  } catch (error) {
    console.error('Error sending inquiry:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send inquiry'
    });
  }
};

export const getAllEstates = async (req, res) => {
  try {
    const { listing_type, status } = req.query;

    let query = supabase
      .from('real_estates')
      .select('*')
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (listing_type && listing_type !== 'all') {
      query = query.eq('listing_type', listing_type);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching estates:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch estates',
        error: error.message
      });
    }

    res.json({
      success: true,
      estates: data || []
    });

  } catch (error) {
    console.error('Error in getAllEstates:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching estates',
      error: error.message
    });
  }
};

export const uploadEstateImage = async (req, res) => {
  try {
    if (!req.files || !req.files.image) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    const imageFile = req.files.image;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(imageFile.mimetype)) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a valid image file (JPEG, PNG, or WebP)'
      });
    }

    // Validate file size (max 100MB)
    const maxSize = 100 * 1024 * 1024;
    if (imageFile.size > maxSize) {
      return res.status(400).json({
        success: false,
        message: 'Image file size must be less than 5MB'
      });
    }

    const fileExt = imageFile.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
    const filePath = `estates/${fileName}`;

    // Upload to Supabase storage using service role (bypasses RLS)
    const { error: uploadError } = await supabase.storage
      .from('estate-images')
      .upload(filePath, imageFile.data, {
        contentType: imageFile.mimetype,
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return res.status(500).json({
        success: false,
        message: 'Failed to upload image: ' + uploadError.message
      });
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('estate-images')
      .getPublicUrl(filePath);

    return res.status(200).json({
      success: true,
      message: 'Image uploaded successfully',
      imageUrl: publicUrl
    });

  } catch (error) {
    console.error('Error uploading estate image:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
};

export const createEstate = async (req, res) => {
  try {
    const {
      title,
      description,
      location,
      price,
      currency,
      listing_type,
      bedrooms,
      bathrooms,
      area,
      property_type,
      status,
      image_url,
      agent_email
    } = req.body;

    // Validate required fields
    if (!title || !location || !price) {
      return res.status(400).json({
        success: false,
        message: 'Title, location, and price are required'
      });
    }

    // Insert estate data using service role (bypasses RLS)
    const { data, error } = await supabase
      .from('real_estates')
      .insert([{
        title,
        description,
        location,
        price: parseFloat(price),
        currency: currency || 'USD',
        listing_type: listing_type || 'sale',
        bedrooms: parseInt(bedrooms) || 0,
        bathrooms: parseInt(bathrooms) || 0,
        area: parseFloat(area) || 0,
        property_type: property_type || 'house',
        status: status || 'available',
        image_url,
        agent_email: agent_email || null
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating estate:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create estate',
        error: error.message
      });
    }

    console.log('Estate created successfully:', data.id);
    res.status(201).json({
      success: true,
      message: 'Estate created successfully',
      estate: data
    });

  } catch (error) {
    console.error('Error in createEstate:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating estate',
      error: error.message
    });
  }
};

export const updateEstate = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      location,
      price,
      currency,
      listing_type,
      bedrooms,
      bathrooms,
      area,
      property_type,
      status,
      image_url,
      agent_email
    } = req.body;

    // Update estate using service role (bypasses RLS)
    const { data, error } = await supabase
      .from('real_estates')
      .update({
        title,
        description,
        location,
        price: parseFloat(price),
        currency,
        listing_type,
        bedrooms: parseInt(bedrooms) || 0,
        bathrooms: parseInt(bathrooms) || 0,
        area: parseFloat(area) || 0,
        property_type,
        status,
        image_url,
        agent_email: agent_email || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating estate:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update estate',
        error: error.message
      });
    }

    console.log(' Estate updated successfully:', id);
    res.json({
      success: true,
      message: 'Estate updated successfully',
      estate: data
    });

  } catch (error) {
    console.error('Error in updateEstate:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating estate',
      error: error.message
    });
  }
};

export const deleteEstate = async (req, res) => {
  try {
    const { id } = req.params;

    // Delete estate using service role (bypasses RLS)
    const { error } = await supabase
      .from('real_estates')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting estate:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete estate',
        error: error.message
      });
    }

    console.log(' Estate deleted successfully:', id);
    res.json({
      success: true,
      message: 'Estate deleted successfully'
    });

  } catch (error) {
    console.error('Error in deleteEstate:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting estate',
      error: error.message
    });
  }
};
