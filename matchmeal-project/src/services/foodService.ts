import apiClient from './apiClient';

// 음식 목록 조회(GET /foods)를 위한 파라미터 인터페이스
export interface GetFoodsParams {
    keyword?: string;
    category?: string;
    userOnly?: boolean;
    page?: number;
    size?: number;
}

// 음식 목록의 개별 아이템 DTO
export interface FoodListItem {
    foodId: number;
    foodName: string;
    category: string;
    servingSize: number;
    unit: string;
    calories: number;
}

// 페이징 정보 인터페이스 (새로운 API 응답 구조)
export interface PageInfo {
    pageNo: number; // 1부터 시작
    size: number;
    numberOfElements: number;
    totalCount: number;
    totalPage: number;
    hasNext: boolean;
}

// 음식 목록 API 응답 전체 구조
export interface FoodListResponse {
    content: FoodListItem[];
    pageInfo: PageInfo;
}

// 음식 등록(POST /foods)을 위한 요청 Body 인터페이스
export interface CreateFoodPayload {
  foodName: string;
  category?: string;
  servingSize?: number;
  unit?: string;
  calories?: number;
  carbohydrate?: number;
  protein?: number;
  fat?: number;
}

/**
 * 음식 목록을 조회합니다 (검색 및 페이징)
 * @param params 검색 및 페이징 조건
 * @returns 페이징 처리된 음식 목록
 */
export const getFoods = async (params: GetFoodsParams): Promise<FoodListResponse> => {
    try {
        const response = await apiClient.get('/foods', { params });
        // API 응답 구조에 맞게 `response.data.data`를 반환
        return response.data.data;
    } catch (error) {
        console.error('Error fetching foods:', error);
        throw error;
    }
};

// ... (기존 createFood 함수)

/**
 * 새로운 음식을 등록합니다.
 * @param payload 등록할 음식 데이터
 * @returns 생성된 음식의 ID
 */
export const createFood = async (payload: CreateFoodPayload): Promise<number> => {
    try {
        const response = await apiClient.post('/foods', payload);
        return response.data.data;
    } catch (error) {
        console.error('Error creating food:', error);
        throw error;
    }
};

// 음식 상세 정보 DTO
export interface FoodDetail {
  foodId: number;
  foodCode?: string;
  foodName: string;
  category: string;
  servingSize: number;
  unit: string;
  calories: number;
  carbohydrate: number;
  protein: number;
  fat: number;
  userId: number | null;
  isMine: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * 특정 음식의 상세 정보를 조회합니다.
 * @param foodId 조회할 음식의 ID
 * @returns 음식 상세 정보
 */
export const getFoodDetail = async (foodId: number): Promise<FoodDetail> => {
    try {
        const response = await apiClient.get(`/foods/${foodId}`);
        return response.data.data;
    } catch (error) {
        console.error(`Error fetching food detail for id ${foodId}:`, error);
        throw error;
    }
};

// ... (수정, 삭제 함수들이 여기에 추가될 수 있습니다.)

// 음식 수정(PATCH /foods/{foodId})을 위한 요청 Body 인터페이스
export type UpdateFoodPayload = Partial<CreateFoodPayload>;

/**
 * 특정 음식 정보를 수정합니다. (부분 업데이트)
 * @param foodId 수정할 음식의 ID
 * @param payload 수정할 데이터
 * @returns 수정된 음식의 ID
 */
export const updateFood = async (foodId: number, payload: UpdateFoodPayload): Promise<number> => {
    try {
        const response = await apiClient.patch(`/foods/${foodId}`, payload);
        return response.data.data;
    } catch (error) {
        console.error(`Error updating food for id ${foodId}:`, error);
        throw error;
    }
};

/**
 * 특정 음식을 삭제합니다.
 * @param foodId 삭제할 음식의 ID
 */
export const deleteFood = async (foodId: number): Promise<void> => {
    try {
        await apiClient.delete(`/foods/${foodId}`);
    } catch (error) {
        console.error(`Error deleting food for id ${foodId}:`, error);
        throw error;
    }
};
