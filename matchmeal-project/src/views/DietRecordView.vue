<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useDietStore } from '@/stores/dietStore';
import { createDiet, getDietDetail, updateDiet, deleteDiet, type DietDetailItem } from '@/services/dietService';
import { createFood, type CreateFoodPayload } from '@/services/foodService';
import { storeToRefs } from 'pinia';

const route = useRoute();
const router = useRouter();
const dietStore = useDietStore();
const { currentDiet } = storeToRefs(dietStore);

const isEditMode = computed(() => !!route.params.id);
const isLoading = ref(false);

const showAlert = (message: string) => {
  alert(message)
}

// 초기 데이터 로드 (수정 모드일 경우)
const initData = async () => {
    if (isEditMode.value) {
        // 이미 스토어에 데이터가 있다면 (FoodDB에서 돌아온 경우), 덮어쓰지 않음
        // 단, 새로 진입했을 때만 로드해야 함.
        if (currentDiet.value.dietId !== Number(route.params.id)) {
             try {
                isLoading.value = true;
                const data = await getDietDetail(Number(route.params.id));
                // response.data 가 실제 데이터라고 가정 (DietDetailView와 동일)
                const detail = data.data || data; 

                // API 응답을 Store 형식으로 변환
                currentDiet.value = {
                    dietId: detail.dietId,
                    eatDate: detail.eatDate,
                    eatTime: detail.eatTime.substring(0, 5), // HH:mm:ss -> HH:mm
                    mealType: detail.mealType,
                    memo: detail.memo,
                    foods: detail.details.map((d: DietDetailItem) => ({
                        foodId: d.foodId ?? undefined,
                        foodName: d.foodName,
                        quantity: d.quantity,
                        unit: d.unit,
                        calories: d.calories,
                        carbohydrate: d.carbohydrate,
                        protein: d.protein,
                        fat: d.fat
                    }))
                };
             } catch (e) {
                 console.error(e);
                 alert('식단 정보를 불러오지 못했습니다.');
                 router.back();
             } finally {
                 isLoading.value = false;
             }
        }
    } else {
        // 생성 모드: MainView에서 들어올 때 resetCurrentDiet를 호출했으므로 여기선 패스.
        // 하지만 새로고침 등으로 들어왔을 때 초기화가 안되어 있을 수 있으니 체크
        if (!currentDiet.value.eatDate) {
            dietStore.resetCurrentDiet();
        }
    }
};

onMounted(() => {
    initData();
});

const goBack = () => {
    router.back();
};

const goFoodSearch = () => {
    router.push('/food-db?mode=select');
};

const removeFood = (index: number) => {
    dietStore.removeFoodFromDiet(index);
};

const saveDiet = async () => {
    if (currentDiet.value.foods.length === 0 && !currentDiet.value.memo) {
        window.alert('음식을 추가하거나 메모를 입력해주세요.');
        return;
    }

    // 백엔드 LocalTime 형식(HH:mm:ss)에 맞추기 위해 초 단위 추가
    const payload = {
        ...currentDiet.value,
        eatTime: currentDiet.value.eatTime.length === 5 ? `${currentDiet.value.eatTime}:00` : currentDiet.value.eatTime
    };

    try {
        if (isEditMode.value && currentDiet.value.dietId) {
            await updateDiet(currentDiet.value.dietId, payload);
            window.alert('수정되었습니다.');
        } else {
            await createDiet(payload);
            window.alert('저장되었습니다.');
        }
        // 저장 후 리스트로 이동 -> 상세 기능이 생겼지만, 저장은 보통 리스트로 가거나 상세로 감.
        // 여기선 리스트로 이동하도록 유지.
        router.replace('/diet'); 
    } catch (e) {
        console.error(e);
        window.alert('저장에 실패했습니다.');
    }
};

const deleteResult = async () => {
    if (!confirm('정말로 삭제하시겠습니까?')) return;
    
    if (currentDiet.value.dietId) {
        try {
            await deleteDiet(currentDiet.value.dietId);
            window.alert('삭제되었습니다.');
            router.replace('/diet');
        } catch (e) {
            console.error(e);
            window.alert('삭제에 실패했습니다.');
        }
    }
};

