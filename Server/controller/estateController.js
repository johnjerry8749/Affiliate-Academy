import { supabase } from '../utils/supabaseClient.js';

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
      image_url
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
        image_url
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

    console.log('✅ Estate created successfully:', data.id);
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
      image_url
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
