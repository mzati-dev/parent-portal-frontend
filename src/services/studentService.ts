// const API_BASE_URL = 'http://localhost:3000';
const API_BASE_URL = 'https://eduspace-portal-backend.onrender.com';


// ====================== NEW CODE: School ID Helpers ======================
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

const getSchoolId = () => {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      console.log('USER OBJECT FROM LOCALSTORAGE:', user); // ADD THIS
      return user.schoolId || null;
    } catch (e) {
      return null;
    }
  }
  return null;
};

const getAuthToken = () => {
  return localStorage.getItem('token');
};

const authHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${getAuthToken()}`
});
// ====================== END NEW CODE ======================

// --- TYPES --- 
export interface Class {
  id: string;
  name: string;
  academic_year: string;
  term: string;
  class_code: string;
  created_at: string;
  student_count?: number;
}

export interface Subject {
    name: string;
    qa1: number;
    qa2: number;
    endOfTerm: number;
    grade: string;
    finalScore?: number;
}

export interface StudentData {
    id: string;
    name: string;
    examNumber: string;
    class: string;
    term: string;
    photo: string;
    subjects: Subject[];
    attendance: { present: number; absent: number; late: number };
    classRank: number;
    totalStudents: number;
    teacherRemarks: string;
    
    assessmentStats?: {
        qa1: {
            classRank: number;
            termAverage: number;
            overallGrade: string;
            attendance?: {
                present: number;
                absent: number;
                late: number;
            };
        };
        qa2: {
            classRank: number;
            termAverage: number;
            overallGrade: string;
            attendance?: {
                present: number;
                absent: number;
                late: number;
            };
        };
        endOfTerm: {
            classRank: number;
            termAverage: number;
            overallGrade: string;
            attendance: {
                present: number;
                absent: number;
                late: number;
            };
        };
        overall: {
            termAverage: number;
            calculationMethod: string;
        };
    };
    
    gradeConfiguration?: {
        configuration_name: string;
        calculation_method: 'average_all' | 'end_of_term_only' | 'weighted_average';
        weight_qa1: number;
        weight_qa2: number;
        weight_end_of_term: number;
        pass_mark: number;
    };
}

export interface SubjectRecord {
    id: string;
    name: string;
}

// ====================== PUBLIC FUNCTIONS (NO SCHOOL ID) ======================
// export async function fetchStudentByExamNumber(examNumber: string): Promise<StudentData | null> {
//     try {
//         // const response = await fetch(`${API_BASE_URL}/api/students/results/${examNumber.toUpperCase()}`);
//         const response = await fetch(`${API_BASE_URL}/api/students/results/${examNumber}`);
//         if (!response.ok) return null;
//         const data = await response.json();
//         return data;
//     } catch (error) {
//         console.error('Failed to fetch student data:', error);
//         return null;
//     }
// }

export async function fetchStudentByExamNumber(examNumber: string): Promise<StudentData | null> {
    try {
        // ADD THESE LINES: Get school ID from localStorage
        const schoolId = getSchoolId();
        
        // ADD THIS: Build URL with schoolId parameter
        const url = schoolId 
            ? `${API_BASE_URL}/api/students/results/${examNumber}?schoolId=${schoolId}`
            : `${API_BASE_URL}/api/students/results/${examNumber}`;
        
        const response = await fetch(url);
        if (!response.ok) return null;
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Failed to fetch student data:', error);
        return null;
    }
}

// ====================== ADMIN FUNCTIONS (WITH SCHOOL ID) ======================
export const fetchAllStudents = async () => {
    const schoolId = getSchoolId();
    const url = schoolId ? `${API_BASE_URL}/api/students?schoolId=${schoolId}` : `${API_BASE_URL}/api/students`;
    
    const res = await fetch(url, {
        headers: authHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch students');
    return res.json();
};

export const fetchAllSubjects = async () => {
    const schoolId = getSchoolId();
    const url = schoolId ? `${API_BASE_URL}/api/subjects?schoolId=${schoolId}` : `${API_BASE_URL}/api/subjects`;
    
    const res = await fetch(url, {
        headers: authHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch subjects');
    return res.json();
};

// export const createStudent = async (data: {
//   name: string;
//   class_id: string;
//   photo_url?: string;
// }) => {
//   const schoolId = getSchoolId();
//   const requestData = schoolId ? { ...data, schoolId } : data;
  
//   const res = await fetch(`${API_BASE_URL}/api/students`, {
//     method: 'POST',
//     headers: authHeaders(),
//     body: JSON.stringify(requestData),
//   });
//   if (!res.ok) {
//     const error = await res.json();
//     throw new Error(error.message || 'Failed to create student');
//   }
//   return res.json();
// };

export const createStudent = async (data: {
  name: string;
  class_id: string;
  photo_url?: string;
}) => {
  const schoolId = getSchoolId();
  
  if (!schoolId) {
    throw new Error('School ID not found. Please log in again.');
  }
  
  const url = `${API_BASE_URL}/api/students?schoolId=${schoolId}`;
  
  const res = await fetch(url, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ ...data, schoolId }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to create student');
  }
  return res.json();
};

export const updateStudent = async (id: string, data: {
  name?: string;
  class_id?: string;
  photo_url?: string;
}) => {
  const schoolId = getSchoolId();
  const url = schoolId ? `${API_BASE_URL}/api/students/${id}?schoolId=${schoolId}` : `${API_BASE_URL}/api/students/${id}`;
  
  const res = await fetch(url, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to update student');
  }
  return res.json();
};

export const deleteStudent = async (id: string) => {
  const schoolId = getSchoolId();
  const url = schoolId ? `${API_BASE_URL}/api/students/${id}?schoolId=${schoolId}` : `${API_BASE_URL}/api/students/${id}`;
  
  const res = await fetch(url, {
    method: 'DELETE',
    headers: authHeaders()
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to delete student');
  }
  return res.json();
};

export const upsertAssessment = async (data: any) => {
  const schoolId = getSchoolId();
  const requestData = schoolId ? { ...data, schoolId } : data;
  
  const res = await fetch(`${API_BASE_URL}/api/assessments/upsert`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(requestData),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to save assessment');
  }
  return res.json();
};

export const upsertReportCard = async (data: any) => {
  const schoolId = getSchoolId();
  const requestData = schoolId ? { ...data, schoolId } : data;
  
  const res = await fetch(`${API_BASE_URL}/api/report-cards/upsert`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(requestData),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to save report card');
  }
  return res.json();
};

export const fetchStudentAssessments = async (id: string) => {
  const schoolId = getSchoolId();
  const url = schoolId ? `${API_BASE_URL}/api/students/${id}/assessments?schoolId=${schoolId}` : `${API_BASE_URL}/api/students/${id}/assessments`;
  
  const res = await fetch(url, {
    headers: authHeaders()
  });
  if (!res.ok) {
    console.error('Failed to fetch assessments');
    return [];
  }
  return res.json();
};

export const fetchStudentReportCard = async (id: string, term: string) => {
  const schoolId = getSchoolId();
  const url = schoolId ? `${API_BASE_URL}/api/students/${id}/report-cards/${term}?schoolId=${schoolId}` : `${API_BASE_URL}/api/students/${id}/report-cards/${term}`;
  
  const res = await fetch(url, {
    headers: authHeaders()
  });
  if (!res.ok) {
    if (res.status === 404) {
      console.log('No report card found for this term');
      return null;
    }
    console.error('Failed to fetch report card');
    return null;
  }
  return res.json();
};

export const calculateGrade = (score: number, passMark: number = 50) => {
  if (score >= 80) return 'A';
  if (score >= 70) return 'B';
  if (score >= 60) return 'C';
  if (score >= passMark) return 'D';
  return 'F';
};

// export const createSubject = async (data: { name: string }) => {
//   const schoolId = getSchoolId();
//   const requestData = schoolId ? { ...data, schoolId } : data;
  
//   const res = await fetch(`${API_BASE_URL}/api/subjects`, {
//     method: 'POST',
//     headers: authHeaders(),
//     body: JSON.stringify(requestData),
//   });
//   if (!res.ok) {
//     const error = await res.json();
//     throw new Error(error.message || 'Failed to create subject');
//   }
//   return res.json();
// };

export const createSubject = async (data: { name: string }) => {
  const schoolId = getSchoolId();
  
  if (!schoolId) {
    throw new Error('School ID not found. Please log in again.');
  }
  
  const url = `${API_BASE_URL}/api/subjects?schoolId=${schoolId}`;
  
  const res = await fetch(url, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to create subject');
  }
  return res.json();
};

export const deleteSubject = async (id: string) => {
  const schoolId = getSchoolId();
  const url = schoolId ? `${API_BASE_URL}/api/subjects/${id}?schoolId=${schoolId}` : `${API_BASE_URL}/api/subjects/${id}`;
  
  const res = await fetch(url, {
    method: 'DELETE',
    headers: authHeaders()
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to delete subject');
  }
  return res.json();
};

export const fetchAllClasses = async (): Promise<Class[]> => {
  try {
    const schoolId = getSchoolId();
    const url = schoolId ? `${API_BASE_URL}/api/classes?schoolId=${schoolId}` : `${API_BASE_URL}/api/classes`;
    
    const res = await fetch(url, {
      headers: authHeaders()
    });
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error('Error fetching classes:', error);
    return [];
  }
};

// export const createClass = async (data: {
//   name: string;
//   academic_year: string;
//   term: string;
// }): Promise<Class> => {
//   const schoolId = getSchoolId();
//   const requestData = schoolId ? { ...data, schoolId } : data;
  
//   const res = await fetch(`${API_BASE_URL}/api/classes`, {
//     method: 'POST',
//     headers: authHeaders(),
//     body: JSON.stringify(requestData),
//   });
//   if (!res.ok) {
//     const error = await res.json();
//     throw new Error(error.message || 'Failed to create class');
//   }
//   return res.json();
// };
export const createClass = async (data: {
  name: string;
  academic_year: string;
  term: string;
}): Promise<Class> => {
  const schoolId = getSchoolId();
  console.log('createClass - schoolId:', schoolId); // Should show the same ID
  
  const url = `${API_BASE_URL}/api/classes${schoolId ? `?schoolId=${schoolId}` : ''}`;
  console.log('createClass - URL:', url); // Should show schoolId in URL
  
  const res = await fetch(url, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  
  console.log('createClass - Response status:', res.status);
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to create class');
  }
  return res.json();
};
export const deleteClass = async (id: string): Promise<void> => {
  const schoolId = getSchoolId();
  const url = schoolId ? `${API_BASE_URL}/api/classes/${id}?schoolId=${schoolId}` : `${API_BASE_URL}/api/classes/${id}`;
  
  const res = await fetch(url, {
    method: 'DELETE',
    headers: authHeaders()
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to delete class');
  }
};

export const fetchStudentsByClass = async (classId: string): Promise<any[]> => {
  try {
    const schoolId = getSchoolId();
    const url = schoolId ? `${API_BASE_URL}/api/classes/${classId}/students?schoolId=${schoolId}` : `${API_BASE_URL}/api/classes/${classId}/students`;
    
    const res = await fetch(url, {
      headers: authHeaders()
    });
    if (!res.ok) return [];
    return res.json();
  } catch (error) {
    console.error('Error fetching class students:', error);
    return [];
  }
};

// export const fetchClassResults = async (classId: string): Promise<any[]> => {
//   try {
//     const schoolId = getSchoolId();
//     const url = schoolId ? `${API_BASE_URL}/api/students/class/${classId}/results?schoolId=${schoolId}` : `${API_BASE_URL}/api/students/class/${classId}/results`;
    
//     const res = await fetch(url, {
//       headers: authHeaders()
//     });
//     if (!res.ok) {
//       if (res.status === 404) {
//         console.log('No results found for this class');
//         return [];
//       }
//       throw new Error('Failed to fetch class results');
//     }
//     return await res.json();
//   } catch (error) {
//     console.error('Error fetching class results:', error);
//     return [];
//   }
// };

export const fetchClassResults = async (classId: string): Promise<any[]> => {
  try {
    const schoolId = getSchoolId();
    const url = schoolId ? `${API_BASE_URL}/api/students/class/${classId}/results?schoolId=${schoolId}` : `${API_BASE_URL}/api/students/class/${classId}/results`;
    
    // Get teacher ID from localStorage
    const userStr = localStorage.getItem('user');
    let teacherId = '';
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        teacherId = user.id || ''; // Use user.id as teacher ID
      } catch (e) {
        console.error('Error parsing user:', e);
      }
    }
    
    const headers: Record<string, string> = {
      ...authHeaders(),
    };
    
    // Add teacher ID header if available
    if (teacherId) {
      headers['x-teacher-id'] = teacherId;
    }
    
    const res = await fetch(url, {
      headers: headers
    });
    
    if (!res.ok) {
      if (res.status === 404) {
        console.log('No results found for this class');
        return [];
      }
      throw new Error('Failed to fetch class results');
    }
    return await res.json();
  } catch (error) {
    console.error('Error fetching class results:', error);
    return [];
  }
};

export const fetchGradeConfigurations = async () => {
  try {
    const schoolId = getSchoolId();
    const url = schoolId ? `${API_BASE_URL}/api/grade-configs?schoolId=${schoolId}` : `${API_BASE_URL}/api/grade-configs`;
    
    const res = await fetch(url, {
      headers: authHeaders()
    });
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error('Failed to fetch grade configurations:', error);
    return [];
  }
};

export const calculateAndUpdateRanks = async (classId: string, term: string) => {
  const schoolId = getSchoolId();
  const requestData = schoolId ? { class_id: classId, term, schoolId } : { class_id: classId, term };
  
  const response = await fetch(`${API_BASE_URL}/api/students/calculate-ranks`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(requestData),
  });
  if (!response.ok) throw new Error('Failed to calculate ranks');
  return response.json();
};

// ====================== ADDITIONAL GRADE CONFIG FUNCTIONS ======================
export const getActiveGradeConfig = async () => {
  try {
    const schoolId = getSchoolId();
    const url = schoolId ? `${API_BASE_URL}/api/grade-configs/active?schoolId=${schoolId}` : `${API_BASE_URL}/api/grade-configs/active`;
    
    const res = await fetch(url, {
      headers: authHeaders()
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error('Failed to fetch active grade config:', error);
    return null;
  }
};

// export const createGradeConfig = async (data: any) => {
//   const schoolId = getSchoolId();
//   const requestData = schoolId ? { ...data, schoolId } : data;
  
//   const res = await fetch(`${API_BASE_URL}/api/grade-configs`, {
//     method: 'POST',
//     headers: authHeaders(),
//     body: JSON.stringify(requestData),
//   });
//   if (!res.ok) {
//     const error = await res.json();
//     throw new Error(error.message || 'Failed to create grade config');
//   }
//   return res.json();
// };

export const createGradeConfig = async (data: any) => {
  const schoolId = getSchoolId();
  
  if (!schoolId) {
    throw new Error('School ID not found. Please log in again.');
  }
  
  const url = `${API_BASE_URL}/api/grade-configs?schoolId=${schoolId}`;
  
  const res = await fetch(url, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ ...data, schoolId }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to create grade config');
  }
  return res.json();
};

export const updateGradeConfig = async (id: string, data: any) => {
  const schoolId = getSchoolId();
  const url = schoolId ? `${API_BASE_URL}/api/grade-configs/${id}?schoolId=${schoolId}` : `${API_BASE_URL}/api/grade-configs/${id}`;
  
  const res = await fetch(url, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to update grade config');
  }
  return res.json();
};

export const setActiveConfig = async (id: string) => {
  const schoolId = getSchoolId();
  const url = schoolId ? `${API_BASE_URL}/api/grade-configs/${id}/activate?schoolId=${schoolId}` : `${API_BASE_URL}/api/grade-configs/${id}/activate`;
  
  const res = await fetch(url, {
    method: 'POST',
    headers: authHeaders(),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to activate config');
  }
  return res.json();
};

export const calculateFinalScore = async (subject: any, gradeConfig: any) => {
  const qa1 = subject.qa1 || 0;
  const qa2 = subject.qa2 || 0;
  const endOfTerm = subject.endOfTerm || 0;

  switch (gradeConfig.calculation_method) {
    case 'average_all':
      return (qa1 + qa2 + endOfTerm) / 3;
    case 'end_of_term_only':
      return endOfTerm;
    case 'weighted_average':
      return (qa1 * gradeConfig.weight_qa1 +
        qa2 * gradeConfig.weight_qa2 +
        endOfTerm * gradeConfig.weight_end_of_term) / 100;
    default:
      return (qa1 + qa2 + endOfTerm) / 3;
  }
};

// const API_BASE_URL = 'http://localhost:3000';

// // ====================== NEW CODE TO ADD ======================
// // ADD THIS FUNCTION: Gets JWT token from localStorage
// const getAuthToken = () => {
//   return localStorage.getItem('token');
// };

// // ADD THIS FUNCTION: Creates headers with auth token
// const authHeaders = () => ({
//   'Content-Type': 'application/json',
//   'Authorization': `Bearer ${getAuthToken()}`
// });
// // ====================== END OF NEW CODE ======================

// // --- TYPES --- (NO CHANGES NEEDED HERE)
// export interface Class {
//   id: string;
//   name: string;
//   academic_year: string;
//   term: string;
//   class_code: string;
//   created_at: string;
//   student_count?: number;
// }

// export interface Subject {
//     name: string;
//     qa1: number;
//     qa2: number;
//     endOfTerm: number;
//     grade: string;
//     finalScore?: number;
// }

// export interface StudentData {
//     id: string;
//     name: string;
//     examNumber: string;
//     class: string;
//     term: string;
//     photo: string;
//     subjects: Subject[];
//     attendance: { present: number; absent: number; late: number };
//     classRank: number;
//     totalStudents: number;
//     teacherRemarks: string;
    
//     assessmentStats?: {
//         qa1: {
//             classRank: number;
//             termAverage: number;
//             overallGrade: string;
//             attendance?: {
//                 present: number;
//                 absent: number;
//                 late: number;
//             };
//         };
//         qa2: {
//             classRank: number;
//             termAverage: number;
//             overallGrade: string;
//             attendance?: {
//                 present: number;
//                 absent: number;
//                 late: number;
//             };
//         };
//         endOfTerm: {
//             classRank: number;
//             termAverage: number;
//             overallGrade: string;
//             attendance: {
//                 present: number;
//                 absent: number;
//                 late: number;
//             };
//         };
//         overall: {
//             termAverage: number;
//             calculationMethod: string;
//         };
//     };
    
//     gradeConfiguration?: {
//         configuration_name: string;
//         calculation_method: 'average_all' | 'end_of_term_only' | 'weighted_average';
//         weight_qa1: number;
//         weight_qa2: number;
//         weight_end_of_term: number;
//         pass_mark: number;
//     };
// }

// export interface SubjectRecord {
//     id: string;
//     name: string;
// }

// // --- STUDENT/PARENT PORTAL LOGIC ---
// // NO CHANGE NEEDED: This endpoint doesn't require auth (public access)
// export async function fetchStudentByExamNumber(examNumber: string): Promise<StudentData | null> {
//     try {
//         const response = await fetch(`${API_BASE_URL}/api/students/results/${examNumber.toUpperCase()}`);
        
//         if (!response.ok) return null;
        
//         const data = await response.json();
//         return data;
//     } catch (error) {
//         console.error('Failed to fetch student data:', error);
//         return null;
//     }
// }

// // NEW CODE - NO CHANGE NEEDED
// export const calculateAndUpdateRanks = async (classId: string, term: string) => {
//   const response = await fetch(`${API_BASE_URL}/api/students/calculate-ranks`, {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify({ class_id: classId, term }),
//   });
//   if (!response.ok) throw new Error('Failed to calculate ranks');
//   return response.json();
// };

// // --- ADMIN PANEL LOGIC ---
// // UPDATE THIS: Add auth headers (requires login)
// export const fetchAllStudents = async () => {
//     const res = await fetch(`${API_BASE_URL}/api/students`, {
//         headers: authHeaders()  // ADD THIS LINE
//     });
//     if (!res.ok) throw new Error('Failed to fetch students');
//     return res.json();
// };

// // UPDATE THIS: Add auth headers
// export const fetchAllSubjects = async () => {
//     const res = await fetch(`${API_BASE_URL}/api/subjects`, {
//         headers: authHeaders()  // ADD THIS LINE
//     });
//     if (!res.ok) throw new Error('Failed to fetch subjects');
//     return res.json();
// };

// // UPDATE THIS: Add auth headers
// export const createStudent = async (data: {
//   name: string;
//   class_id: string;
//   photo_url?: string;
// }) => {
//   const res = await fetch(`${API_BASE_URL}/api/students`, {
//     method: 'POST',
//     headers: authHeaders(),  // CHANGED THIS LINE
//     body: JSON.stringify(data),
//   });
//   if (!res.ok) {
//     const error = await res.json();
//     throw new Error(error.message || 'Failed to create student');
//   }
//   return res.json();
// };

// // UPDATE THIS: Add auth headers
// export const updateStudent = async (id: string, data: {
//   name?: string;
//   class_id?: string;
//   photo_url?: string;
// }) => {
//   const res = await fetch(`${API_BASE_URL}/api/students/${id}`, {
//     method: 'PATCH',
//     headers: authHeaders(),  // CHANGED THIS LINE
//     body: JSON.stringify(data),
//   });
//   if (!res.ok) {
//     const error = await res.json();
//     throw new Error(error.message || 'Failed to update student');
//   }
//   return res.json();
// };

// // UPDATE THIS: Add auth headers
// export const deleteStudent = async (id: string) => {
//   const res = await fetch(`${API_BASE_URL}/api/students/${id}`, {
//     method: 'DELETE',
//     headers: authHeaders()  // ADD THIS LINE
//   });
//   if (!res.ok) {
//     const error = await res.json();
//     throw new Error(error.message || 'Failed to delete student');
//   }
//   return res.json();
// };

// // UPDATE THIS: Add auth headers
// export const upsertAssessment = async (data: any) => {
//   const res = await fetch(`${API_BASE_URL}/api/assessments/upsert`, {
//     method: 'POST',
//     headers: authHeaders(),  // CHANGED THIS LINE
//     body: JSON.stringify(data),
//   });
//   if (!res.ok) {
//     const error = await res.json();
//     throw new Error(error.message || 'Failed to save assessment');
//   }
//   return res.json();
// };

// // UPDATE THIS: Add auth headers
// export const upsertReportCard = async (data: any) => {
//   const res = await fetch(`${API_BASE_URL}/api/report-cards/upsert`, {
//     method: 'POST',
//     headers: authHeaders(),  // CHANGED THIS LINE
//     body: JSON.stringify(data),
//   });
//   if (!res.ok) {
//     const error = await res.json();
//     throw new Error(error.message || 'Failed to save report card');
//   }
//   return res.json();
// };

// // UPDATE THIS: Add auth headers
// export const fetchStudentAssessments = async (id: string) => {
//   const res = await fetch(`${API_BASE_URL}/api/students/${id}/assessments`, {
//     headers: authHeaders()  // ADD THIS LINE
//   });
//   if (!res.ok) {
//     console.error('Failed to fetch assessments');
//     return [];
//   }
//   return res.json();
// };

// // UPDATE THIS: Add auth headers
// export const fetchStudentReportCard = async (id: string, term: string) => {
//   const res = await fetch(`${API_BASE_URL}/api/students/${id}/report-cards/${term}`, {
//     headers: authHeaders()  // ADD THIS LINE
//   });
//   if (!res.ok) {
//     if (res.status === 404) {
//       console.log('No report card found for this term');
//       return null;
//     }
//     console.error('Failed to fetch report card');
//     return null;
//   }
//   return res.json();
// };

// // NO CHANGE: This is just a utility function
// export const calculateGrade = (score: number, passMark: number = 50) => {
//   if (score >= 80) return 'A';
//   if (score >= 70) return 'B';
//   if (score >= 60) return 'C';
//   if (score >= passMark) return 'D';
//   return 'F';
// };

// // UPDATE THIS: Add auth headers
// export const createSubject = async (data: { name: string }) => {
//   const res = await fetch(`${API_BASE_URL}/api/subjects`, {
//     method: 'POST',
//     headers: authHeaders(),  // CHANGED THIS LINE
//     body: JSON.stringify(data),
//   });
//   if (!res.ok) {
//     const error = await res.json();
//     throw new Error(error.message || 'Failed to create subject');
//   }
//   return res.json();
// };

// // UPDATE THIS: Add auth headers
// export const deleteSubject = async (id: string) => {
//   const res = await fetch(`${API_BASE_URL}/api/subjects/${id}`, {
//     method: 'DELETE',
//     headers: authHeaders()  // ADD THIS LINE
//   });
//   if (!res.ok) {
//     const error = await res.json();
//     throw new Error(error.message || 'Failed to delete subject');
//   }
//   return res.json();
// };

// // UPDATE THIS: Add auth headers
// export const fetchAllClasses = async (): Promise<Class[]> => {
//   try {
//     const res = await fetch(`${API_BASE_URL}/api/classes`, {
//       headers: authHeaders()  // ADD THIS LINE
//     });
//     if (!res.ok) return [];
//     return await res.json();
//   } catch (error) {
//     console.error('Error fetching classes:', error);
//     return [];
//   }
// };

// // UPDATE THIS: Add auth headers
// export const createClass = async (data: {
//   name: string;
//   academic_year: string;
//   term: string;
// }): Promise<Class> => {
//   const res = await fetch(`${API_BASE_URL}/api/classes`, {
//     method: 'POST',
//     headers: authHeaders(),  // CHANGED THIS LINE
//     body: JSON.stringify(data),
//   });
//   if (!res.ok) {
//     const error = await res.json();
//     throw new Error(error.message || 'Failed to create class');
//   }
//   return res.json();
// };

// // UPDATE THIS: Add auth headers
// export const deleteClass = async (id: string): Promise<void> => {
//   const res = await fetch(`${API_BASE_URL}/api/classes/${id}`, {
//     method: 'DELETE',
//     headers: authHeaders()  // ADD THIS LINE
//   });
//   if (!res.ok) {
//     const error = await res.json();
//     throw new Error(error.message || 'Failed to delete class');
//   }
// };

// // UPDATE THIS: Add auth headers
// export const fetchStudentsByClass = async (classId: string): Promise<any[]> => {
//   try {
//     const res = await fetch(`${API_BASE_URL}/api/classes/${classId}/students`, {
//       headers: authHeaders()  // ADD THIS LINE
//     });
//     if (!res.ok) return [];
//     return res.json();
//   } catch (error) {
//     console.error('Error fetching class students:', error);
//     return [];
//   }
// };

// // UPDATE THIS: Add auth headers
// export const fetchClassResults = async (classId: string): Promise<any[]> => {
//   try {
//     const res = await fetch(`${API_BASE_URL}/api/students/class/${classId}/results`, {
//       headers: authHeaders()  // ADD THIS LINE
//     });
//     if (!res.ok) {
//       if (res.status === 404) {
//         console.log('No results found for this class');
//         return [];
//       }
//       throw new Error('Failed to fetch class results');
//     }
//     return await res.json();
//   } catch (error) {
//     console.error('Error fetching class results:', error);
//     return [];
//   }
// };

// // UPDATE THIS: Add auth headers
// export const fetchGradeConfigurations = async () => {
//   try {
//     const res = await fetch(`${API_BASE_URL}/api/grade-configs`, {
//       headers: authHeaders()  // ADD THIS LINE
//     });
//     if (!res.ok) return [];
//     return await res.json();
//   } catch (error) {
//     console.error('Failed to fetch grade configurations:', error);
//     return [];
//   }
// };

// const API_BASE_URL = 'http://localhost:3000';

// // --- TYPES ---
// export interface Class {
//   id: string;
//   name: string;
//   academic_year: string;
//   term: string;
//   class_code: string;
//   created_at: string;
//   student_count?: number;
// }

// export interface Subject {
//     name: string;
//     qa1: number;
//     qa2: number;
//     endOfTerm: number;
//     grade: string;
//     finalScore?: number;
// }

// export interface StudentData {
//     id: string;
//     name: string;
//     examNumber: string;
//     class: string;
//     term: string;
//     photo: string;
//     subjects: Subject[];
//     attendance: { present: number; absent: number; late: number };
//     classRank: number;
//     totalStudents: number;
//     teacherRemarks: string;
    
//     assessmentStats?: {
//         qa1: {
//             classRank: number;
//             termAverage: number;
//             overallGrade: string;
//             attendance?: {
//                 present: number;
//                 absent: number;
//                 late: number;
//             };
//         };
//         qa2: {
//             classRank: number;
//             termAverage: number;
//             overallGrade: string;
//             attendance?: {
//                 present: number;
//                 absent: number;
//                 late: number;
//             };
//         };
//         endOfTerm: {
//             classRank: number;
//             termAverage: number;
//             overallGrade: string;
//             attendance: {
//                 present: number;
//                 absent: number;
//                 late: number;
//             };
//         };
//         overall: {
//             termAverage: number;
//             calculationMethod: string;
//         };
//     };
    
//     gradeConfiguration?: {
//         configuration_name: string;
//         calculation_method: 'average_all' | 'end_of_term_only' | 'weighted_average';
//         weight_qa1: number;
//         weight_qa2: number;
//         weight_end_of_term: number;
//         pass_mark: number;
//     };
// }

// export interface SubjectRecord {
//     id: string;
//     name: string;
// }

// // --- STUDENT/PARENT PORTAL LOGIC ---
// export async function fetchStudentByExamNumber(examNumber: string): Promise<StudentData | null> {
//     try {
//         // JUST FETCH - NO CALCULATIONS
//         const response = await fetch(`${API_BASE_URL}/api/students/results/${examNumber.toUpperCase()}`);
        
//         if (!response.ok) return null;
        
//         const data = await response.json();
        
//         // Backend already calculates everything:
//         // - subject.finalScore ✓
//         // - subject.grade ✓  
//         // - assessmentStats ✓
//         // - gradeConfiguration ✓
        
//         return data; // Use as-is
//     } catch (error) {
//         console.error('Failed to fetch student data:', error);
//         return null;
//     }
// }

// //NEW CODE
// export const calculateAndUpdateRanks = async (classId: string, term: string) => {
//   const response = await fetch(`${API_BASE_URL}/api/students/calculate-ranks`, {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify({ class_id: classId, term }),
//   });
//   if (!response.ok) throw new Error('Failed to calculate ranks');
//   return response.json();
// };

// // --- ADMIN PANEL LOGIC ---
// export const fetchAllStudents = async () => {
//     const res = await fetch(`${API_BASE_URL}/api/students`);
//     if (!res.ok) throw new Error('Failed to fetch students');
//     return res.json();
// };

// export const fetchAllSubjects = async () => {
//     const res = await fetch(`${API_BASE_URL}/api/subjects`);
//     if (!res.ok) throw new Error('Failed to fetch subjects');
//     return res.json();
// };

// export const createStudent = async (data: {
//   name: string;
//   class_id: string;
//   photo_url?: string;
// }) => {
//   const res = await fetch(`${API_BASE_URL}/api/students`, {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify(data),
//   });
//   if (!res.ok) {
//     const error = await res.json();
//     throw new Error(error.message || 'Failed to create student');
//   }
//   return res.json();
// };

// export const updateStudent = async (id: string, data: {
//   name?: string;
//   class_id?: string;
//   photo_url?: string;
// }) => {
//   const res = await fetch(`${API_BASE_URL}/api/students/${id}`, {
//     method: 'PATCH',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify(data),
//   });
//   if (!res.ok) {
//     const error = await res.json();
//     throw new Error(error.message || 'Failed to update student');
//   }
//   return res.json();
// };

// export const deleteStudent = async (id: string) => {
//   const res = await fetch(`${API_BASE_URL}/api/students/${id}`, {
//     method: 'DELETE',
//   });
//   if (!res.ok) {
//     const error = await res.json();
//     throw new Error(error.message || 'Failed to delete student');
//   }
//   return res.json();
// };

// export const upsertAssessment = async (data: any) => {
//   const res = await fetch(`${API_BASE_URL}/api/assessments/upsert`, {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify(data),
//   });
//   if (!res.ok) {
//     const error = await res.json();
//     throw new Error(error.message || 'Failed to save assessment');
//   }
//   return res.json();
// };

// export const upsertReportCard = async (data: any) => {
//   const res = await fetch(`${API_BASE_URL}/api/report-cards/upsert`, {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify(data),
//   });
//   if (!res.ok) {
//     const error = await res.json();
//     throw new Error(error.message || 'Failed to save report card');
//   }
//   return res.json();
// };

// export const fetchStudentAssessments = async (id: string) => {
//   const res = await fetch(`${API_BASE_URL}/api/students/${id}/assessments`);
//   if (!res.ok) {
//     console.error('Failed to fetch assessments');
//     return [];
//   }
//   return res.json();
// };

// export const fetchStudentReportCard = async (id: string, term: string) => {
//   const res = await fetch(`${API_BASE_URL}/api/students/${id}/report-cards/${term}`);
//   if (!res.ok) {
//     if (res.status === 404) {
//       console.log('No report card found for this term');
//       return null;
//     }
//     console.error('Failed to fetch report card');
//     return null;
//   }
//   return res.json();
// };

// export const calculateGrade = (score: number, passMark: number = 50) => {
//   if (score >= 80) return 'A';
//   if (score >= 70) return 'B';
//   if (score >= 60) return 'C';
//   if (score >= passMark) return 'D';
//   return 'F';
// };

// export const createSubject = async (data: { name: string }) => {
//   const res = await fetch(`${API_BASE_URL}/api/subjects`, {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify(data),
//   });
//   if (!res.ok) {
//     const error = await res.json();
//     throw new Error(error.message || 'Failed to create subject');
//   }
//   return res.json();
// };

// export const deleteSubject = async (id: string) => {
//   const res = await fetch(`${API_BASE_URL}/api/subjects/${id}`, {
//     method: 'DELETE',
//   });
//   if (!res.ok) {
//     const error = await res.json();
//     throw new Error(error.message || 'Failed to delete subject');
//   }
//   return res.json();
// };

// export const fetchAllClasses = async (): Promise<Class[]> => {
//   try {
//     const res = await fetch(`${API_BASE_URL}/api/classes`);
//     if (!res.ok) return [];
//     return await res.json();
//   } catch (error) {
//     console.error('Error fetching classes:', error);
//     return [];
//   }
// };

// export const createClass = async (data: {
//   name: string;
//   academic_year: string;
//   term: string;
// }): Promise<Class> => {
//   const res = await fetch(`${API_BASE_URL}/api/classes`, {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify(data),
//   });
//   if (!res.ok) {
//     const error = await res.json();
//     throw new Error(error.message || 'Failed to create class');
//   }
//   return res.json();
// };

// export const deleteClass = async (id: string): Promise<void> => {
//   const res = await fetch(`${API_BASE_URL}/api/classes/${id}`, {
//     method: 'DELETE',
//   });
//   if (!res.ok) {
//     const error = await res.json();
//     throw new Error(error.message || 'Failed to delete class');
//   }
// };

// export const fetchStudentsByClass = async (classId: string): Promise<any[]> => {
//   try {
//     const res = await fetch(`${API_BASE_URL}/api/classes/${classId}/students`);
//     if (!res.ok) return [];
//     return res.json();
//   } catch (error) {
//     console.error('Error fetching class students:', error);
//     return [];
//   }
// };

// export const fetchClassResults = async (classId: string): Promise<any[]> => {
//   try {
//     const res = await fetch(`${API_BASE_URL}/api/students/class/${classId}/results`);
//     if (!res.ok) {
//       if (res.status === 404) {
//         console.log('No results found for this class');
//         return [];
//       }
//       throw new Error('Failed to fetch class results');
//     }
//     return await res.json();
//   } catch (error) {
//     console.error('Error fetching class results:', error);
//     return [];
//   }
// };

// export const fetchGradeConfigurations = async () => {
//   try {
//     const res = await fetch(`${API_BASE_URL}/api/grade-configs`);
//     if (!res.ok) return [];
//     return await res.json();
//   } catch (error) {
//     console.error('Failed to fetch grade configurations:', error);
//     return [];
//   }
// };


// const API_BASE_URL = 'http://localhost:3000';

// // --- TYPES ---
// export interface Class {
//   id: string;
//   name: string;               // e.g., "Grade 8A", "Form 3B"
//   academic_year: string;      // e.g., "2024/2025"
//   term: string;               // e.g., "Term 1", "Term 2", "Term 3"
//   class_code: string;         // Auto-generated: "GR8A-2025-T1"
//   created_at: string;
//   student_count?: number;     // Number of students in this class
// }

// export interface Subject {
//     name: string;
//     qa1: number;
//     qa2: number;
//     endOfTerm: number;
//     grade: string;
//     finalScore?: number;
// }

// export interface StudentData {
//     id: string;
//     name: string;
//     examNumber: string;
//     class: string;
//     term: string;
//     photo: string;
//     subjects: Subject[];
//     attendance: { present: number; absent: number; late: number };
//     classRank: number;
//     totalStudents: number;
//     teacherRemarks: string;
    
//     assessmentStats?: {
//         qa1: {
//             classRank: number;
//             termAverage: number;
//             overallGrade: string;
//             attendance?: {
//                 present: number;
//                 absent: number;
//                 late: number;
//             };
//         };
//         qa2: {
//             classRank: number;
//             termAverage: number;
//             overallGrade: string;
//             attendance?: {
//                 present: number;
//                 absent: number;
//                 late: number;
//             };
//         };
//         endOfTerm: {
//             classRank: number;
//             termAverage: number;
//             overallGrade: string;
//             attendance: {
//                 present: number;
//                 absent: number;
//                 late: number;
//             };
//         };
//         overall: {
//             termAverage: number;
//             calculationMethod: string;
//         };
//     };
    
//     gradeConfiguration?: {
//         configuration_name: string;
//         calculation_method: 'average_all' | 'end_of_term_only' | 'weighted_average';
//         weight_qa1: number;
//         weight_qa2: number;
//         weight_end_of_term: number;
//         pass_mark: number;
//     };
// }

// export interface SubjectRecord {
//     id: string;
//     name: string;
// }

// // Import grade config service
// import { getActiveGradeConfig, calculateFinalScore } from './gradeConfigService';

// // --- STUDENT/PARENT PORTAL LOGIC ---
// // export async function fetchStudentByExamNumber(examNumber: string): Promise<StudentData | null> {
// //     try {
// //         const [response, gradeConfig] = await Promise.all([
// //             fetch(`${API_BASE_URL}/api/students/results/${examNumber.toUpperCase()}`),
// //             getActiveGradeConfig()
// //         ]);
        
// //         if (!response.ok) return null;
// //         const data = await response.json();
        
// //         data.gradeConfiguration = gradeConfig;
        
// //         if (!data.assessmentStats) {
// //             data.assessmentStats = calculateAssessmentStats(data, gradeConfig);
// //         }
        
// //         if (gradeConfig && data.subjects) {
// //             data.subjects = data.subjects.map(subject => ({
// //                 ...subject,
// //                 finalScore: calculateSubjectFinalScore(subject, gradeConfig),
// //                 grade: calculateGradeFromConfig(subject, gradeConfig)
// //             }));
// //         }
        
// //         return data;
// //     } catch (error) {
// //         console.error('Failed to fetch student data:', error);
// //         return null;
// //     }
// // }

// // --- STUDENT/PARENT PORTAL LOGIC ---
// export async function fetchStudentByExamNumber(examNumber: string): Promise<StudentData | null> {
//     try {
//         // JUST FETCH - NO CALCULATIONS
//         const response = await fetch(`${API_BASE_URL}/api/students/results/${examNumber.toUpperCase()}`);
        
//         if (!response.ok) return null;
        
//         const data = await response.json();
        
//         // Backend already calculates everything:
//         // - subject.finalScore ✓
//         // - subject.grade ✓  
//         // - assessmentStats ✓
//         // - gradeConfiguration ✓
        
//         return data; // Use as-is
//     } catch (error) {
//         console.error('Failed to fetch student data:', error);
//         return null;
//     }
// }

// // function calculateSubjectFinalScore(subject: Subject, gradeConfig: any): number {
// //     if (!gradeConfig) {
// //         return (subject.qa1 + subject.qa2 + subject.endOfTerm) / 3;
// //     }
    
// //     switch (gradeConfig.calculation_method) {
// //         case 'average_all':
// //             return (subject.qa1 + subject.qa2 + subject.endOfTerm) / 3;
        
// //         case 'end_of_term_only':
// //             return subject.endOfTerm;
        
// //         case 'weighted_average':
// //             return (subject.qa1 * gradeConfig.weight_qa1 + 
// //                     subject.qa2 * gradeConfig.weight_qa2 + 
// //                     subject.endOfTerm * gradeConfig.weight_end_of_term) / 100;
        
// //         default:
// //             return (subject.qa1 + subject.qa2 + subject.endOfTerm) / 3;
// //     }
// // }

// function calculateSubjectFinalScore(subject: Subject, gradeConfig: any): number {
//     // Handle null/undefined values
//     const qa1 = subject.qa1 || 0;
//     const qa2 = subject.qa2 || 0;
//     const endOfTerm = subject.endOfTerm || 0;
    
//     // Only calculate if we have at least one valid score (> 0)
//     const validScores = [qa1, qa2, endOfTerm].filter(score => score > 0);
//     if (validScores.length === 0) return 0;
    
//     if (!gradeConfig) {
//         // Simple average of valid scores
//         return validScores.reduce((sum, score) => sum + score, 0) / validScores.length;
//     }
    
//     switch (gradeConfig.calculation_method) {
//         case 'average_all':
//             // Average of valid scores
//             return validScores.reduce((sum, score) => sum + score, 0) / validScores.length;
        
//         case 'end_of_term_only':
//             // Only use endOfTerm if it exists
//             return endOfTerm > 0 ? endOfTerm : 0;
        
//         case 'weighted_average':
//             // Only include assessments with scores
//             let totalWeight = 0;
//             let weightedSum = 0;
            
//             if (qa1 > 0) {
//                 weightedSum += qa1 * gradeConfig.weight_qa1;
//                 totalWeight += gradeConfig.weight_qa1;
//             }
//             if (qa2 > 0) {
//                 weightedSum += qa2 * gradeConfig.weight_qa2;
//                 totalWeight += gradeConfig.weight_qa2;
//             }
//             if (endOfTerm > 0) {
//                 weightedSum += endOfTerm * gradeConfig.weight_end_of_term;
//                 totalWeight += gradeConfig.weight_end_of_term;
//             }
            
//             return totalWeight > 0 ? weightedSum / totalWeight : 0;
        
//         default:
//             return validScores.reduce((sum, score) => sum + score, 0) / validScores.length;
//     }
// }

// // function calculateGradeFromConfig(subject: Subject, gradeConfig: any): string {
// //     const finalScore = calculateSubjectFinalScore(subject, gradeConfig);
// //     return calculateGrade(finalScore, gradeConfig?.pass_mark || 50);
// // }

// function calculateGradeFromConfig(subject: Subject, gradeConfig: any): string {
//     const finalScore = calculateSubjectFinalScore(subject, gradeConfig);
    
//     // If no valid scores, return 'N/A'
//     if (finalScore <= 0) return 'N/A';
    
//     return calculateGrade(finalScore, gradeConfig?.pass_mark || 50);
// }

// function calculateAssessmentStats(studentData: StudentData, gradeConfig: any) {
//     const subjects = studentData.subjects;
    
//     const qa1Average = subjects.reduce((sum, subject) => sum + subject.qa1, 0) / subjects.length;
//     const qa2Average = subjects.reduce((sum, subject) => sum + subject.qa2, 0) / subjects.length;
//     const endOfTermAverage = subjects.reduce((sum, subject) => sum + subject.endOfTerm, 0) / subjects.length;
    
//     let finalAverage = (qa1Average + qa2Average + endOfTermAverage) / 3;
    
//     if (gradeConfig) {
//         finalAverage = calculateFinalScore(qa1Average, qa2Average, endOfTermAverage, gradeConfig);
//     }
    
//     const qa1Rank = studentData.classRank;
//     const qa2Rank = studentData.classRank;
//     const endOfTermRank = studentData.classRank;
    
//     const totalDays = studentData.attendance.present + studentData.attendance.absent;
//     const qa1Days = Math.floor(totalDays * 0.3);
//     const qa2Days = Math.floor(totalDays * 0.3);
//     const endOfTermDays = totalDays - qa1Days - qa2Days;
    
//     return {
//         qa1: {
//             classRank: qa1Rank,
//             termAverage: parseFloat(qa1Average.toFixed(1)),
//             attendance: {
//                 present: Math.floor(qa1Days * 0.9),
//                 absent: qa1Days - Math.floor(qa1Days * 0.9),
//                 late: Math.floor(qa1Days * 0.1)
//             }
//         },
//         qa2: {
//             classRank: qa2Rank,
//             termAverage: parseFloat(qa2Average.toFixed(1)),
//             attendance: {
//                 present: Math.floor(qa2Days * 0.95),
//                 absent: qa2Days - Math.floor(qa2Days * 0.95),
//                 late: Math.floor(qa2Days * 0.05)
//             }
//         },
//         endOfTerm: {
//             classRank: endOfTermRank,
//             termAverage: parseFloat(endOfTermAverage.toFixed(1)),
//             attendance: {
//                 present: Math.floor(endOfTermDays * 0.98),
//                 absent: endOfTermDays - Math.floor(endOfTermDays * 0.98),
//                 late: Math.floor(endOfTermDays * 0.02)
//             }
//         },
//         overall: {
//             termAverage: parseFloat(finalAverage.toFixed(1)),
//             calculationMethod: gradeConfig?.calculation_method || 'average_all'
//         }
//     };
// }

// //NEW CODE
// export const calculateAndUpdateRanks = async (classId: string, term: string) => {
//   const response = await fetch(`${API_BASE_URL}/api/students/calculate-ranks`, {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify({ class_id: classId, term }),
//   });
//   if (!response.ok) throw new Error('Failed to calculate ranks');
//   return response.json();
// };

// //END

// // --- ADMIN PANEL LOGIC ---
// export const fetchAllStudents = async () => {
//     const res = await fetch(`${API_BASE_URL}/api/students`);
//     if (!res.ok) throw new Error('Failed to fetch students');
//     return res.json();
// };

// export const fetchAllSubjects = async () => {
//     const res = await fetch(`${API_BASE_URL}/api/subjects`);
//     if (!res.ok) throw new Error('Failed to fetch subjects');
//     return res.json();
// };

// // UPDATED: Changed from 'class' to 'class_id'
// export const createStudent = async (data: {
//   name: string;
//   class_id: string;  // CHANGED FROM 'class'
//   photo_url?: string;
// }) => {
//   const res = await fetch(`${API_BASE_URL}/api/students`, {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify(data),
//   });
//   if (!res.ok) {
//     const error = await res.json();
//     throw new Error(error.message || 'Failed to create student');
//   }
//   return res.json();
// };

// // UPDATED: Changed from 'class' to 'class_id'
// export const updateStudent = async (id: string, data: {
//   name?: string;
//   class_id?: string;  // CHANGED FROM 'class'
//   photo_url?: string;
// }) => {
//   const res = await fetch(`${API_BASE_URL}/api/students/${id}`, {
//     method: 'PATCH',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify(data),
//   });
//   if (!res.ok) {
//     const error = await res.json();
//     throw new Error(error.message || 'Failed to update student');
//   }
//   return res.json();
// };

// export const deleteStudent = async (id: string) => {
//   const res = await fetch(`${API_BASE_URL}/api/students/${id}`, {
//     method: 'DELETE',
//   });
//   if (!res.ok) {
//     const error = await res.json();
//     throw new Error(error.message || 'Failed to delete student');
//   }
//   return res.json();
// };

// export const upsertAssessment = async (data: any) => {
//   const res = await fetch(`${API_BASE_URL}/api/assessments/upsert`, {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify(data),
//   });
//   if (!res.ok) {
//     const error = await res.json();
//     throw new Error(error.message || 'Failed to save assessment');
//   }
//   return res.json();
// };

// export const upsertReportCard = async (data: any) => {
//   const res = await fetch(`${API_BASE_URL}/api/report-cards/upsert`, {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify(data),
//   });
//   if (!res.ok) {
//     const error = await res.json();
//     throw new Error(error.message || 'Failed to save report card');
//   }
//   return res.json();
// };

// export const fetchStudentAssessments = async (id: string) => {
//   const res = await fetch(`${API_BASE_URL}/api/students/${id}/assessments`);
//   if (!res.ok) {
//     console.error('Failed to fetch assessments');
//     return [];
//   }
//   return res.json();
// };

// export const fetchStudentReportCard = async (id: string, term: string) => {
//   const res = await fetch(`${API_BASE_URL}/api/students/${id}/report-cards/${term}`);
//   if (!res.ok) {
//     if (res.status === 404) {
//       console.log('No report card found for this term');
//       return null;
//     }
//     console.error('Failed to fetch report card');
//     return null;
//   }
//   return res.json();
// };

// export const calculateGrade = (score: number, passMark: number = 50) => {
//   if (score >= 80) return 'A';
//   if (score >= 70) return 'B';
//   if (score >= 60) return 'C';
//   // if (score >= 50) return 'D';
//   if (score >= passMark) return 'D'; // Changed from 50 to passMark
//   return 'F';
// };

// export const createSubject = async (data: { name: string }) => {
//   const res = await fetch(`${API_BASE_URL}/api/subjects`, {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify(data),
//   });
//   if (!res.ok) {
//     const error = await res.json();
//     throw new Error(error.message || 'Failed to create subject');
//   }
//   return res.json();
// };

// export const deleteSubject = async (id: string) => {
//   const res = await fetch(`${API_BASE_URL}/api/subjects/${id}`, {
//     method: 'DELETE',
//   });
//   if (!res.ok) {
//     const error = await res.json();
//     throw new Error(error.message || 'Failed to delete subject');
//   }
//   return res.json();
// };

// // --- NEW CLASS MANAGEMENT FUNCTIONS ---
// export const fetchAllClasses = async (): Promise<Class[]> => {
//   try {
//     const res = await fetch(`${API_BASE_URL}/api/classes`);
//     if (!res.ok) return [];
//     return await res.json();
//   } catch (error) {
//     console.error('Error fetching classes:', error);
//     return [];
//   }
// };

// export const createClass = async (data: {
//   name: string;
//   academic_year: string;
//   term: string;
// }): Promise<Class> => {
//   const res = await fetch(`${API_BASE_URL}/api/classes`, {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify(data),
//   });
//   if (!res.ok) {
//     const error = await res.json();
//     throw new Error(error.message || 'Failed to create class');
//   }
//   return res.json();
// };

// export const deleteClass = async (id: string): Promise<void> => {
//   const res = await fetch(`${API_BASE_URL}/api/classes/${id}`, {
//     method: 'DELETE',
//   });
//   if (!res.ok) {
//     const error = await res.json();
//     throw new Error(error.message || 'Failed to delete class');
//   }
// };

// export const fetchStudentsByClass = async (classId: string): Promise<any[]> => {
//   try {
//     const res = await fetch(`${API_BASE_URL}/api/classes/${classId}/students`);
//     if (!res.ok) return [];
//     return res.json();
//   } catch (error) {
//     console.error('Error fetching class students:', error);
//     return [];
//   }
// };

// // Add this function to your existing service file
// export const fetchClassResults = async (classId: string): Promise<any[]> => {
//   try {
//     const res = await fetch(`${API_BASE_URL}/api/students/class/${classId}/results`);
//     if (!res.ok) {
//       if (res.status === 404) {
//         console.log('No results found for this class');
//         return [];
//       }
//       throw new Error('Failed to fetch class results');
//     }
//     return await res.json();
//   } catch (error) {
//     console.error('Error fetching class results:', error);
//     return [];
//   }
// };

// // Add this function to fetch grade configurations (for admin panel)
// export const fetchGradeConfigurations = async () => {
//   try {
//     const res = await fetch(`${API_BASE_URL}/api/grade-configs`);
//     if (!res.ok) return [];
//     return await res.json();
//   } catch (error) {
//     console.error('Failed to fetch grade configurations:', error);
//     return [];
//   }
// };



// // const API_BASE_URL = 'http://localhost:3000';

// // // --- TYPES ---

// // export interface Subject {
// //     name: string;
// //     qa1: number;
// //     qa2: number;
// //     endOfTerm: number;
// //     grade: string;
// //     finalScore?: number;
// // }

// // // export interface StudentData {
// // //     id: string;
// // //     name: string;
// // //     examNumber: string;
// // //     class: string;
// // //     term: string;
// // //     photo: string;
// // //     subjects: Subject[];
// // //     attendance: { present: number; absent: number; late: number };
// // //     classRank: number;
// // //     totalStudents: number;
// // //     teacherRemarks: string;
    
// // //     // Make this optional with ?
// // //     assessmentStats?: {
// // //         qa1: {
// // //             classRank: number;
// // //             termAverage: number;
// // //             attendance: {
// // //                 present: number;
// // //                 absent: number;
// // //                 late: number;
// // //             };
// // //         };
// // //         qa2: {
// // //             classRank: number;
// // //             termAverage: number;
// // //             attendance: {
// // //                 present: number;
// // //                 absent: number;
// // //                 late: number;
// // //             };
// // //         };
// // //         endOfTerm: {
// // //             classRank: number;
// // //             termAverage: number;
// // //             attendance: {
// // //                 present: number;
// // //                 absent: number;
// // //                 late: number;
// // //             };
// // //         };

// // //         overall: { // ADD THIS
// // //             termAverage: number;
// // //             calculationMethod: string;
// // //         };
// // //     };
    
// // //     // Add grade configuration to StudentData
// // //     gradeConfiguration?: {
// // //         configuration_name: string;
// // //         calculation_method: 'average_all' | 'end_of_term_only' | 'weighted_average';
// // //         weight_qa1: number;
// // //         weight_qa2: number;
// // //         weight_end_of_term: number;
// // //     };
// // // }

// // export interface StudentData {
// //     id: string;
// //     name: string;
// //     examNumber: string;
// //     class: string;
// //     term: string;
// //     photo: string;
// //     subjects: Subject[];
// //     attendance: { present: number; absent: number; late: number };
// //     classRank: number;
// //     totalStudents: number;
// //     teacherRemarks: string;
    
// //     // Make this optional with ?
// //     assessmentStats?: {
// //         qa1: {
// //             classRank: number;
// //             termAverage: number;
// //             overallGrade: string; // ADD THIS
// //             attendance?: { // Make optional
// //                 present: number;
// //                 absent: number;
// //                 late: number;
// //             };
// //         };
// //         qa2: {
// //             classRank: number;
// //             termAverage: number;
// //             overallGrade: string; // ADD THIS
// //             attendance?: { // Make optional
// //                 present: number;
// //                 absent: number;
// //                 late: number;
// //             };
// //         };
// //         endOfTerm: {
// //             classRank: number;
// //             termAverage: number;
// //             overallGrade: string; // ADD THIS
// //             attendance: { // Keep required for End of Term
// //                 present: number;
// //                 absent: number;
// //                 late: number;
// //             };
// //         };
// //         overall: {
// //             termAverage: number;
// //             calculationMethod: string;
// //         };
// //     };
    
// //     // Add grade configuration to StudentData
// //     gradeConfiguration?: {
// //         configuration_name: string;
// //         calculation_method: 'average_all' | 'end_of_term_only' | 'weighted_average';
// //         weight_qa1: number;
// //         weight_qa2: number;
// //         weight_end_of_term: number;
// //     };
// // }
// // export interface SubjectRecord {
// //     id: string;
// //     name: string;
// // }

// // // Import grade config service
// // import { getActiveGradeConfig, calculateFinalScore } from './gradeConfigService';

// // // --- STUDENT/PARENT PORTAL LOGIC ---
// // export async function fetchStudentByExamNumber(examNumber: string): Promise<StudentData | null> {
// //     try {
// //         // Fetch both student data and active grade config in parallel
// //         const [response, gradeConfig] = await Promise.all([
// //             fetch(`${API_BASE_URL}/api/students/results/${examNumber.toUpperCase()}`),
// //             getActiveGradeConfig()
// //         ]);
        
// //         if (!response.ok) return null;
// //         const data = await response.json();
        
// //         // Add grade configuration to student data
// //         data.gradeConfiguration = gradeConfig;
        
// //         // If backend doesn't provide assessmentStats, calculate them
// //         if (!data.assessmentStats) {
// //             data.assessmentStats = calculateAssessmentStats(data, gradeConfig);
// //         }
        
// //         // Calculate subject final scores based on grade configuration
// //         if (gradeConfig && data.subjects) {
// //             data.subjects = data.subjects.map(subject => ({
// //                 ...subject,
// //                 // Add finalScore to subject if not already present
// //                 finalScore: calculateSubjectFinalScore(subject, gradeConfig),
// //                 // Update grade based on final score
// //                 grade: calculateGradeFromConfig(subject, gradeConfig)
// //             }));
// //         }
        
// //         return data;
// //     } catch (error) {
// //         console.error('Failed to fetch student data:', error);
// //         return null;
// //     }
// // }

// // // Helper to calculate subject final score based on grade configuration
// // function calculateSubjectFinalScore(subject: Subject, gradeConfig: any): number {
// //     if (!gradeConfig) {
// //         // Default: average of all tests
// //         return (subject.qa1 + subject.qa2 + subject.endOfTerm) / 3;
// //     }
    
// //     switch (gradeConfig.calculation_method) {
// //         case 'average_all':
// //             return (subject.qa1 + subject.qa2 + subject.endOfTerm) / 3;
        
// //         case 'end_of_term_only':
// //             return subject.endOfTerm;
        
// //         case 'weighted_average':
// //             return (subject.qa1 * gradeConfig.weight_qa1 + 
// //                     subject.qa2 * gradeConfig.weight_qa2 + 
// //                     subject.endOfTerm * gradeConfig.weight_end_of_term) / 100;
        
// //         default:
// //             return (subject.qa1 + subject.qa2 + subject.endOfTerm) / 3;
// //     }
// // }

// // // Helper to calculate grade based on grade configuration
// // function calculateGradeFromConfig(subject: Subject, gradeConfig: any): string {
// //     const finalScore = calculateSubjectFinalScore(subject, gradeConfig);
// //     return calculateGrade(finalScore);
// // }

// // // Update this helper function to use grade configuration
// // function calculateAssessmentStats(studentData: StudentData, gradeConfig: any) {
// //     const subjects = studentData.subjects;
    
// //     // Calculate averages for each assessment
// //     const qa1Average = subjects.reduce((sum, subject) => sum + subject.qa1, 0) / subjects.length;
// //     const qa2Average = subjects.reduce((sum, subject) => sum + subject.qa2, 0) / subjects.length;
// //     const endOfTermAverage = subjects.reduce((sum, subject) => sum + subject.endOfTerm, 0) / subjects.length;
    
// //     // Calculate final average based on grade configuration
// //     let finalAverage = (qa1Average + qa2Average + endOfTermAverage) / 3; // Default
    
// //     if (gradeConfig) {
// //         finalAverage = calculateFinalScore(qa1Average, qa2Average, endOfTermAverage, gradeConfig);
// //     }
    
// //     // For class rank, you can use the overall classRank or calculate separately
// //     // For now, we'll use the overall classRank for all assessments
// //     const qa1Rank = studentData.classRank;
// //     const qa2Rank = studentData.classRank;
// //     const endOfTermRank = studentData.classRank;
    
// //     // Distribute attendance across assessments (simple example)
// //     const totalDays = studentData.attendance.present + studentData.attendance.absent;
// //     const qa1Days = Math.floor(totalDays * 0.3);
// //     const qa2Days = Math.floor(totalDays * 0.3);
// //     const endOfTermDays = totalDays - qa1Days - qa2Days;
    
// //     return {
// //         qa1: {
// //             classRank: qa1Rank,
// //             termAverage: parseFloat(qa1Average.toFixed(1)),
// //             attendance: {
// //                 present: Math.floor(qa1Days * 0.9), // 90% present for QA1
// //                 absent: qa1Days - Math.floor(qa1Days * 0.9),
// //                 late: Math.floor(qa1Days * 0.1) // 10% late
// //             }
// //         },
// //         qa2: {
// //             classRank: qa2Rank,
// //             termAverage: parseFloat(qa2Average.toFixed(1)),
// //             attendance: {
// //                 present: Math.floor(qa2Days * 0.95), // 95% present for QA2
// //                 absent: qa2Days - Math.floor(qa2Days * 0.95),
// //                 late: Math.floor(qa2Days * 0.05) // 5% late
// //             }
// //         },
// //         endOfTerm: {
// //             classRank: endOfTermRank,
// //             termAverage: parseFloat(endOfTermAverage.toFixed(1)),
// //             attendance: {
// //                 present: Math.floor(endOfTermDays * 0.98), // 98% present for End of Term
// //                 absent: endOfTermDays - Math.floor(endOfTermDays * 0.98),
// //                 late: Math.floor(endOfTermDays * 0.02) // 2% late
// //             }
// //         },
// //         // Add overall average based on grade configuration
// //         overall: {
// //             termAverage: parseFloat(finalAverage.toFixed(1)),
// //             calculationMethod: gradeConfig?.calculation_method || 'average_all'
// //         }
// //     };
// // }

// // // --- ADMIN PANEL LOGIC ---
// // // All existing admin functions remain the same
// // export const fetchAllStudents = async () => {
// //     const res = await fetch(`${API_BASE_URL}/api/students`);
// //     if (!res.ok) throw new Error('Failed to fetch students');
// //     return res.json();
// // };

// // export const fetchAllSubjects = async () => {
// //     const res = await fetch(`${API_BASE_URL}/api/subjects`);
// //     if (!res.ok) throw new Error('Failed to fetch subjects');
// //     return res.json();
// // };

// // export const createStudent = async (data: any) => {
// //     const res = await fetch(`${API_BASE_URL}/api/students`, {
// //         method: 'POST',
// //         headers: { 'Content-Type': 'application/json' },
// //         body: JSON.stringify(data),
// //     });
// //     if (!res.ok) {
// //         const error = await res.json();
// //         throw new Error(error.message || 'Failed to create student');
// //     }
// //     return res.json();
// // };

// // export const updateStudent = async (id: string, data: any) => {
// //     const res = await fetch(`${API_BASE_URL}/api/students/${id}`, {
// //         method: 'PATCH',
// //         headers: { 'Content-Type': 'application/json' },
// //         body: JSON.stringify(data),
// //     });
// //     if (!res.ok) {
// //         const error = await res.json();
// //         throw new Error(error.message || 'Failed to update student');
// //     }
// //     return res.json();
// // };

// // export const deleteStudent = async (id: string) => {
// //     const res = await fetch(`${API_BASE_URL}/api/students/${id}`, {
// //         method: 'DELETE',
// //     });
// //     if (!res.ok) {
// //         const error = await res.json();
// //         throw new Error(error.message || 'Failed to delete student');
// //     }
// //     return res.json();
// // };

// // export const upsertAssessment = async (data: any) => {
// //     const res = await fetch(`${API_BASE_URL}/api/assessments/upsert`, {
// //         method: 'POST',
// //         headers: { 'Content-Type': 'application/json' },
// //         body: JSON.stringify(data),
// //     });
// //     if (!res.ok) {
// //         const error = await res.json();
// //         throw new Error(error.message || 'Failed to save assessment');
// //     }
// //     return res.json();
// // };

// // export const upsertReportCard = async (data: any) => {
// //     const res = await fetch(`${API_BASE_URL}/api/report-cards/upsert`, {
// //         method: 'POST',
// //         headers: { 'Content-Type': 'application/json' },
// //         body: JSON.stringify(data),
// //     });
// //     if (!res.ok) {
// //         const error = await res.json();
// //         throw new Error(error.message || 'Failed to save report card');
// //     }
// //     return res.json();
// // };

// // export const fetchStudentAssessments = async (id: string) => {
// //     const res = await fetch(`${API_BASE_URL}/api/students/${id}/assessments`);
// //     if (!res.ok) {
// //         console.error('Failed to fetch assessments');
// //         return [];
// //     }
// //     return res.json();
// // };

// // export const fetchStudentReportCard = async (id: string, term: string) => {
// //     const res = await fetch(`${API_BASE_URL}/api/students/${id}/report-cards/${term}`);
// //     if (!res.ok) {
// //         if (res.status === 404) {
// //             console.log('No report card found for this term');
// //             return null;
// //         }
// //         console.error('Failed to fetch report card');
// //         return null;
// //     }
// //     return res.json();
// // };

// // export const calculateGrade = (score: number) => {
// //     if (score >= 80) return 'A';
// //     if (score >= 70) return 'B';
// //     if (score >= 60) return 'C';
// //     if (score >= 50) return 'D';
// //     return 'F';
// // };

// // export const createSubject = async (data: { name: string }) => {
// //     const res = await fetch(`${API_BASE_URL}/api/subjects`, {
// //         method: 'POST',
// //         headers: { 'Content-Type': 'application/json' },
// //         body: JSON.stringify(data),
// //     });
// //     if (!res.ok) {
// //         const error = await res.json();
// //         throw new Error(error.message || 'Failed to create subject');
// //     }
// //     return res.json();
// // };

// // export const deleteSubject = async (id: string) => {
// //     const res = await fetch(`${API_BASE_URL}/api/subjects/${id}`, {
// //         method: 'DELETE',
// //     });
// //     if (!res.ok) {
// //         const error = await res.json();
// //         throw new Error(error.message || 'Failed to delete subject');
// //     }
// //     return res.json();
// // };

// // // Add this function to fetch grade configurations (for admin panel)
// // export const fetchGradeConfigurations = async () => {
// //     try {
// //         const res = await fetch(`${API_BASE_URL}/api/grade-configs`);
// //         if (!res.ok) return [];
// //         return await res.json();
// //     } catch (error) {
// //         console.error('Failed to fetch grade configurations:', error);
// //         return [];
// //     }
// // };


// // const API_BASE_URL = 'http://localhost:3000';

// // // --- TYPES ---
// // export interface Subject {
// //     name: string;
// //     qa1: number;
// //     qa2: number;
// //     endOfTerm: number;
// //     grade: string;
// // }

// // export interface StudentData {
// //     id: string;
// //     name: string;
// //     examNumber: string;
// //     class: string;
// //     term: string;
// //     photo: string;
// //     subjects: Subject[];
// //     attendance: { present: number; absent: number; late: number };
// //     classRank: number;
// //     totalStudents: number;
// //     teacherRemarks: string;
    
// //     // Make this optional with ?
// //     assessmentStats?: {
// //         qa1: {
// //             classRank: number;
// //             termAverage: number;
// //             attendance: {
// //                 present: number;
// //                 absent: number;
// //                 late: number;
// //             };
// //         };
// //         qa2: {
// //             classRank: number;
// //             termAverage: number;
// //             attendance: {
// //                 present: number;
// //                 absent: number;
// //                 late: number;
// //             };
// //         };
// //         endOfTerm: {
// //             classRank: number;
// //             termAverage: number;
// //             attendance: {
// //                 present: number;
// //                 absent: number;
// //                 late: number;
// //             };
// //         };
// //     };
// // }

// // export interface SubjectRecord {
// //     id: string;
// //     name: string;
// // }

// // // --- STUDENT/PARENT PORTAL LOGIC ---
// // export async function fetchStudentByExamNumber(examNumber: string): Promise<StudentData | null> {
// //     try {
// //         const response = await fetch(`${API_BASE_URL}/api/students/results/${examNumber.toUpperCase()}`);
// //         if (!response.ok) return null;
// //         const data = await response.json();
        
// //         // If backend doesn't provide assessmentStats, calculate them
// //         if (!data.assessmentStats) {
// //             data.assessmentStats = calculateAssessmentStats(data);
// //         }
        
// //         return data;
// //     } catch (error) {
// //         console.error('Failed to fetch student data:', error);
// //         return null;
// //     }
// // }

// // // Add this helper function to calculate stats
// // function calculateAssessmentStats(studentData: StudentData) {
// //     const subjects = studentData.subjects;
    
// //     // Calculate averages for each assessment
// //     const qa1Average = subjects.reduce((sum, subject) => sum + subject.qa1, 0) / subjects.length;
// //     const qa2Average = subjects.reduce((sum, subject) => sum + subject.qa2, 0) / subjects.length;
// //     const endOfTermAverage = subjects.reduce((sum, subject) => sum + subject.endOfTerm, 0) / subjects.length;
    
// //     // For class rank, you can use the overall classRank or calculate separately
// //     // For now, we'll use the overall classRank for all assessments
// //     // In a real system, these would be different per assessment
// //     const qa1Rank = studentData.classRank;
// //     const qa2Rank = studentData.classRank;
// //     const endOfTermRank = studentData.classRank;
    
// //     // Distribute attendance across assessments (simple example)
// //     const totalDays = studentData.attendance.present + studentData.attendance.absent;
// //     const qa1Days = Math.floor(totalDays * 0.3);
// //     const qa2Days = Math.floor(totalDays * 0.3);
// //     const endOfTermDays = totalDays - qa1Days - qa2Days;
    
// //     return {
// //         qa1: {
// //             classRank: qa1Rank,
// //             termAverage: parseFloat(qa1Average.toFixed(1)),
// //             attendance: {
// //                 present: Math.floor(qa1Days * 0.9), // 90% present for QA1
// //                 absent: qa1Days - Math.floor(qa1Days * 0.9),
// //                 late: Math.floor(qa1Days * 0.1) // 10% late
// //             }
// //         },
// //         qa2: {
// //             classRank: qa2Rank,
// //             termAverage: parseFloat(qa2Average.toFixed(1)),
// //             attendance: {
// //                 present: Math.floor(qa2Days * 0.95), // 95% present for QA2
// //                 absent: qa2Days - Math.floor(qa2Days * 0.95),
// //                 late: Math.floor(qa2Days * 0.05) // 5% late
// //             }
// //         },
// //         endOfTerm: {
// //             classRank: endOfTermRank,
// //             termAverage: parseFloat(endOfTermAverage.toFixed(1)),
// //             attendance: {
// //                 present: Math.floor(endOfTermDays * 0.98), // 98% present for End of Term
// //                 absent: endOfTermDays - Math.floor(endOfTermDays * 0.98),
// //                 late: Math.floor(endOfTermDays * 0.02) // 2% late
// //             }
// //         }
// //     };
// // }

// // // --- ADMIN PANEL LOGIC ---
// // export const fetchAllStudents = async () => {
// //     const res = await fetch(`${API_BASE_URL}/api/students`);
// //     if (!res.ok) throw new Error('Failed to fetch students');
// //     return res.json();
// // };

// // export const fetchAllSubjects = async () => {
// //     const res = await fetch(`${API_BASE_URL}/api/subjects`);
// //     if (!res.ok) throw new Error('Failed to fetch subjects');
// //     return res.json();
// // };

// // export const createStudent = async (data: any) => {
// //     const res = await fetch(`${API_BASE_URL}/api/students`, {
// //         method: 'POST',
// //         headers: { 'Content-Type': 'application/json' },
// //         body: JSON.stringify(data),
// //     });
// //     if (!res.ok) {
// //         const error = await res.json();
// //         throw new Error(error.message || 'Failed to create student');
// //     }
// //     return res.json();
// // };

// // export const updateStudent = async (id: string, data: any) => {
// //     const res = await fetch(`${API_BASE_URL}/api/students/${id}`, {
// //         method: 'PATCH',
// //         headers: { 'Content-Type': 'application/json' },
// //         body: JSON.stringify(data),
// //     });
// //     if (!res.ok) {
// //         const error = await res.json();
// //         throw new Error(error.message || 'Failed to update student');
// //     }
// //     return res.json();
// // };

// // export const deleteStudent = async (id: string) => {
// //     const res = await fetch(`${API_BASE_URL}/api/students/${id}`, {
// //         method: 'DELETE',
// //     });
// //     if (!res.ok) {
// //         const error = await res.json();
// //         throw new Error(error.message || 'Failed to delete student');
// //     }
// //     return res.json();
// // };

// // export const upsertAssessment = async (data: any) => {
// //     const res = await fetch(`${API_BASE_URL}/api/assessments/upsert`, {
// //         method: 'POST',
// //         headers: { 'Content-Type': 'application/json' },
// //         body: JSON.stringify(data),
// //     });
// //     if (!res.ok) {
// //         const error = await res.json();
// //         throw new Error(error.message || 'Failed to save assessment');
// //     }
// //     return res.json();
// // };

// // export const upsertReportCard = async (data: any) => {
// //     const res = await fetch(`${API_BASE_URL}/api/report-cards/upsert`, {
// //         method: 'POST',
// //         headers: { 'Content-Type': 'application/json' },
// //         body: JSON.stringify(data),
// //     });
// //     if (!res.ok) {
// //         const error = await res.json();
// //         throw new Error(error.message || 'Failed to save report card');
// //     }
// //     return res.json();
// // };

// // export const fetchStudentAssessments = async (id: string) => {
// //     const res = await fetch(`${API_BASE_URL}/api/students/${id}/assessments`);
// //     if (!res.ok) {
// //         console.error('Failed to fetch assessments');
// //         return [];
// //     }
// //     return res.json();
// // };

// // export const fetchStudentReportCard = async (id: string, term: string) => {
// //     const res = await fetch(`${API_BASE_URL}/api/students/${id}/report-cards/${term}`);
// //     if (!res.ok) {
// //         if (res.status === 404) {
// //             console.log('No report card found for this term');
// //             return null;
// //         }
// //         console.error('Failed to fetch report card');
// //         return null;
// //     }
// //     return res.json();
// // };

// // export const calculateGrade = (score: number) => {
// //     if (score >= 80) return 'A';
// //     if (score >= 70) return 'B';
// //     if (score >= 60) return 'C';
// //     if (score >= 50) return 'D';
// //     return 'F';
// // };

// // export const createSubject = async (data: { name: string }) => {
// //     const res = await fetch(`${API_BASE_URL}/api/subjects`, {
// //         method: 'POST',
// //         headers: { 'Content-Type': 'application/json' },
// //         body: JSON.stringify(data),
// //     });
// //     if (!res.ok) {
// //         const error = await res.json();
// //         throw new Error(error.message || 'Failed to create subject');
// //     }
// //     return res.json();
// // };

// // export const deleteSubject = async (id: string) => {
// //     const res = await fetch(`${API_BASE_URL}/api/subjects/${id}`, {
// //         method: 'DELETE',
// //     });
// //     if (!res.ok) {
// //         const error = await res.json();
// //         throw new Error(error.message || 'Failed to delete subject');
// //     }
// //     return res.json();
// // };

// // // const API_BASE_URL = 'http://localhost:3000';

// // // // --- TYPES ---
// // // export interface Subject {
// // //     name: string;
// // //     qa1: number;
// // //     qa2: number;
// // //     endOfTerm: number;
// // //     grade: string;
// // // }

// // // export interface StudentData {
// // //     id: string;
// // //     name: string;
// // //     examNumber: string;
// // //     class: string;
// // //     term: string;
// // //     photo: string;
// // //     subjects: Subject[];
// // //     attendance: { present: number; absent: number; late: number };
// // //     classRank: number;
// // //     totalStudents: number;
// // //     teacherRemarks: string;

    
// // // }

// // // export interface SubjectRecord {
// // //     id: string;
// // //     name: string;
// // // }

// // // // --- STUDENT/PARENT PORTAL LOGIC ---
// // // export async function fetchStudentByExamNumber(examNumber: string): Promise<StudentData | null> {
// // //     try {
// // //         const response = await fetch(`${API_BASE_URL}/api/students/results/${examNumber.toUpperCase()}`);
// // //         if (!response.ok) return null;
// // //         return await response.json();
// // //     } catch (error) {
// // //         console.error('Failed to fetch student data:', error);
// // //         return null;
// // //     }
// // // }

// // // // --- ADMIN PANEL LOGIC ---
// // // export const fetchAllStudents = async () => {
// // //     const res = await fetch(`${API_BASE_URL}/api/students`);
// // //     if (!res.ok) throw new Error('Failed to fetch students');
// // //     return res.json();
// // // };

// // // export const fetchAllSubjects = async () => {
// // //     const res = await fetch(`${API_BASE_URL}/api/subjects`);
// // //     if (!res.ok) throw new Error('Failed to fetch subjects');
// // //     return res.json();
// // // };

// // // export const createStudent = async (data: any) => {
// // //     const res = await fetch(`${API_BASE_URL}/api/students`, {
// // //         method: 'POST',
// // //         headers: { 'Content-Type': 'application/json' },
// // //         body: JSON.stringify(data),
// // //     });
// // //     if (!res.ok) {
// // //         const error = await res.json();
// // //         throw new Error(error.message || 'Failed to create student');
// // //     }
// // //     return res.json();
// // // };

// // // export const updateStudent = async (id: string, data: any) => {
// // //     const res = await fetch(`${API_BASE_URL}/api/students/${id}`, {
// // //         method: 'PATCH',
// // //         headers: { 'Content-Type': 'application/json' },
// // //         body: JSON.stringify(data),
// // //     });
// // //     if (!res.ok) {
// // //         const error = await res.json();
// // //         throw new Error(error.message || 'Failed to update student');
// // //     }
// // //     return res.json();
// // // };

// // // export const deleteStudent = async (id: string) => {
// // //     const res = await fetch(`${API_BASE_URL}/api/students/${id}`, {
// // //         method: 'DELETE',
// // //     });
// // //     if (!res.ok) {
// // //         const error = await res.json();
// // //         throw new Error(error.message || 'Failed to delete student');
// // //     }
// // //     return res.json();
// // // };

// // // export const upsertAssessment = async (data: any) => {
// // //     const res = await fetch(`${API_BASE_URL}/api/assessments/upsert`, {
// // //         method: 'POST',
// // //         headers: { 'Content-Type': 'application/json' },
// // //         body: JSON.stringify(data),
// // //     });
// // //     if (!res.ok) {
// // //         const error = await res.json();
// // //         throw new Error(error.message || 'Failed to save assessment');
// // //     }
// // //     return res.json();
// // // };

// // // export const upsertReportCard = async (data: any) => {
// // //     const res = await fetch(`${API_BASE_URL}/api/report-cards/upsert`, {
// // //         method: 'POST',
// // //         headers: { 'Content-Type': 'application/json' },
// // //         body: JSON.stringify(data),
// // //     });
// // //     if (!res.ok) {
// // //         const error = await res.json();
// // //         throw new Error(error.message || 'Failed to save report card');
// // //     }
// // //     return res.json();
// // // };

// // // export const fetchStudentAssessments = async (id: string) => {
// // //     const res = await fetch(`${API_BASE_URL}/api/students/${id}/assessments`);
// // //     if (!res.ok) {
// // //         console.error('Failed to fetch assessments');
// // //         return [];
// // //     }
// // //     return res.json();
// // // };

// // // export const fetchStudentReportCard = async (id: string, term: string) => {
// // //     const res = await fetch(`${API_BASE_URL}/api/students/${id}/report-cards/${term}`);
// // //     if (!res.ok) {
// // //         if (res.status === 404) {
// // //             console.log('No report card found for this term');
// // //             return null;
// // //         }
// // //         console.error('Failed to fetch report card');
// // //         return null;
// // //     }
// // //     return res.json();
// // // };

// // // export const calculateGrade = (score: number) => {
// // //     if (score >= 80) return 'A';
// // //     if (score >= 70) return 'B';
// // //     if (score >= 60) return 'C';
// // //     if (score >= 50) return 'D';
// // //     return 'F';
// // // };


// // // export const createSubject = async (data: { name: string }) => {
// // //     const res = await fetch(`${API_BASE_URL}/api/subjects`, {
// // //         method: 'POST',
// // //         headers: { 'Content-Type': 'application/json' },
// // //         body: JSON.stringify(data),
// // //     });
// // //     if (!res.ok) {
// // //         const error = await res.json();
// // //         throw new Error(error.message || 'Failed to create subject');
// // //     }
// // //     return res.json();
// // // };

// // // export const deleteSubject = async (id: string) => {
// // //     const res = await fetch(`${API_BASE_URL}/api/subjects/${id}`, {
// // //         method: 'DELETE',
// // //     });
// // //     if (!res.ok) {
// // //         const error = await res.json();
// // //         throw new Error(error.message || 'Failed to delete subject');
// // //     }
// // //     return res.json();
// // // };


// // // // const API_BASE_URL = 'http://localhost:3000';

// // // // // --- TYPES ---
// // // // export interface Subject {
// // // //     name: string;
// // // //     qa1: number;
// // // //     qa2: number;
// // // //     endOfTerm: number;
// // // //     grade: string;
// // // // }

// // // // export interface StudentData {
// // // //     id: string;
// // // //     name: string;
// // // //     examNumber: string;
// // // //     class: string;
// // // //     term: string;
// // // //     photo: string;
// // // //     subjects: Subject[];
// // // //     attendance: { present: number; absent: number; late: number };
// // // //     classRank: number;
// // // //     totalStudents: number;
// // // //     teacherRemarks: string;
// // // // }

// // // // export interface SubjectRecord {
// // // //     id: string;
// // // //     name: string;
// // // // }

// // // // // --- STUDENT/PARENT PORTAL LOGIC ---
// // // // export async function fetchStudentByExamNumber(examNumber: string): Promise<StudentData | null> {
// // // //     try {
// // // //         const response = await fetch(`${API_BASE_URL}/api/students/results/${examNumber.toUpperCase()}`);
// // // //         if (!response.ok) return null;
// // // //         return await response.json();
// // // //     } catch (error) {
// // // //         console.error('Failed to fetch student data:', error);
// // // //         return null;
// // // //     }
// // // // }

// // // // // --- ADMIN PANEL LOGIC (Add these below your existing code) ---

// // // // export const fetchAllStudents = async () => {
// // // //     const res = await fetch(`${API_BASE_URL}/api/students`);
// // // //     return res.json();
// // // // };

// // // // export const fetchAllSubjects = async () => {
// // // //     const res = await fetch(`${API_BASE_URL}/api/subjects`);
// // // //     return res.json();
// // // // };

// // // // export const createStudent = async (data: any) => {
// // // //     const res = await fetch(`${API_BASE_URL}/api/students`, {
// // // //         method: 'POST',
// // // //         headers: { 'Content-Type': 'application/json' },
// // // //         body: JSON.stringify(data),
// // // //     });
// // // //     return res.json();
// // // // };

// // // // export const upsertAssessment = async (data: any) => {
// // // //     const res = await fetch(`${API_BASE_URL}/api/assessments/upsert`, {
// // // //         method: 'POST',
// // // //         headers: { 'Content-Type': 'application/json' },
// // // //         body: JSON.stringify(data),
// // // //     });
// // // //     if (!res.ok) throw new Error('Failed to save assessment');
// // // //     return res.json();
// // // // };

// // // // export const upsertReportCard = async (data: any) => {
// // // //     const res = await fetch(`${API_BASE_URL}/api/report-cards/upsert`, {
// // // //         method: 'POST',
// // // //         headers: { 'Content-Type': 'application/json' },
// // // //         body: JSON.stringify(data),
// // // //     });
// // // //     return res.json();
// // // // };

// // // // export const calculateGrade = (score: number) => {
// // // //     if (score >= 80) return 'A';
// // // //     if (score >= 70) return 'B';
// // // //     if (score >= 60) return 'C';
// // // //     if (score >= 50) return 'D';
// // // //     return 'F';
// // // // };

// // // // // Add these to match your AdminPanel imports
// // // // export const updateStudent = async (id: string, data: any) => { /* PATCH call */ };
// // // // export const deleteStudent = async (id: string) => { /* DELETE call */ };
// // // // export const fetchStudentAssessments = async (id: string) => { /* GET call */ return []; };
// // // // export const fetchStudentReportCard = async (id: string, term: string) => { /* GET call */ return null; };


// // // // // src/services/studentService.ts

// // // // const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// // // // export interface Subject {
// // // //     name: string;
// // // //     qa1: number;
// // // //     qa2: number;
// // // //     endOfTerm: number;
// // // //     grade: string;
// // // // }

// // // // export interface StudentData {
// // // //     id: string;
// // // //     name: string;
// // // //     examNumber: string;
// // // //     class: string;
// // // //     term: string;
// // // //     photo: string;
// // // //     subjects: Subject[];
// // // //     attendance: { present: number; absent: number; late: number };
// // // //     classRank: number;
// // // //     totalStudents: number;
// // // //     teacherRemarks: string;
// // // // }

// // // // /**
// // // //  * Fetches student results from the NestJS backend
// // // //  */
// // // // export async function fetchStudentByExamNumber(examNumber: string): Promise<StudentData | null> {
// // // //     try {
// // // //         const response = await fetch(`${API_BASE_URL}/students/results/${examNumber.toUpperCase()}`, {
// // // //             method: 'GET',
// // // //             headers: {
// // // //                 'Content-Type': 'application/json',
// // // //             },
// // // //         });

// // // //         if (!response.ok) {
// // // //             if (response.status === 404) {
// // // //                 console.warn('Student not found');
// // // //             }
// // // //             return null;
// // // //         }

// // // //         return await response.json();
// // // //     } catch (error) {
// // // //         console.error('Failed to fetch student data:', error);
// // // //         return null;
// // // //     }
// // // // }