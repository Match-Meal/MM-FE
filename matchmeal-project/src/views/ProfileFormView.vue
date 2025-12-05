<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import axios from 'axios'

const router = useRouter()
const authStore = useAuthStore()
const isLoading = ref(false)

const commonAllergies = ['달걀', '우유', '땅콩', '대두', '밀', '새우', '게', '복숭아', '토마토']
const commonDiseases = ['당뇨', '고혈압', '고지혈증', '위염', '다이어트', '근성장']

// 폼 데이터 초기값
const form = ref({
  userName: '',
  gender: 'M',
  birthDate: '',
  heightCm: '' as number | string, // 빈 값 처리를 위해 타입 유연하게
  weightKg: '' as number | string,
  statusMessage: '',
  allergies: [] as string[],
  diseases: [] as string[],
})

const customAllergy = ref('')

// [핵심 수정] 마운트 시 기존 유저 정보 불러와서 폼에 채워넣기
onMounted(async () => {
  // 1. 새로고침 등으로 스토어에 데이터가 없으면 API로 다시 가져옴
  if (!authStore.user && authStore.token) {
    await authStore.fetchUser()
  }

  // 2. 유저 데이터가 존재하면 폼에 매핑 (Pre-fill)
  if (authStore.user) {
    const u = authStore.user

    form.value.userName = u.userName || ''
    form.value.statusMessage = u.statusMessage || ''
    form.value.gender = u.gender || 'MALE'
    form.value.birthDate = u.birthDate || ''
    form.value.heightCm = u.heightCm || ''
    form.value.weightKg = u.weightKg || ''

    // 배열은 참조 복사가 아닌 값 복사를 위해 spread(...) 사용 권장
    form.value.allergies = [...(u.allergies || [])]
    form.value.diseases = [...(u.diseases || [])]
  }
})

const toggleItem = (list: string[], item: string) => {
  const index = list.indexOf(item)
  if (index === -1) list.push(item)
  else list.splice(index, 1)
}

const addCustomAllergy = () => {
  const val = customAllergy.value.trim()
  if (val && !form.value.allergies.includes(val)) {
    form.value.allergies.push(val)
    customAllergy.value = ''
  }
}

const goBack = () => {
  router.back()
}

