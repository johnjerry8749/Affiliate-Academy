// import {supabase} from './'
import { supabase } from "../utils/supabaseClient.js";
export const saveSystemSettings = async (req, res) => {
  try {
    const payload = req.sanitized;
    

    // Make sure the payload includes the existing singleton row ID
    payload.id = 'e38df13b-390e-419a-9286-c01e5e1bd1ed';

    const { data, error } = await supabase
      .from('system_settings')
      .upsert(payload, { onConflict: 'id' })  // upsert will now update the existing row
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json({
      success: true,
      message: 'Settings saved successfully!',
      data
    });
  } catch (err) {
    console.error('Save error:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to save settings'
    });
  }
};

export const getSystemSettings = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('*')
      .maybeSingle();

    if (error && error.code !== 'PGRST116') throw error;

    return res.status(200).json({
      success: true,
      data: data || {}
    });
  } catch (err) {
    console.error('Fetch error:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to load settings'
    });
  }
};