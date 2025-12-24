<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useToastStore } from '@/stores/toast'
import {
  ArrowLeft,
  Camera,
  User,
  Ruler,
  Weight,
  AlertCircle,
  X,
  Plus,
  Loader2,
  Activity,
} from 'lucide-vue-next'
import axios from 'axios'

const router = useRouter()
const authStore = useAuthStore()
const toastStore = useToastStore()
const isLoading = ref(false)

const fileInput = ref<HTMLInputElement | null>(null)
const selectedFile = ref<File | null>(null)
const previewImage = ref('')

const commonAllergies = ['달걀', '우유', '땅콩', '대두', '밀', '새우', '게', '복숭아', '토마토']
const commonDiseases = ['당뇨', '고혈압', '고지혈증', '위염', '다이어트', '근성장']

// 폼 데이터 초기값
const form = ref({
  userName: '',
  gender: 'M',
  birthDate: '',
  heightCm: '' as number | string,
  weightKg: '' as number | string,
  statusMessage: '',
  allergies: [] as string[],
  diseases: [] as string[],
})

const customAllergy = ref('')
const customDisease = ref('') // [Added]

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

    // 프로필 이미지 설정
    if (u.profileImage) {
      previewImage.value = u.profileImage
    }
  }
})

// 이미지 선택창
const triggerFileUpload = () => {
  fileInput.value?.click()
}

// 파일 선택시 미리보기
const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    const file = target.files[0]
    selectedFile.value = file
    previewImage.value = URL.createObjectURL(file)
  }
}

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

const addCustomDisease = () => {
  const val = customDisease.value.trim()
  if (val && !form.value.diseases.includes(val)) {
    form.value.diseases.push(val)
    customDisease.value = ''
  }
}

const goBack = () => {
  router.back()
}