const submitProfile = async () => {
  if (!form.value.userName) return alert('닉네임을 입력해주세요.')
  if (!form.value.birthDate) return alert('생년월일을 입력해주세요.')

  try {
    isLoading.value = true
    await axios.put('http://localhost:8080/user/profile', {
      ...form.value,
      heightCm: Number(form.value.heightCm),
      weightKg: Number(form.value.weightKg),
    })

    // 수정 후 최신 정보 다시 가져오기
    await authStore.fetchUser()

    alert('프로필이 저장되었습니다! 🎉')
    router.replace('/profile') // 수정 완료 후 마이페이지로 이동
  } catch (e) {
    console.error(e)
    alert('저장 중 오류가 발생했습니다.')
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="bg-gray-200 min-h-screen flex items-center justify-center font-sans text-gray-800">
    <div
      class="relative w-[375px] h-[812px] bg-white shadow-2xl rounded-[35px] overflow-hidden border-[8px] border-gray-800 flex flex-col"
    >
      <header
        class="h-14 border-b flex items-center justify-between px-4 bg-white z-20 sticky top-0"
      >
        <button @click="goBack" class="text-2xl w-8 text-gray-600 hover:text-gray-900 transition">
          ←
        </button>
        <h1 class="font-bold text-lg truncate text-gray-800">프로필 설정</h1>
        <div class="w-8"></div>
      </header>

      <main class="flex-1 overflow-y-auto p-6 pb-10 scrollbar-hide bg-white">
        <form @submit.prevent="submitProfile" class="space-y-8">
          <section>
            <h3 class="text-lg font-bold mb-4 flex items-center gap-2">
              <span class="w-1 h-5 bg-blue-600 rounded-full"></span>
              기본 정보
            </h3>

            <div class="space-y-4">
              <div>
                <label class="block text-xs font-bold text-gray-500 mb-1.5 ml-1">닉네임</label>
                <input
                  v-model="form.userName"
                  type="text"
                  class="input-field"
                  placeholder="사용하실 닉네임"
                  required
                />
              </div>

              <div>
                <label class="block text-xs font-bold text-gray-500 mb-1.5 ml-1"
                  >상태 메시지 (다짐)</label
                >
                <textarea
                  v-model="form.statusMessage"
                  rows="2"
                  class="w-full border border-gray-300 rounded-xl px-4 py-3 bg-gray-50 focus:outline-none focus:border-blue-500 focus:bg-white transition resize-none text-sm"
                  placeholder="예: 이번 달 3kg 감량 목표! 🔥"
                ></textarea>
              </div>

              <div>
                <label class="block text-xs font-bold text-gray-500 mb-1.5 ml-1">생년월일</label>
                <input type="date" v-model="form.birthDate" class="input-field" required />
              </div>

              <div>
                <label class="block text-xs font-bold text-gray-500 mb-1.5 ml-1">성별</label>
                <div class="flex gap-3">
                  <button
                    type="button"
                    class="flex-1 h-12 rounded-xl border-2 font-bold transition flex items-center justify-center gap-2"
                    :class="
                      form.gender === 'M'
                        ? 'bg-blue-50 border-blue-500 text-blue-600'
                        : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300'
                    "
                    @click="form.gender = 'M'"
                  >
                    <span class="text-lg">👨</span> 남성
                  </button>
                  <button
                    type="button"
                    class="flex-1 h-12 rounded-xl border-2 font-bold transition flex items-center justify-center gap-2"
                    :class="
                      form.gender === 'F'
                        ? 'bg-pink-50 border-pink-500 text-pink-600'
                        : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300'
                    "
                    @click="form.gender = 'F'"
                  >
                    <span class="text-lg">👩</span> 여성
                  </button>
                </div>
              </div>

              <div class="flex gap-3">
                <div class="flex-1">
                  <label class="block text-xs font-bold text-gray-500 mb-1.5 ml-1">키 (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    v-model="form.heightCm"
                    class="input-field text-center font-bold text-gray-800"
                    placeholder="175"
                  />
                </div>
                <div class="flex-1">
                  <label class="block text-xs font-bold text-gray-500 mb-1.5 ml-1">체중 (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    v-model="form.weightKg"
                    class="input-field text-center font-bold text-gray-800"
                    placeholder="70"
                  />
                </div>
              </div>
            </div>
          </section>

          <hr class="border-gray-100 my-2" />

          <section>
            <h3 class="text-lg font-bold mb-4 flex items-center gap-2">
              <span class="w-1 h-5 bg-green-500 rounded-full"></span>
              건강 정보
            </h3>

            <div class="mb-6">
              <label class="block text-xs font-bold text-gray-500 mb-2 ml-1"
                >건강 고민 / 질병</label
              >
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="item in commonDiseases"
                  :key="item"
                  type="button"
                  @click="toggleItem(form.diseases, item)"
                  class="px-4 py-2 rounded-full text-xs font-bold border transition shadow-sm hover:shadow-md"
                  :class="
                    form.diseases.includes(item)
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-500 border-gray-200 hover:border-blue-300'
                  "
                >
                  {{ item }}
                </button>
              </div>
            </div>

            <div>
              <label class="block text-xs font-bold text-gray-500 mb-2 ml-1"
                >알레르기 / 기피 음식</label
              >
              <div class="flex flex-wrap gap-2 mb-3">
                <button
                  v-for="item in commonAllergies"
                  :key="item"
                  type="button"
                  @click="toggleItem(form.allergies, item)"
                  class="px-4 py-2 rounded-full text-xs font-bold border transition shadow-sm hover:shadow-md"
                  :class="
                    form.allergies.includes(item)
                      ? 'bg-red-500 text-white border-red-500'
                      : 'bg-white text-gray-500 border-gray-200 hover:border-red-300'
                  "
                >
                  {{ item }}
                </button>
              </div>

              <div class="flex gap-2">
                <input
                  v-model="customAllergy"
                  @keyup.enter="addCustomAllergy"
                  placeholder="기타 알레르기 입력 (예: 오이)"
                  class="input-field h-10 text-sm"
                />
                <button
                  type="button"
                  @click="addCustomAllergy"
                  class="w-14 h-10 bg-gray-800 text-white rounded-lg text-sm font-bold shadow-md active:scale-95 transition"
                >
                  추가
                </button>
              </div>

              <div
                v-if="form.allergies.length > 0"
                class="mt-3 p-3 bg-gray-50 rounded-xl border border-gray-100 flex flex-wrap gap-2"
              >
                <span
                  v-for="tag in form.allergies"
                  :key="tag"
                  class="text-xs bg-white border border-gray-200 px-2 py-1.5 rounded-md text-red-500 font-bold shadow-sm flex items-center gap-1"
                >
                  🚫 {{ tag }}
                  <span
                    @click="toggleItem(form.allergies, tag)"
                    class="cursor-pointer hover:text-red-700 ml-1"
                    >×</span
                  >
                </span>
              </div>
            </div>
          </section>

          <div class="pt-4">
            <button
              type="submit"
              :disabled="isLoading"
              class="btn-primary w-full h-14 text-lg shadow-lg hover:shadow-xl transform transition hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ isLoading ? '저장 중...' : '완료' }}
            </button>
          </div>
        </form>
      </main>
    </div>
  </div>
</template>

<style scoped>
.input-field {
  @apply w-full h-12 border border-gray-300 rounded-xl px-4 bg-gray-50 focus:outline-none focus:border-blue-500 focus:bg-white transition;
}
.btn-primary {
  @apply bg-blue-600 text-white font-bold rounded-xl flex items-center justify-center transition;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
</style>