// 총 칼로리 계산
const totalCalories = computed(() => {
    return currentDiet.value.foods.reduce((acc: number, cur: any) => acc + cur.calories, 0);
});

const updateQuantity = (index: number, newQty: number) => {
    const food = currentDiet.value.foods[index];
    if (!food || newQty <= 0) return;
    
    const ratio = newQty / food.quantity;
    food.quantity = newQty;
    food.calories *= ratio;
    food.carbohydrate *= ratio;
    food.protein *= ratio;
    food.fat *= ratio;
};

// --- 직접 입력 모달 관련 ---
const showManualInput = ref(false);
const manualFood = ref({
    foodName: '',
    calories: undefined as number | undefined,
    carbohydrate: undefined as number | undefined,
    protein: undefined as number | undefined,
    fat: undefined as number | undefined,
    quantity: 1, // 기본 1인분 or 1개
    unit: '인분',
    saveToDictionary: false
});

const openManualInput = () => {
    manualFood.value = {
        foodName: '',
        calories: undefined,
        carbohydrate: undefined,
        protein: undefined,
        fat: undefined,
        quantity: 1,
        unit: '인분',
        saveToDictionary: false
    };
    showManualInput.value = true;
};

const closeManualInput = () => {
    showManualInput.value = false;
};

const addManualFood = async () => {
    if (!manualFood.value.foodName) {
        alert('음식 이름을 입력해주세요.');
        return;
    }
    
    const calories = manualFood.value.calories || 0;
    const carbs = manualFood.value.carbohydrate || 0;
    const protein = manualFood.value.protein || 0;
    const fat = manualFood.value.fat || 0;
    
    let foodId: number | undefined = undefined;

    // 음식 사전에 저장하기 체크 시
    if (manualFood.value.saveToDictionary) {
        try {
            const payload: CreateFoodPayload = {
                foodName: manualFood.value.foodName,
                category: '기타', // 직접 입력은 기타로 분류
                servingSize: manualFood.value.quantity,
                unit: manualFood.value.unit,
                calories: calories,
                carbohydrate: carbs,
                protein: protein,
                fat: fat
            };
            foodId = await createFood(payload);
        } catch (e) {
            console.error('음식 사전 저장 실패:', e);
            if (!confirm('음식 사전에 저장하지 못했습니다. 식단에는 추가하시겠습니까?')) {
                return;
            }
        }
    }

    dietStore.addFoodToDiet({
        foodId: foodId,
        foodName: manualFood.value.foodName,
        quantity: manualFood.value.quantity,
        unit: manualFood.value.unit,
        calories: calories,
        carbohydrate: carbs,
        protein: protein,
        fat: fat
    });

    closeManualInput();
};
</script>

