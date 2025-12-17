import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  getMyChallenges,
  searchChallenges,
  joinChallenge as apiJoin,
  joinByCode as apiJoinByCode,
  createChallenge as apiCreate,
  type ChallengeResponse,
  type SearchCondition,
  type ChallengeCreateRequest,
} from '@/services/challengeService'

export const useChallengeStore = defineStore('challenge', () => {
  const myChallenges = ref<ChallengeResponse[]>([])
  const publicChallenges = ref<ChallengeResponse[]>([])
  const isLoading = ref(false)

  // 내 챌린지 불러오기
  const fetchMyChallenges = async () => {
    try {
      myChallenges.value = await getMyChallenges()
    } catch (error) {
      console.error('내 챌린지 조회 실패', error)
    }
  }

  // 공개 챌린지 검색
  const fetchPublicChallenges = async (condition: SearchCondition = {}) => {
    isLoading.value = true
    try {
      publicChallenges.value = await searchChallenges(condition)
    } catch (error) {
      console.error('챌린지 검색 실패', error)
    } finally {
      isLoading.value = false
    }
  }

  // 챌린지 생성 [신규 추가]
  const createChallenge = async (payload: ChallengeCreateRequest) => {
    try {
      await apiCreate(payload)
      // 생성 성공 시 내 챌린지 목록 갱신
      await fetchMyChallenges()
      // 만약 공개 챌린지라면 공개 목록도 갱신 (선택사항)
      if (payload.isPublic) {
        await fetchPublicChallenges()
      }
    } catch (error) {
      console.error('챌린지 생성 실패', error)
      throw error // 컴포넌트에서 에러 처리를 위해 throw
    }
  }

  // 챌린지 참여
  const joinChallenge = async (id: number) => {
    await apiJoin(id)
    await fetchMyChallenges() // 참여 후 내 목록 갱신
    // 공개 목록에서도 상태 갱신 (선택적)
    const target = publicChallenges.value.find((c) => c.challengeId === id)
    if (target) target.isJoined = true
  }

  // 코드로 참여
  const joinPrivateChallenge = async (code: string) => {
    await apiJoinByCode(code)
    await fetchMyChallenges()
  }

  return {
    myChallenges,
    publicChallenges,
    isLoading,
    fetchMyChallenges,
    fetchPublicChallenges,
    joinChallenge,
    joinPrivateChallenge,
    createChallenge,
  }
})
