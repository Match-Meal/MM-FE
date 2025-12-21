import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useAuthStore } from './auth'
import {
  getMyChallenges,
  searchChallenges,
  joinChallenge as apiJoin,
  joinByCode as apiJoinByCode,
  createChallenge as apiCreate,
  getChallengeDetail,
  updateChallenge as apiUpdate,
  inviteUser as apiInvite,
  getMyFollowings,
  getMyInvitations,
  type ChallengeResponse,
  type SearchCondition,
  type ChallengeCreateRequest,
  type FollowerResponse,
  type ChallengeInvitationResponse, // Added
} from '@/services/challengeService'

export const useChallengeStore = defineStore('challenge', () => {
  const myChallenges = ref<ChallengeResponse[]>([])
  const publicChallenges = ref<ChallengeResponse[]>([])
  const isLoading = ref(false)
  const currentChallenge = ref<ChallengeResponse | null>(null)
  const followings = ref<FollowerResponse[]>([])
  const myInvitations = ref<ChallengeInvitationResponse[]>([]) // Added

  const authStore = useAuthStore()

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
    if (target) {
      target.isJoined = true
      if (typeof target.currentHeadCount === 'number') {
        target.currentHeadCount += 1
      }
    }
  }

  // 코드로 참여
  const joinPrivateChallenge = async (code: string) => {
    await apiJoinByCode(code)
    await fetchMyChallenges()
  }

  // 상세 정보 불러오기
  const fetchChallengeDetail = async (id: number) => {
    isLoading.value = true
    try {
      currentChallenge.value = await getChallengeDetail(id)
    } catch (error) {
      console.error('상세 조회 실패', error)
    } finally {
      isLoading.value = false
    }
  }

  // 챌린지 수정
  const modifyChallenge = async (id: number, payload: ChallengeCreateRequest) => {
    await apiUpdate(id, payload)
    await fetchChallengeDetail(id) // 수정 후 상세 정보 갱신
  }

  // 친구 목록 불러오기
  const fetchFollowings = async () => {
    // 로그인 안 되어 있으면 호출 불가
    if (!authStore.user?.id) {
      console.warn('로그인 정보가 없어 팔로잉 목록을 불러올 수 없습니다.')
      return
    }

    try {
      // 내 ID를 인자로 전달
      followings.value = await getMyFollowings(authStore.user.id)
    } catch (error) {
      console.error('친구 목록 조회 실패', error)
    }
  }

  // 친구 초대
  const inviteFriend = async (challengeId: number, targetUserId: number) => {
    await apiInvite(challengeId, targetUserId)
  }

  // [Added] 초대 목록 불러오기
  const fetchMyInvitations = async () => {
    try {
      myInvitations.value = await getMyInvitations()
    } catch (error) {
      console.error('초대장 조회 실패', error)
    }
  }

  // [Added] 리턴에 포함
  return {
    myChallenges,
    publicChallenges,
    isLoading,
    currentChallenge,
    followings,
    myInvitations, // Added
    fetchChallengeDetail,
    modifyChallenge,
    fetchFollowings,
    inviteFriend,
    fetchMyInvitations, // Added
    fetchMyChallenges,
    fetchPublicChallenges,
    joinChallenge,
    joinPrivateChallenge,
    createChallenge,
  }
})
