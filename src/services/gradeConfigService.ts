// const API_BASE_URL = 'http://localhost:3000';
const API_BASE_URL = 'https://eduspace-portal-backend.onrender.com';


// ====================== ADD SCHOOL ID HELPERS ======================
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

const getAuthToken = () => {
    return localStorage.getItem('token');
};

const authHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getAuthToken()}`
});
// ====================== END SCHOOL ID HELPERS ======================

export interface GradeConfiguration {
    id: string;
    school_id: string;
    configuration_name: string;
    calculation_method: 'average_all' | 'end_of_term_only' | 'weighted_average';
    weight_qa1: number;
    weight_qa2: number;
    weight_end_of_term: number;
    pass_mark: number;
    is_active: boolean;
    created_at: string;
}

export interface GradeScale {
    grade: string;
    min_score: number;
    max_score: number;
    description: string;
}

export async function getActiveGradeConfig(): Promise<GradeConfiguration | null> {
    try {
        const schoolId = getSchoolId();
        const url = schoolId ? `${API_BASE_URL}/api/grade-configs/active?schoolId=${schoolId}` : `${API_BASE_URL}/api/grade-configs/active`;

        const response = await fetch(url, {
            headers: authHeaders()
        });
        if (!response.ok) return null;
        return await response.json();
    } catch (error) {
        console.error('Failed to fetch grade configuration:', error);
        return null;
    }
}

export async function getAllGradeConfigs(): Promise<GradeConfiguration[]> {
    try {
        const schoolId = getSchoolId();
        const url = schoolId ? `${API_BASE_URL}/api/grade-configs?schoolId=${schoolId}` : `${API_BASE_URL}/api/grade-configs`;

        const response = await fetch(url, {
            headers: authHeaders()
        });
        if (!response.ok) return [];
        return await response.json();
    } catch (error) {
        console.error('Failed to fetch grade configurations:', error);
        return [];
    }
}

export async function createGradeConfig(data: Partial<GradeConfiguration>) {
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
        throw new Error(error.message || 'Failed to create grade configuration');
    }
    return res.json();
}

export async function updateGradeConfig(id: string, data: Partial<GradeConfiguration>) {
    const schoolId = getSchoolId();
    const url = schoolId ? `${API_BASE_URL}/api/grade-configs/${id}?schoolId=${schoolId}` : `${API_BASE_URL}/api/grade-configs/${id}`;

    const res = await fetch(url, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to update grade configuration');
    }
    return res.json();
}

export async function setActiveConfig(id: string) {
    const schoolId = getSchoolId();
    const url = schoolId ? `${API_BASE_URL}/api/grade-configs/${id}/activate?schoolId=${schoolId}` : `${API_BASE_URL}/api/grade-configs/${id}/activate`;

    const res = await fetch(url, {
        method: 'POST',
        headers: authHeaders(),
    });
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to activate configuration');
    }
    return res.json();
}

export function calculateFinalScore(
    qa1: number,
    qa2: number,
    endOfTerm: number,
    config: GradeConfiguration
): number {
    switch (config.calculation_method) {
        case 'average_all':
            return (qa1 + qa2 + endOfTerm) / 3;

        case 'end_of_term_only':
            return endOfTerm;

        case 'weighted_average':
            return (qa1 * config.weight_qa1 + qa2 * config.weight_qa2 + endOfTerm * config.weight_end_of_term) / 100;

        default:
            return (qa1 + qa2 + endOfTerm) / 3;
    }
}

// Default configuration for initial setup
export const defaultConfig: GradeConfiguration = {
    id: 'default',
    school_id: 'school-1',
    configuration_name: 'Default Weighting (30-30-40)',
    calculation_method: 'weighted_average',
    weight_qa1: 30,
    weight_qa2: 30,
    weight_end_of_term: 40,
    pass_mark: 50,
    is_active: true,
    created_at: new Date().toISOString(),
};


// // services/gradeConfigService.ts
// const API_BASE_URL = 'http://localhost:3000';

// export interface GradeConfiguration {
//     id: string;
//     school_id: string;
//     configuration_name: string;
//     calculation_method: 'average_all' | 'end_of_term_only' | 'weighted_average';
//     weight_qa1: number;
//     weight_qa2: number;
//     weight_end_of_term: number;
//     pass_mark: number;
//     is_active: boolean;
//     created_at: string;
// }

// export interface GradeScale {
//     grade: string;
//     min_score: number;
//     max_score: number;
//     description: string;
// }

// export async function getActiveGradeConfig(): Promise<GradeConfiguration | null> {
//     try {
//         const response = await fetch(`${API_BASE_URL}/api/grade-configs/active`);
//         if (!response.ok) return null;
//         return await response.json();
//     } catch (error) {
//         console.error('Failed to fetch grade configuration:', error);
//         return null;
//     }
// }

// export async function getAllGradeConfigs(): Promise<GradeConfiguration[]> {
//     try {
//         const response = await fetch(`${API_BASE_URL}/api/grade-configs`);
//         if (!response.ok) return [];
//         return await response.json();
//     } catch (error) {
//         console.error('Failed to fetch grade configurations:', error);
//         return [];
//     }
// }

// export async function createGradeConfig(data: Partial<GradeConfiguration>) {
//     const res = await fetch(`${API_BASE_URL}/api/grade-configs`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(data),
//     });
//     if (!res.ok) {
//         const error = await res.json();
//         throw new Error(error.message || 'Failed to create grade configuration');
//     }
//     return res.json();
// }

// export async function updateGradeConfig(id: string, data: Partial<GradeConfiguration>) {
//     const res = await fetch(`${API_BASE_URL}/api/grade-configs/${id}`, {
//         method: 'PATCH',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(data),
//     });
//     if (!res.ok) {
//         const error = await res.json();
//         throw new Error(error.message || 'Failed to update grade configuration');
//     }
//     return res.json();
// }

// export async function setActiveConfig(id: string) {
//     const res = await fetch(`${API_BASE_URL}/api/grade-configs/${id}/activate`, {
//         method: 'POST',
//     });
//     if (!res.ok) {
//         const error = await res.json();
//         throw new Error(error.message || 'Failed to activate configuration');
//     }
//     return res.json();
// }

// export function calculateFinalScore(
//     qa1: number,
//     qa2: number,
//     endOfTerm: number,
//     config: GradeConfiguration
// ): number {
//     switch (config.calculation_method) {
//         case 'average_all':
//             return (qa1 + qa2 + endOfTerm) / 3;

//         case 'end_of_term_only':
//             return endOfTerm;

//         case 'weighted_average':
//             return (qa1 * config.weight_qa1 + qa2 * config.weight_qa2 + endOfTerm * config.weight_end_of_term) / 100;

//         default:
//             return (qa1 + qa2 + endOfTerm) / 3;
//     }
// }



// // Default configuration for initial setup
// export const defaultConfig: GradeConfiguration = {
//     id: 'default',
//     school_id: 'school-1',
//     configuration_name: 'Default Weighting (30-30-40)',
//     calculation_method: 'weighted_average',
//     weight_qa1: 30,
//     weight_qa2: 30,
//     weight_end_of_term: 40,
//     pass_mark: 50,
//     is_active: true,
//     created_at: new Date().toISOString(),
// };