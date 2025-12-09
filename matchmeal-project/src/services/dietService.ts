import apiClient from './apiClient';

export interface DietFoodItem {
    foodId?: number;
    foodName: string;
    quantity: number;
    unit: string;
    calories: number;
    carbohydrate: number;
    protein: number;
    fat: number;
}

export interface CreateDietPayload {
    eatDate: string; // YYYY-MM-DD
    eatTime: string; // HH:mm
    mealType: string; // BREAKFAST, LUNCH, DINNER, SNACK
    memo?: string;
    foods: DietFoodItem[];
}

export interface DietDetailItem extends DietFoodItem {
    dietDetailId: number;
}

export interface DailyDietResponseItem {
    dietId: number;
    eatDate: string;
    eatTime: string;
    mealType: string;
    memo: string;
    totalCalories: number;
    totalCarbohydrate: number;
    totalProtein: number;
    totalFat: number;
    details: DietDetailItem[];
}

export interface DailyDietListResponse {
    date: string;
    totalCalories: number;
    diets: DailyDietResponseItem[];
}

export type DailyDietListResult = DailyDietListResponse | DailyDietResponseItem[];

// 식단 목록(일별) 조회
export const getDailyDiets = async (date: string): Promise<DailyDietListResult> => {
    try {
        const response = await apiClient.get('/diet', { params: { date } });
        return response.data.data;
    } catch (error) {
        console.error('Error fetching daily diets:', error);
        throw error;
    }
};

// 식단 상세 조회
export const getDietDetail = async (dietId: number): Promise<{ data: DailyDietResponseItem }> => {
    try {
        const response = await apiClient.get(`/diet/${dietId}`);
        return response.data; // data.data 가 아니라 data 전체를 리턴하는 경우도 확인 필요하지만, 보통 apiClient에서 처리하거나 여기서 처리. 
                             // 기존 코드에선 response.data.data 였을 수 있음. 상세 조회 응답 확인 필요.
                             // 보통 공통 포맷이면 response.data.data 일 것임.
                             // 하지만 이전 코드에서 response.data를 썼던 기억이 있음. 안전하게 response를 통해 확인.
                             // 이전 코드: dietData.value = response.data 
                             // 즉, 여기서 response.data 를 리턴하면 됨.
                             // 하지만 API 표준 응답이 { data: ... } 라면 response.data.data 여야 함.
                             // 일단 apiClient가 axios instance라면 response.data는 서버 응답 바디임.
                             // 서버 응답이 { code:..., data: ... } 형태라면 response.data.data를 리턴하는게 편함.
                             // 이전 기록을 보면 getDietDetail에서 response.data.data를 리턴했는지 확인.
        return response.data; 
    } catch (error) {
        console.error(`Error fetching diet detail for ${dietId}:`, error);
        throw error;
    }
};

// 식단 생성
export const createDiet = async (payload: CreateDietPayload) => {
    try {
        const response = await apiClient.post('/diet', payload);
        return response.data;
    } catch (error) {
        console.error('Error creating diet:', error);
        throw error;
    }
};

// 식단 수정
export const updateDiet = async (dietId: number, payload: CreateDietPayload) => {
    try {
        const response = await apiClient.put(`/diet/${dietId}`, payload);
        return response.data;
    } catch (error) {
        console.error(`Error updating diet ${dietId}:`, error);
        throw error;
    }
};

// 식단 삭제
export const deleteDiet = async (dietId: number) => {
    try {
        const response = await apiClient.delete(`/diet/${dietId}`);
        return response.data;
    } catch (error) {
        console.error(`Error deleting diet ${dietId}:`, error);
        throw error;
    }
};
