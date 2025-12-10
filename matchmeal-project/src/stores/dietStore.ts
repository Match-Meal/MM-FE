import { defineStore } from 'pinia';
import { ref } from 'vue';
import dayjs from 'dayjs';

export interface DietFoodItem {
    foodId?: number;
    foodName: string;
    quantity: number;
    unit: string;
    calories: number;
    carbohydrate: number;
    protein: number;
    fat: number;
    saveToMyFoods?: boolean; // UI에서 "내 음식에 추가" 체크박스용 (API엔 안보낼 수도 있음)
}

export interface CurrentDietState {
    dietId?: number;
    eatDate: string;
    eatTime: string;
    mealType: string;
    memo: string;
    foods: DietFoodItem[];
    imageFile?: File | null;
    previewImageUrl?: string;
}

export const useDietStore = defineStore('diet', () => {
    // 선택된 날짜 (메인 화면)
    const selectedDate = ref(dayjs().format('YYYY-MM-DD'));

    // 현재 작성/수정 중인 식단 데이터
    const currentDiet = ref<CurrentDietState>({
        eatDate: dayjs().format('YYYY-MM-DD'),
        eatTime: dayjs().format('HH:mm'),
        mealType: 'LUNCH',
        memo: '',
        foods: [],
        imageFile: null,
        previewImageUrl: ''
    });

    const setDate = (date: string) => {
        selectedDate.value = date;
    };

    const resetCurrentDiet = () => {
        currentDiet.value = {
            eatDate: selectedDate.value, // 선택된 날짜로 초기화
            eatTime: dayjs().format('HH:mm'),
            mealType: 'LUNCH',
            memo: '',
            foods: [],
            imageFile: null,
            previewImageUrl: ''
        };
    };

    const addFoodToDiet = (food: DietFoodItem) => {
        currentDiet.value.foods.push(food);
    };

    const removeFoodFromDiet = (index: number) => {
        currentDiet.value.foods.splice(index, 1);
    };

    return {
        selectedDate,
        currentDiet,
        setDate,
        resetCurrentDiet,
        addFoodToDiet,
        removeFoodFromDiet
    };
});
