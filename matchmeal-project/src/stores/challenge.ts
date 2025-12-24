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
import { getDietListByPeriod } from '@/services/dietService' // [Added]

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

  // [Added] 특정 챌린지 진행률 로컬 재계산 logic (Backend Sync 이슈 대응)
  const updateChallengeProgress = async (challengeId: number) => {
    // 타겟 챌린지 찾기
    const target = myChallenges.value.find((c) => c.challengeId === challengeId)
    // 혹은 디테일 뷰라면 currentChallenge
    if (!target && currentChallenge.value?.challengeId !== challengeId) return

    const challengeRef = target || currentChallenge.value
    if (!challengeRef) return

    // 계산 로직 (ChallengeDetailView와 동일)
    try {
      const diets = await getDietListByPeriod(
        challengeRef.startDate,
        challengeRef.endDate,
        authStore.user?.id,
      )

      if (!diets) return

      // 일별 데이터 가공을 위한 맵 (영양소 누적, 기록 횟수, 특정 조건 충족 여부 등)
      const dailyMap: Record<
        string,
        { totalCalories: number; count: number; hasTimedMorning: boolean }
      > = {}

      diets.forEach((d) => {
        const date = d.eatDate
        if (!dailyMap[date]) {
          dailyMap[date] = { totalCalories: 0, count: 0, hasTimedMorning: false }
        }

        const stats = dailyMap[date]
        stats.totalCalories += d.totalCalories || 0
        stats.count += 1

        // TIME_RANGE 판정: 아침 식사 마감 시간 (targetValue)
        if (challengeRef.type === 'TIME_RANGE' && d.mealType === 'BREAKFAST' && d.eatTime) {
          const hour = parseInt((d.eatTime ?? '0:0').split(':')[0] ?? '0')
          // targetValue시 미만이면 인정 (예: 7시 목표 시 6시 59분까지)
          if (hour < (challengeRef.targetValue || 0)) {
            stats.hasTimedMorning = true
          }
        }
      })

      let successCount = 0
      const targetVal = challengeRef.targetValue || 0

      // 유형별 성공 일수 계산
      Object.values(dailyMap).forEach((stats) => {
        if (challengeRef.type === 'CALORIE_LIMIT') {
          if (stats.totalCalories <= targetVal) successCount++
        } else if (challengeRef.type === 'RECORD_FREQUENCY') {
          if (stats.count >= targetVal) successCount++
        } else if (challengeRef.type === 'TIME_RANGE') {
          if (stats.hasTimedMorning) successCount++
        }
      })

      // 상태 업데이트
      challengeRef.currentCount = successCount
      challengeRef.progressPercent = Math.min(
        100,
        Math.round((successCount / challengeRef.goalCount) * 100),
      )

      console.log(`[Store] Updated Challenge ${challengeId}:`, {
        dietsCount: diets.length,
        successCount,
        goalCount: challengeRef.goalCount,
        newPercent: challengeRef.progressPercent,
      })

      // 만약 currentChallenge도 같은 ID라면 동기화
      if (currentChallenge.value?.challengeId === challengeId && target) {
        currentChallenge.value.currentCount = challengeRef.currentCount
        currentChallenge.value.progressPercent = challengeRef.progressPercent
      }

      // [Added] participants 리스트 내의 내 정보도 업데이트 (상세 페이지 리스트 반영용)
      if (challengeRef.participants && authStore.user) {
        const myInfo = challengeRef.participants.find((p) => p.userId === authStore.user?.id)
        if (myInfo) {
          console.log('[Store] Updating my participant info:', myInfo.userName)
          myInfo.progressPercent = Math.min(
            100,
            Math.round((successCount / challengeRef.goalCount) * 100),
          )
        } else {
          console.warn(
            '[Store] My info not found in participants. My ID:',
            authStore.user?.id,
            'Participants:',
            challengeRef.participants,
          )
        }
      }
    } catch (e) {
      console.error(`Failed to recalc progress for challenge ${challengeId}`, e)
    }
  }

  // [Added] 내 모든 챌린지 진행률 업데이트
  const updateAllMyChallengesProgress = async () => {
    if (myChallenges.value.length === 0) return
    await Promise.all(myChallenges.value.map((c) => updateChallengeProgress(c.challengeId)))
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
    updateChallengeProgress, // Added
    updateAllMyChallengesProgress, // Added
  }
})
