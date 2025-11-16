import axiosInstance from '../utils/axiosInstance';

export const adminLogin = async (email, password) => {
  try {
    const res = await axiosInstance.post('/api/adminlogin/login', { email, password });
    console.log('adminLogin response:', res.data);
    return res.data; // { message, token, admin }
  } catch (err) {
    const message = err.response?.data?.message || 'Login failed. Please check your credentials.';
    throw new Error(message);
  }
};

export const fetchAdminProfile = async (token) => {
  try {
    const res = await axiosInstance.get('/admin/profile', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || 'Failed to fetch admin profile');
  }
};

export const getSystemSettings = async (token) => {
  try {
    const res = await axiosInstance.get('/api/setting/getSettings', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(res.data)
    // console.log(token)
    return res.data;
  } catch (error) {
    throw new Error(err.response?.data?.message || 'Failed to fetch system settings ');
  }
}

export const saveSystemSettings = async (token, payload) => {
  try {
    const response = await axiosInstance.post(
      '/api/setting/saveSettings',
      payload, // <-- this is the actual body
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    console.log(payload)
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to update system settings');
  }
};


export const fetchUsersList = async (token, page = 1, limit = 10, search = '') => {
  if (!token) throw new Error('Missing authentication token');

  try {
    const res = await axiosInstance.get('/api/admin/users', {
      headers: { Authorization: `Bearer ${token}` },
      params: { page, limit, search },
    });

    return res.data;
  } catch (error) {
    console.error('fetchUsersList error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to fetch users list');
  }
};


export const deleteUserById = async (userId, token) => {
  try {
    const res = await axiosInstance.delete(`/api/admin/users/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return res.data;
  } catch (error) {
    console.error('deleteUserById error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to delete user');
  }
};


export const fetchDashboardDataFromBackend = async (token) => {
  try {
    const res = await axiosInstance.get('/api/admin/dashboard', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  } catch (error) {
    console.error('fetchDashboardDataFromBackend error:', error);
    throw new Error('Failed to fetch dashboard data');
  }
};



export const fetchAdminsList = async (token) => {
  try {
    const res = await axiosInstance.get('/api/admin/list', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch admins list');
  }
};

// Courses Management APIs//

export const fetchCourses = async (token) => {
  try {
    const res = await axiosInstance.get('/api/admin/courses', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch courses');
  }
};

export const uploadcourse = async (courseData, token) => {
  try {
    const res = await axiosInstance.post('/api/admin/course', courseData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to upload course');
  }
};

export const updateCourse = async (courseId, courseData, token) => {
  try {
    const res = await axiosInstance.put(`/api/admin/course/${courseId}`, courseData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to update course');
  }
};

export const deleteCourse = async (courseId, token) => {
  try {
    const res = await axiosInstance.delete(`/api/admin/course/${courseId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to delete course');
  }
};