<template>
<div class="bg-gray-200 min-h-screen flex items-center justify-center font-sans text-gray-800">
    <div class="relative w-[375px] h-[812px] bg-white shadow-2xl rounded-[35px] overflow-hidden border-[8px] border-gray-800 flex flex-col">
        
        <!-- Header -->
        <header class="h-14 border-b flex items-center justify-between px-4 bg-white z-20 shrink-0">
            <button @click="goBack" class="text-2xl w-8">←</button>
            <h1 class="font-bold text-lg truncate">{{ isEditMode ? '식단 수정' : '식단 기록' }}</h1>
            <div class="w-8"></div> 
        </header>

        <!-- Main Content -->
        <main class="flex-1 overflow-y-auto bg-white pb-20 p-6 space-y-6">
            
            <div v-if="isLoading" class="text-center py-10">Loading...</div>
            <template v-else>
                <!-- Image Upload / Analysis Placeholder -->
                <div class="flex justify-center">
                    <div class="w-full h-40 bg-gray-100 rounded-2xl flex flex-col items-center justify-center border-2 border-dashed border-gray-300 text-gray-400 gap-2 relative overflow-hidden cursor-pointer hover:border-blue-400 transition"
                         @click="showAlert('AI 사진 분석 기능은 준비중입니다.')">
                        <span class="text-3xl">📷</span>
                        <span class="text-xs">사진을 등록하면 AI가 분석해요</span>
                    </div>
                </div>

                <!-- Date & Time & MealType -->
                <div class="flex gap-3">
                    <div class="flex-1">
                        <label class="text-xs font-bold text-gray-500 mb-1 block">날짜</label>
                        <input type="date" v-model="currentDiet.eatDate" class="input-field text-sm">
                    </div>
                    <div class="flex-1">
                        <label class="text-xs font-bold text-gray-500 mb-1 block">시간</label>
                         <input type="time" v-model="currentDiet.eatTime" class="input-field text-sm">
                    </div>
                </div>
                
                 <div>
                    <label class="text-xs font-bold text-gray-500 mb-1 block">식사 구분</label>
                    <select v-model="currentDiet.mealType" class="input-field text-sm bg-white">
                        <option value="BREAKFAST">아침</option>
                        <option value="LUNCH">점심</option>
                        <option value="DINNER">저녁</option>
                        <option value="SNACK">간식</option>
                    </select>
                </div>

                <!-- Food List -->
                <div>
                    <div class="flex justify-between items-center mb-2">
                        <label class="text-xs font-bold text-gray-500 block">메뉴 목록</label>
                        <button @click="goFoodSearch" class="text-xs text-blue-600 font-bold px-2 py-1 hover:bg-blue-50 rounded">
                            + 메뉴 검색
                        </button>
                        <button @click="openManualInput" class="text-xs text-gray-500 font-bold px-2 py-1 hover:bg-gray-100 rounded border border-gray-200 ml-2">
                            ✏️ 직접 입력
                        </button>
                    </div>
                    
                    <div class="space-y-3">
                        <div v-for="(food, index) in currentDiet.foods" :key="index" class="p-3 border rounded-xl bg-gray-50 mb-3 animate-fade-in-up relative">
                            <!-- Line 1: Name and Delete -->
                            <div class="flex justify-between items-start mb-2">
                                <div class="flex-1 mr-2">
                                    <input type="text" v-model="food.foodName" class="input-field h-10 bg-white" placeholder="음식명">
                                </div>
                                <button @click="removeFood(index)" class="text-gray-400 hover:text-red-500 p-1">
                                    ×
                                </button>
                            </div>

                            <!-- Line 2: Quantity and Calories -->
                            <div class="flex items-center gap-3" v-if="food">
                                <div class="flex-[2] relative">
                                    <input 
                                        type="number" 
                                        v-model.number="food.quantity" 
                                        @change="updateQuantity(index, food.quantity)"
                                        class="input-field h-10 pr-8 text-right bg-white"
                                    >
                                    <span class="absolute right-3 top-2.5 text-xs text-gray-500">{{ food.unit }}</span>
                                </div>
                                <div class="flex-1 text-right flex flex-col justify-center">
                                     <span class="text-sm font-bold text-gray-800">{{ Math.round(food.calories || 0) }} kcal</span>
                                     <div class="text-[10px] text-gray-400">
                                        탄{{ Math.round(food.carbohydrate || 0) }}/단{{ Math.round(food.protein || 0) }}/지{{ Math.round(food.fat || 0) }}
                                     </div>
                                </div>
                            </div>
                        </div>
                        
                        <div v-if="currentDiet.foods.length === 0" class="text-center py-6 bg-gray-50 rounded-xl text-xs text-gray-400">
                            추가된 음식이 없습니다.
                        </div>
                    </div>
                </div>

                <!-- Memo -->
                 <div>
                    <label class="text-xs font-bold text-gray-500 mb-1 block">메모</label>
                    <textarea v-model="currentDiet.memo" class="input-field h-20 py-2" placeholder="오늘 식사는 어땠나요?"></textarea>
                </div>

                 <!-- Display Total -->
                 <div class="bg-blue-50 p-4 rounded-xl flex justify-between items-center">
                     <span class="text-sm font-bold text-blue-800">총 섭취 칼로리</span>
                     <span class="text-xl font-bold text-blue-600">{{ Math.round(totalCalories) }} kcal</span>
                 </div>
            </template>

        </main>
        
        <!-- Footer Actions -->
        <div class="p-4 border-t bg-white flex gap-3">
            <button 
                v-if="isEditMode" 
                @click="deleteResult"
                class="flex-1 h-12 border-2 border-red-100 text-red-500 font-bold rounded-xl hover:bg-red-50"
            >
                삭제
            </button>
            <button 
                @click="saveDiet" 
                class="flex-[2] h-12 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg"
            >
                저장하기
            </button>
        </div>

    </div>

    <!-- 직접 입력 모달 -->
    <div v-if="showManualInput" class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
        <div class="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-scale-up">
            <h3 class="font-bold text-lg mb-4">음식 직접 입력</h3>
            
            <div class="space-y-3">
                <div>
                    <label class="text-xs font-bold text-gray-500 mb-1 block">음식 이름 <span class="text-red-500">*</span></label>
                    <input type="text" v-model="manualFood.foodName" class="input-field h-10" placeholder="예: 엄마표 김치찌개">
                </div>

                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label class="text-xs font-bold text-gray-500 mb-1 block">섭취량</label>
                        <input type="number" v-model.number="manualFood.quantity" class="input-field h-10">
                    </div>
                    <div>
                        <label class="text-xs font-bold text-gray-500 mb-1 block">단위</label>
                        <input type="text" v-model="manualFood.unit" class="input-field h-10" placeholder="인분, g 등">
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-3">
                     <div>
                        <label class="text-xs font-bold text-gray-500 mb-1 block">칼로리 (kcal)</label>
                        <input type="number" v-model.number="manualFood.calories" class="input-field h-10">
                    </div>
                    <div>
                        <label class="text-xs font-bold text-gray-500 mb-1 block">탄수화물 (g)</label>
                        <input type="number" v-model.number="manualFood.carbohydrate" class="input-field h-10">
                    </div>
                    <div>
                        <label class="text-xs font-bold text-gray-500 mb-1 block">단백질 (g)</label>
                        <input type="number" v-model.number="manualFood.protein" class="input-field h-10">
                    </div>
                    <div>
                        <label class="text-xs font-bold text-gray-500 mb-1 block">지방 (g)</label>
                        <input type="number" v-model.number="manualFood.fat" class="input-field h-10">
                    </div>
                </div>

                <div class="flex items-center gap-2 pt-2 cursor-pointer" @click="manualFood.saveToDictionary = !manualFood.saveToDictionary">
                    <div class="w-5 h-5 border-2 rounded flex items-center justify-center transition"
                         :class="manualFood.saveToDictionary ? 'bg-blue-600 border-blue-600' : 'border-gray-300'">
                        <span v-if="manualFood.saveToDictionary" class="text-white text-xs">✔</span>
                    </div>
                    <span class="text-sm font-bold text-gray-700">음식 사전에 저장하기</span>
                </div>
                <p class="text-xs text-gray-400 pl-7">체크 시 다른 사람들도 이 음식을 검색할 수 있어요.</p>
            </div>

            <div class="flex gap-3 mt-6">
                <button @click="closeManualInput" class="flex-1 h-11 border border-gray-300 rounded-xl font-bold text-gray-600 hover:bg-gray-50">취소</button>
                <button @click="addManualFood" class="flex-1 h-11 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700">추가하기</button>
            </div>
        </div>
    </div>
</div>
</template>

<style scoped>
.input-field {
    @apply w-full h-12 border border-gray-300 rounded-lg px-4 bg-gray-50 focus:outline-none focus:border-blue-500 transition;
}
.animate-fade-in-up {
    animation: fadeInUp 0.3s ease-out;
}
@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
@keyframes scaleUp {
    from {
        opacity: 0;
        transform: scale(0.9);
    }
    to {
        opacity: 1;
        transform: scale(1);
    }
}
.animate-scale-up {
    animation: scaleUp 0.2s ease-out;
}
.animate-fade-in {
    animation: fadein 0.2s ease-out;
}
@keyframes fadein { from { opacity: 0; } to { opacity: 1; } }
</style>