const submitProfile = async () => {
  if (!form.value.userName) return toastStore.show('닉네임을 입력해주세요.', 'warning')
  // if (!form.value.birthDate) return toastStore.show('생년월일을 입력해주세요.', 'warning')

  try {
    isLoading.value = true
    const profileDto = {
      ...form.value,
      heightCm: Number(form.value.heightCm),
      weightKg: Number(form.value.weightKg),
    }

    const formData = new FormData()

    // json 데이터
    const jsonBlob = new Blob([JSON.stringify(profileDto)], { type: 'application/json' })
    formData.append('data', jsonBlob)

    if (selectedFile.value) {
      formData.append('file', selectedFile.value)
    }

    await axios.put('http://localhost:8080/user/profile', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })

    // 수정 후 최신 정보 다시 가져오기
    await authStore.fetchUser()

    toastStore.show('프로필이 저장되었습니다.', 'success')
    router.replace('/profile') // 수정 완료 후 마이페이지로 이동
  } catch (e) {
    console.error(e)
    toastStore.show('저장 중 오류가 발생했습니다.', 'error')
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="flex-1 flex flex-col relative overflow-hidden bg-white">
      <header
        class="h-14 border-b border-slate-100 flex items-center justify-between px-4 bg-white z-20 sticky top-0"
      >
        <button
          @click="goBack"
          class="p-2 -ml-2 rounded-full hover:bg-slate-50 transition text-slate-600"
        >
          <ArrowLeft :size="24" />
        </button>
        <h1 class="font-bold text-lg truncate text-slate-800">프로필 설정</h1>
        <div class="w-8"></div>
      </header>

      <main class="flex-1 overflow-y-auto p-6 pb-10 scrollbar-hide bg-white">
        <form @submit.prevent="submitProfile" class="space-y-8">
          <div class="flex justify-center mb-6">
            <div class="w-28 h-28 relative">
              <div
                class="w-full h-full bg-slate-50 rounded-full flex items-center justify-center overflow-hidden border-4 border-white shadow-lg cursor-pointer group"
                @click="triggerFileUpload"
              >
                <!-- 이미지 미리보기 -->
                <img
                  v-if="previewImage"
                  :src="previewImage"
                  class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  alt="Profile Preview"
                />
                <User v-else :size="48" class="text-slate-300" />
              </div>

              <!-- 카메라 아이콘 -->
              <button
                type="button"
                @click="triggerFileUpload"
                class="absolute bottom-0 right-0 w-9 h-9 bg-slate-800 text-white rounded-full flex items-center justify-center shadow-md border-2 border-white hover:bg-black transition"
              >
                <Camera :size="16" />
              </button>

              <!-- 숨겨진 File Input -->
              <input
                type="file"
                ref="fileInput"
                class="hidden"
                accept="image/*"
                @change="handleFileChange"
              />
            </div>
          </div>

          <section>
            <h3 class="text-sm font-bold mb-4 flex items-center gap-2 text-slate-800">
              <div class="w-1 h-4 bg-primary-600 rounded-full"></div>
              기본 정보
            </h3>

            <div class="space-y-4">
              <div>
                <label class="block text-xs font-bold text-slate-500 mb-1.5 ml-1">닉네임</label>
                <input
                  v-model="form.userName"
                  type="text"
                  class="w-full h-12 border border-slate-200 rounded-xl px-4 bg-slate-50 focus:outline-none focus:border-primary-500 focus:bg-white transition placeholder-slate-400 text-slate-800 text-sm"
                  placeholder="사용하실 닉네임"
                  required
                />
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-500 mb-1.5 ml-1"
                  >상태 메시지 (다짐)</label
                >
                <textarea
                  v-model="form.statusMessage"
                  rows="2"
                  class="w-full border border-slate-200 rounded-xl px-4 py-3 bg-slate-50 focus:outline-none focus:border-primary-500 focus:bg-white transition resize-none text-sm placeholder-slate-400"
                  placeholder="예: 이번 달 3kg 감량 목표!"
                ></textarea>
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-500 mb-1.5 ml-1">생년월일</label>
                <input type="date" v-model="form.birthDate" class="w-full h-12 border border-slate-200 rounded-xl px-4 bg-slate-50 focus:outline-none focus:border-primary-500 focus:bg-white transition placeholder-slate-400 text-slate-800 text-sm" />
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-500 mb-1.5 ml-1">성별</label>
                <div class="flex gap-3">
                  <button
                    type="button"
                    class="flex-1 h-12 rounded-xl border border-slate-200 font-bold transition flex items-center justify-center gap-2 text-sm bg-slate-50 text-slate-400 hover:bg-slate-100"
                    :class="{
                      '!bg-blue-50 !border-blue-500 !text-blue-600 shadow-sm': form.gender === 'M',
                    }"
                    @click="form.gender = 'M'"
                  >
                    남성
                  </button>
                  <button
                    type="button"
                    class="flex-1 h-12 rounded-xl border border-slate-200 font-bold transition flex items-center justify-center gap-2 text-sm bg-slate-50 text-slate-400 hover:bg-slate-100"
                    :class="{
                      '!bg-rose-50 !border-rose-500 !text-rose-600 shadow-sm': form.gender === 'F',
                    }"
                    @click="form.gender = 'F'"
                  >
                    여성
                  </button>
                </div>
              </div>

              <div class="flex gap-3">
                <div class="flex-1">
                  <label class="block text-xs font-bold text-slate-500 mb-1.5 ml-1">키 (cm)</label>
                  <div class="relative">
                    <input
                      type="number"
                      step="0.1"
                      v-model="form.heightCm"
                      class="w-full h-12 border border-slate-200 rounded-xl px-4 bg-slate-50 focus:outline-none focus:border-primary-500 focus:bg-white transition placeholder-slate-400 text-slate-800 text-sm text-center font-bold text-slate-800"
                      placeholder="175"
                    />
                    <Ruler
                      :size="14"
                      class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                  </div>
                </div>
                <div class="flex-1">
                  <label class="block text-xs font-bold text-slate-500 mb-1.5 ml-1"
                    >체중 (kg)</label
                  >
                  <div class="relative">
                    <input
                      type="number"
                      step="0.1"
                      v-model="form.weightKg"
                      class="w-full h-12 border border-slate-200 rounded-xl px-4 bg-slate-50 focus:outline-none focus:border-primary-500 focus:bg-white transition placeholder-slate-400 text-slate-800 text-sm text-center font-bold text-slate-800"
                      placeholder="70"
                    />
                    <Weight
                      :size="14"
                      class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          <div class="h-px bg-slate-100 my-2"></div>

          <section>
            <h3 class="text-sm font-bold mb-4 flex items-center gap-2 text-slate-800">
              <div class="w-1 h-4 bg-emerald-500 rounded-full"></div>
              건강 정보
            </h3>

            <div class="mb-6">
              <label class="block text-xs font-bold text-slate-500 mb-2 ml-1"
                >건강 고민 / 질병</label
              >
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="item in commonDiseases"
                  :key="item"
                  type="button"
                  @click="toggleItem(form.diseases, item)"
                  class="px-4 py-2 rounded-xl text-xs font-bold border transition shadow-sm hover:shadow-md active:scale-95"
                  :class="
                    form.diseases.includes(item)
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white text-slate-500 border-slate-200 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700'
                  "
                >
                  {{ item }}
                </button>
              </div>

              <!-- [Added] Custom Disease Input -->
              <div class="flex gap-2 mb-3 mt-3">
                <input
                  v-model="customDisease"
                  @keyup.enter="addCustomDisease"
                  placeholder="직접 입력 (예: 허리디스크)"
                  class="w-full h-12 border border-slate-200 rounded-xl px-4 bg-slate-50 focus:outline-none focus:border-primary-500 focus:bg-white transition placeholder-slate-400 text-slate-800 text-sm h-11 text-sm"
                />
                <button
                  type="button"
                  @click="addCustomDisease"
                  class="w-14 h-11 bg-slate-800 text-white rounded-xl text-sm font-bold shadow-md hover:bg-slate-900 active:scale-95 transition flex items-center justify-center"
                >
                  <Plus :size="20" />
                </button>
              </div>

              <!-- [Added] Selected Disease Tags -->
              <div
                v-if="form.diseases.length > 0"
                class="p-3 bg-emerald-50 rounded-xl border border-emerald-100 flex flex-wrap gap-2"
              >
                <div
                  class="w-full text-[10px] text-emerald-600 font-bold mb-1 flex items-center gap-1"
                >
                  <Activity :size="12" /> 선택된 건강 정보
                </div>
                <span
                  v-for="tag in form.diseases"
                  :key="tag"
                  class="text-xs bg-white border border-emerald-200 px-2 py-1.5 rounded-lg text-emerald-600 font-bold shadow-sm flex items-center gap-1"
                >
                  {{ tag }}
                  <button
                    @click="toggleItem(form.diseases, tag)"
                    class="hover:bg-emerald-100 rounded-full p-0.5 transition"
                  >
                    <X :size="12" />
                  </button>
                </span>
              </div>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-500 mb-2 ml-1"
                >알레르기 / 기피 음식</label
              >
              <div class="flex flex-wrap gap-2 mb-3">
                <button
                  v-for="item in commonAllergies"
                  :key="item"
                  type="button"
                  @click="toggleItem(form.allergies, item)"
                  class="px-4 py-2 rounded-xl text-xs font-bold border transition shadow-sm hover:shadow-md active:scale-95"
                  :class="
                    form.allergies.includes(item)
                      ? 'bg-rose-500 text-white border-rose-500'
                      : 'bg-white text-slate-500 border-slate-200 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-700'
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
                  class="w-full h-12 border border-slate-200 rounded-xl px-4 bg-slate-50 focus:outline-none focus:border-primary-500 focus:bg-white transition placeholder-slate-400 text-slate-800 text-sm h-11 text-sm"
                />
                <button
                  type="button"
                  @click="addCustomAllergy"
                  class="w-14 h-11 bg-slate-800 text-white rounded-xl text-sm font-bold shadow-md hover:bg-slate-900 active:scale-95 transition flex items-center justify-center"
                >
                  <Plus :size="20" />
                </button>
              </div>

              <div
                v-if="form.allergies.length > 0"
                class="mt-3 p-3 bg-rose-50 rounded-xl border border-rose-100 flex flex-wrap gap-2"
              >
                <div
                  class="w-full text-[10px] text-rose-500 font-bold mb-1 flex items-center gap-1"
                >
                  <AlertCircle :size="12" /> 선택된 알레르기
                </div>
                <span
                  v-for="tag in form.allergies"
                  :key="tag"
                  class="text-xs bg-white border border-rose-200 px-2 py-1.5 rounded-lg text-rose-600 font-bold shadow-sm flex items-center gap-1"
                >
                  {{ tag }}
                  <button
                    @click="toggleItem(form.allergies, tag)"
                    class="hover:bg-rose-100 rounded-full p-0.5 transition"
                  >
                    <X :size="12" />
                  </button>
                </span>
              </div>
            </div>
          </section>

          <div class="pt-4">
            <button
              type="submit"
              :disabled="isLoading"
              class="w-full h-14 bg-primary-600 text-white font-bold rounded-2xl shadow-lg shadow-primary-200 hover:bg-primary-700 transition flex items-center justify-center gap-2 transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <Loader2 v-if="isLoading" class="animate-spin" :size="20" />
              {{ isLoading ? '저장 중...' : '완료' }}
            </button>
          </div>
        </form>
      </main>
  </div>
</template>

<style scoped>
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
</style>
