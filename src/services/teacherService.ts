// teacherService.ts
// const API_BASE_URL = 'http://localhost:3000';
const API_BASE_URL = 'https://eduspace-portal-backend.onrender.com';


// School ID helper
const getSchoolId = () => {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      return user.schoolId || null;
    } catch (e) {
      return null;
    }
  }
  return null;
};

// Auth token helper
const getAuthToken = () => {
  return localStorage.getItem('token');
};

const authHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${getAuthToken()}`
});

// Teacher interface
export interface Teacher {
  id: string;
  name: string;
  email: string;
  created_at: string;
}

// Get all teachers for current school
export const fetchAllTeachers = async (): Promise<Teacher[]> => {
  const schoolId = getSchoolId();
  
  if (!schoolId) {
    throw new Error('School ID not found. Please log in again.');
  }
  
  const url = `${API_BASE_URL}/teachers?schoolId=${schoolId}`;
  
  const res = await fetch(url, {
    headers: authHeaders()
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to fetch teachers');
  }
  
  const response = await res.json();
  
  // Extract data from { success: true, data: [...] }
  if (response.success && Array.isArray(response.data)) {
    return response.data;
  }
  
  throw new Error('Invalid response format from server');
};

// Create teacher
export const createTeacher = async (data: {
  name: string;
  email: string;
  password: string;
}): Promise<Teacher> => {
  const schoolId = getSchoolId();
  
  if (!schoolId) {
    throw new Error('School ID not found. Please log in again.');
  }
  
  const url = `${API_BASE_URL}/teachers?schoolId=${schoolId}`;
  
  const res = await fetch(url, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to create teacher');
  }
  
  const response = await res.json();
  
  // Extract data from { success: true, data: {...} }
  if (response.success && response.data) {
    return response.data;
  }
  
  throw new Error('Invalid response format from server');
};

// Delete teacher
export const deleteTeacher = async (teacherId: string): Promise<void> => {
  const schoolId = getSchoolId();
  
  if (!schoolId) {
    throw new Error('School ID not found. Please log in again.');
  }
  
  const url = `${API_BASE_URL}/teachers/${teacherId}?schoolId=${schoolId}`;
  
  const res = await fetch(url, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to delete teacher');
  }
  
  const response = await res.json();
  
  if (!response.success) {
    throw new Error(response.message || 'Failed to delete teacher');
  }

  
};
// ===== START: NEW TEACHER ASSIGNMENT FUNCTIONS =====

// Get teacher's assignments
export const fetchTeacherAssignments = async (teacherId: string): Promise<any[]> => {
  const url = `${API_BASE_URL}/teachers/${teacherId}/assignments`;
  
  const res = await fetch(url, {
    headers: authHeaders()
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to fetch teacher assignments');
  }
  
  const response = await res.json();
  
  if (response.success && Array.isArray(response.data)) {
    return response.data;
  }
  
  throw new Error('Invalid response format from server');
};

// Get teacher's assigned classes
export const fetchTeacherClasses = async (teacherId: string): Promise<any[]> => {
  const url = `${API_BASE_URL}/teachers/${teacherId}/classes`;
  
  const res = await fetch(url, {
    headers: authHeaders()
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to fetch teacher classes');
  }
  
  const response = await res.json();
  
  if (response.success && Array.isArray(response.data)) {
    return response.data;
  }
  
  throw new Error('Invalid response format from server');
};

// Get teacher's assigned subjects
export const fetchTeacherSubjects = async (teacherId: string): Promise<any[]> => {
  const url = `${API_BASE_URL}/teachers/${teacherId}/subjects`;
  
  const res = await fetch(url, {
    headers: authHeaders()
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to fetch teacher subjects');
  }
  
  const response = await res.json();
  
  if (response.success && Array.isArray(response.data)) {
    return response.data;
  }
  
  throw new Error('Invalid response format from server');
};

// Get teacher's students (from assigned classes)
export const fetchTeacherStudents = async (teacherId: string): Promise<any[]> => {
  const url = `${API_BASE_URL}/teachers/${teacherId}/students`;
  
  const res = await fetch(url, {
    headers: authHeaders()
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to fetch teacher students');
  }
  
  const response = await res.json();
  
  if (response.success && Array.isArray(response.data)) {
    return response.data;
  }
  
  throw new Error('Invalid response format from server');
};

// Assign teacher to class and subject
export const assignTeacher = async (
  teacherId: string, 
  classId: string, 
  subjectId: string
): Promise<any> => {
  const url = `${API_BASE_URL}/teachers/assign`;
  
  const res = await fetch(url, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ teacherId, classId, subjectId }),
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to assign teacher');
  }
  
  const response = await res.json();
  
  if (response.success && response.data) {
    return response.data;
  }
  
  throw new Error('Invalid response format from server');
};

// Remove teacher assignment
export const removeTeacherAssignment = async (
  teacherId: string, 
  classId: string, 
  subjectId: string
): Promise<void> => {
  const url = `${API_BASE_URL}/teachers/assign/remove`;
  
  const res = await fetch(url, {
    method: 'DELETE',
    headers: authHeaders(),
    body: JSON.stringify({ teacherId, classId, subjectId }),
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to remove assignment');
  }
  
  const response = await res.json();
  
  if (!response.success) {
    throw new Error(response.message || 'Failed to remove assignment');
  }
};
// ===== END: NEW TEACHER ASSIGNMENT FUNCTIONS =====
// ===== START: CLASS TEACHER FUNCTIONS =====

// Assign class teacher to a class
export const assignClassTeacher = async (
  teacherId: string, 
  classId: string
): Promise<any> => {
  const url = `${API_BASE_URL}/teachers/class-teacher/assign`;
  
  const res = await fetch(url, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ teacherId, classId }),
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to assign class teacher');
  }
  
  const response = await res.json();
  
  if (response.success && response.data) {
    return response.data;
  }
  
  throw new Error('Invalid response format from server');
};

// Remove class teacher from a class
export const removeClassTeacher = async (classId: string): Promise<void> => {
  const url = `${API_BASE_URL}/teachers/class-teacher/remove/${classId}`;
  
  const res = await fetch(url, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to remove class teacher');
  }
  
  const response = await res.json();
  
  if (!response.success) {
    throw new Error(response.message || 'Failed to remove class teacher');
  }
};

// Get class teacher for a specific class
export const getClassTeacher = async (classId: string): Promise<any> => {
  const url = `${API_BASE_URL}/teachers/class-teacher/${classId}`;
  
  const res = await fetch(url, {
    headers: authHeaders()
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to fetch class teacher');
  }
  
  const response = await res.json();
  
  if (response.success) {
    return response.data; // Could be null if no class teacher
  }
  
  throw new Error('Invalid response format from server');
};

// Check if teacher is class teacher for a class
export const isClassTeacher = async (
  teacherId: string, 
  classId: string
): Promise<boolean> => {
  const url = `${API_BASE_URL}/teachers/is-class-teacher/${teacherId}/${classId}`;
  
  const res = await fetch(url, {
    headers: authHeaders()
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to check class teacher status');
  }
  
  const response = await res.json();
  
  if (response.success && typeof response.data?.isClassTeacher === 'boolean') {
    return response.data.isClassTeacher;
  }
  
  throw new Error('Invalid response format from server');
};
// ===== END: CLASS TEACHER FUNCTIONS =====


// // teacherService.ts
// const API_BASE_URL = 'http://localhost:3000';

// // School ID helper
// const getSchoolId = () => {
//   const userStr = localStorage.getItem('user');
//   if (userStr) {
//     try {
//       const user = JSON.parse(userStr);
//       return user.schoolId || null;
//     } catch (e) {
//       return null;
//     }
//   }
//   return null;
// };

// // Auth token helper
// const getAuthToken = () => {
//   return localStorage.getItem('token');
// };

// const authHeaders = () => ({
//   'Content-Type': 'application/json',
//   'Authorization': `Bearer ${getAuthToken()}`
// });

// // Teacher interface
// export interface Teacher {
//   id: string;
//   name: string;
//   email: string;
//   created_at: string;
// }

// // Get all teachers for current school
// export const fetchAllTeachers = async (): Promise<Teacher[]> => {
//   const schoolId = getSchoolId();
  
//   if (!schoolId) {
//     throw new Error('School ID not found. Please log in again.');
//   }
  
//   const url = `${API_BASE_URL}/api/teachers?schoolId=${schoolId}`;
  
//   const res = await fetch(url, {
//     headers: authHeaders()
//   });
  
//   if (!res.ok) {
//     const error = await res.json();
//     throw new Error(error.message || 'Failed to fetch teachers');
//   }
  
//   return await res.json();
// };

// // Create teacher
// export const createTeacher = async (data: {
//   name: string;
//   email: string;
//   password: string;
// }): Promise<Teacher> => {
//   const schoolId = getSchoolId();
  
//   if (!schoolId) {
//     throw new Error('School ID not found. Please log in again.');
//   }
  
//   const url = `${API_BASE_URL}/api/teachers?schoolId=${schoolId}`;
  
//   const res = await fetch(url, {
//     method: 'POST',
//     headers: authHeaders(),
//     body: JSON.stringify(data),
//   });
  
//   if (!res.ok) {
//     const error = await res.json();
//     throw new Error(error.message || 'Failed to create teacher');
//   }
  
//   return await res.json();
// };

// // Delete teacher
// export const deleteTeacher = async (teacherId: string): Promise<void> => {
//   const schoolId = getSchoolId();
  
//   if (!schoolId) {
//     throw new Error('School ID not found. Please log in again.');
//   }
  
//   const url = `${API_BASE_URL}/api/teachers/${teacherId}?schoolId=${schoolId}`;
  
//   const res = await fetch(url, {
//     method: 'DELETE',
//     headers: authHeaders(),
//   });
  
//   if (!res.ok) {
//     const error = await res.json();
//     throw new Error(error.message || 'Failed to delete teacher');
//   }
// };