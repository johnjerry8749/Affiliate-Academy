import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);


// import { createClient } from '@supabase/supabase-js';
// import dotenv from 'dotenv';

// dotenv.config();

// // Create Supabase admin client
// export const supabase = createClient(
//   process.env.SUPABASE_URL,
//   process.env.SUPABASE_SERVICE_ROLE_KEY
// );

// // Function to delete a user by ID
// async function deleteUserById(userId) {
//   const { data, error } = await supabase.auth.admin.deleteUser(userId);

//   if (error) {
//     throw new Error(error.message);
//   }

//   return data;
// }

// // Run script
// (async () => {
//   try {
//     const userId = '5ccb6826-4af9-44d8-b3f0-7df16209c78f';
//     const result = await deleteUserById(userId);
//     console.log('User deleted:', result);
//   } catch (err) {
//     console.error('Error deleting user:', err.message);
//   }
// })();
