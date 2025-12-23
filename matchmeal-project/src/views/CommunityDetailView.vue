<script setup lang="ts">
import { ref, onMounted, computed, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import {
  getPostDetail,
  deletePost,
  togglePostLike,
  createComment,
  deleteComment,
  toggleCommentLike,
  updateComment,
  type PostDetail,
  type Comment,
} from '@/services/communityService'
import dayjs from 'dayjs'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import UserInfoModal from '@/components/UserInfoModal.vue'
import { 
  ArrowLeft, 
  MoreVertical, 
  Heart, 
  User as UserIcon, 
  Send, 
  CornerDownRight, 
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Eye
} from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const toastStore = useToastStore()

const postId = Number(route.params.id)
const post = ref<PostDetail | null>(null)
const isLoading = ref(true)
const commentContent = ref('')
const replyTarget = ref<{ id: number; name: string } | null>(null)
const isMenuOpen = ref(false)

// Media Carousel
const mediaScrollRef = ref<HTMLElement | null>(null)
const currentMediaIndex = ref(0)

const hasMedia = computed(() => {
  return (
    (post.value?.images && post.value.images.length > 0) ||
    (post.value?.videos && post.value.videos.length > 0)
  )
})

const totalMediaCount = computed(() => {
  if (!post.value) return 0
  return (post.value.images?.length || 0) + (post.value.videos?.length || 0)
})

const handleScroll = () => {
  if (!mediaScrollRef.value) return
  const scrollLeft = mediaScrollRef.value.scrollLeft
  const width = mediaScrollRef.value.offsetWidth
  currentMediaIndex.value = Math.round(scrollLeft / width)
}

// Pause all videos when slide changes
watch(currentMediaIndex, () => {
  if (!mediaScrollRef.value) return
  const videos = mediaScrollRef.value.querySelectorAll('video')
  videos.forEach((video) => {
    video.pause()
  })
})

const scrollPrev = () => {
  if (!mediaScrollRef.value) return
  mediaScrollRef.value.scrollBy({ left: -mediaScrollRef.value.offsetWidth, behavior: 'smooth' })
}

const scrollNext = () => {
  if (!mediaScrollRef.value) return
  mediaScrollRef.value.scrollBy({ left: mediaScrollRef.value.offsetWidth, behavior: 'smooth' })
}

// Input ref for focus
const commentInputRef = ref<HTMLInputElement | null>(null)

const initData = async () => {
  try {
    isLoading.value = true
    post.value = await getPostDetail(postId)
  } catch (e) {
    console.error(e)
    toastStore.show('게시글을 불러오지 못했습니다.')
    router.back()
  } finally {
    isLoading.value = false
  }
}

const goBack = () => router.back()

const isOwner = computed(() => {
  return post.value?.user.userId === authStore.user?.id
})

// User Profile Modal Logic
type PostUser = PostDetail['user'] // Define PostUser type based on PostDetail's user
const selectedUser = ref<PostUser | null>(null)
const isUserInfoOpen = ref(false)

const openUserInfo = (user: PostUser | null) => {
  if (!user) return
  selectedUser.value = user
  isUserInfoOpen.value = true
}

const isDeleteModalOpen = ref(false)

// Post Actions
const handleDeletePost = async () => {
  isDeleteModalOpen.value = true
}

const confirmDelete = async () => {
  try {
    await deletePost(postId)
    toastStore.show('게시글이 삭제되었습니다.')
    router.replace('/community')
  } catch (e) {
    console.error(e)
    toastStore.show('삭제 실패했습니다.')
  }
}

const handleEditPost = () => {
  router.push(`/community/edit/${postId}`)
}

const handleLikePost = async () => {
  if (!post.value) return
  try {
    const isLiked = await togglePostLike(postId)
    post.value.isLiked = isLiked
    post.value.likeCount += isLiked ? 1 : -1
  } catch (e) {
    console.error(e)
  }
}

// Comment Actions
const handleSubmitComment = async () => {
  if (!commentContent.value.trim()) return
  if (!post.value) return

  try {
    // If replyTarget exists, it's a child comment
    const parentId = replyTarget.value ? replyTarget.value.id : undefined

    await createComment(postId, commentContent.value, parentId)

    commentContent.value = ''
    replyTarget.value = null // Reset reply target

    // Refresh data
    await initData()

  } catch (e) {
    console.error(e)
    toastStore.show('댓글 등록 실패')
  }
}

const handleDeleteComment = async (commentId: number) => {
  deletingCommentId.value = commentId
  isCommentDeleteModalOpen.value = true
}

const deletingCommentId = ref<number | null>(null)
const isCommentDeleteModalOpen = ref(false)

const confirmDeleteComment = async () => {
  if (!deletingCommentId.value) return
  try {
    await deleteComment(deletingCommentId.value)
    await initData()
    toastStore.show('댓글이 삭제되었습니다.')
  } catch (e) {
    console.error(e)
    toastStore.show('댓글 삭제 실패')
  } finally {
    isCommentDeleteModalOpen.value = false
    deletingCommentId.value = null
  }
}

const handleLikeComment = async (comment: Comment) => {
  try {
    const isLiked = await toggleCommentLike(comment.commentId)
    comment.isLiked = isLiked
    comment.likeCount += isLiked ? 1 : -1
  } catch (e) {
    console.error(e)
  }
}

// Comment Editing
const editingCommentId = ref<number | null>(null)
const editingContent = ref('')

const startEditComment = (comment: Comment) => {
  editingCommentId.value = comment.commentId
  editingContent.value = comment.content
}

const cancelEditComment = () => {
  editingCommentId.value = null
  editingContent.value = ''
}

const submitEditComment = async (commentId: number) => {
  if (!editingContent.value.trim()) {
    toastStore.show('내용을 입력해주세요.')
    return
  }
  try {
    await updateComment(commentId, editingContent.value)
    toastStore.show('댓글이 수정되었습니다.')
    cancelEditComment()
    await initData()
  } catch (e) {
    console.error(e)
    toastStore.show('댓글 수정 실패')
  }
}

const setReplyTarget = (commentId: number, userName: string) => {
  replyTarget.value = { id: commentId, name: userName }
  nextTick(() => {
    commentInputRef.value?.focus()
  })
}

const cancelReply = () => {
  replyTarget.value = null
}

const formatTime = (dateStr: string) => dayjs(dateStr).format('YYYY.MM.DD HH:mm')

onMounted(() => {
  initData()
})
</script>

<template>
  <div class="bg-gray-100 min-h-screen flex items-center justify-center font-sans text-slate-800">
    <div
      class="relative w-[375px] h-[812px] bg-white shadow-2xl rounded-[35px] overflow-hidden border-[8px] border-slate-850 flex flex-col"
    >
      <!-- Header -->
      <header class="h-14 border-b border-slate-100 flex items-center justify-between px-4 bg-white z-20 shrink-0">
        <button @click="goBack" class="p-2 -ml-2 rounded-full hover:bg-slate-50 transition text-slate-600">
          <ArrowLeft :size="24" />
        </button>
        <h1 class="font-bold text-lg truncate text-slate-800">게시글 상세</h1>
        <div class="w-8 flex justify-end relative">
          <!-- More Menu (Edit/Delete) -->
          <button v-if="isOwner" @click="isMenuOpen = !isMenuOpen" class="p-2 -mr-2 rounded-full hover:bg-slate-50 transition text-slate-600">
            <MoreVertical :size="20" />
          </button>
          <div
            v-if="isOwner && isMenuOpen"
            class="absolute top-10 right-0 bg-white border border-slate-100 shadow-lg rounded-xl w-24 z-10 overflow-hidden py-1"
          >
            <button
              @click="handleEditPost"
              class="w-full text-left text-xs px-4 py-2.5 hover:bg-slate-50 font-medium text-slate-700"
            >
              수정
            </button>
            <button
              @click="handleDeletePost"
              class="w-full text-left text-xs px-4 py-2.5 hover:bg-rose-50 text-rose-500 font-medium"
            >
              삭제
            </button>
          </div>
        </div>
      </header>

      <main v-if="isLoading" class="flex-1 flex items-center justify-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </main>

      <main v-else-if="post" class="flex-1 overflow-y-auto bg-white pb-20 no-scrollbar relative">
        <!-- Post Content -->
        <div class="p-5 border-b-8 border-slate-50">
          <!-- User Info -->
          <div class="flex items-center gap-3 mb-4">
            <div
              class="w-10 h-10 bg-slate-100 rounded-full overflow-hidden border border-slate-200 cursor-pointer hover:opacity-80 transition"
              @click="post.user?.userName ? openUserInfo(post.user) : null"
              :class="{ 'cursor-default hover:opacity-100': !post.user?.userName }"
            >
              <img
                v-if="post.user?.profileImage"
                :src="post.user.profileImage"
                class="w-full h-full object-cover"
              />
              <div v-else class="w-full h-full flex items-center justify-center text-slate-300">
                <UserIcon :size="20" />
              </div>
            </div>
            <div>
              <p
                class="text-sm font-bold cursor-pointer hover:text-primary-600 transition"
                :class="{
                  'text-slate-400 cursor-default hover:text-slate-400':
                    !post.user?.userName,
                }"
                @click="post.user?.userName ? openUserInfo(post.user) : null"
              >
                {{ post.user?.userName || '탈퇴한 사용자' }}
              </p>
              <p class="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                {{ formatTime(post.createdAt) }} • <Eye :size="10" /> {{ post.viewCount }}
              </p>
            </div>
          </div>

          <!-- Title & Body -->
          <h2 class="text-xl font-bold mb-3 text-slate-900 leading-tight">{{ post.title }}</h2>
          <p class="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap mb-6">
            {{ post.content }}
          </p>

          <!-- Media Carousel -->
          <div v-if="hasMedia" class="relative -mx-5 mb-6 group bg-black">
            <!-- Scroll Container with Ref for tracking -->
            <div
              ref="mediaScrollRef"
              @scroll="handleScroll"
              class="flex overflow-x-auto snap-x snap-mandatory no-scrollbar aspect-square"
              style="scroll-behavior: smooth"
            >
              <!-- Images -->
              <div
                v-for="(img, index) in post.images"
                :key="`img-${index}`"
                class="w-full flex-shrink-0 snap-center flex items-center justify-center bg-slate-100"
              >
                <img :src="img.fileUrl" class="w-full h-full object-cover" />
              </div>
              <!-- Videos -->
              <div
                v-for="(video, index) in post.videos"
                :key="`vid-${index}`"
                class="w-full flex-shrink-0 snap-center flex items-center justify-center bg-black"
              >
                <video
                  :src="video.fileUrl"
                  controls
                  class="w-full h-full object-contain"
                  playsinline
                ></video>
              </div>
            </div>

            <!-- Navigation Arrows (PC/Web) -->
            <!-- Prev Button -->
            <button
              v-if="currentMediaIndex > 0"
              @click="scrollPrev"
              class="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition z-10"
            >
              <ChevronLeft :size="20" />
            </button>
            <!-- Next Button -->
            <button
              v-if="currentMediaIndex < totalMediaCount - 1"
              @click="scrollNext"
              class="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition z-10"
            >
              <ChevronRight :size="20" />
            </button>

            <!-- Page Indicator -->
            <div
              v-if="totalMediaCount > 1"
              class="absolute bottom-4 right-4 bg-black/60 text-white text-[10px] px-2.5 py-1 rounded-full z-10 font-bold backdrop-blur-md pointer-events-none"
            >
              {{ currentMediaIndex + 1 }} / {{ totalMediaCount }}
            </div>
          </div>

          <!-- Like Button -->
          <div class="flex justify-center">
            <button
              @click="handleLikePost"
              class="flex items-center gap-2 px-5 py-2.5 rounded-full border transition-all active:scale-95"
              :class="
                post.isLiked
                  ? 'border-rose-100 text-rose-500 bg-rose-50'
                  : 'border-slate-200 text-slate-500 hover:bg-slate-50'
              "
            >
              <Heart :size="20" :fill="post.isLiked ? 'currentColor' : 'none'" />
              <span class="text-sm font-bold">{{ post.likeCount }}</span>
            </button>
          </div>
        </div>

        <!-- Comments Section -->
        <div class="p-5">
          <h3 class="font-bold text-sm mb-5 text-slate-800 flex items-center gap-1.5">
            <MessageSquare :size="16" /> 댓글 {{ post.commentCount }}
          </h3>

          <div class="space-y-6">
            <div v-for="comment in post.comments" :key="comment.commentId">
              <!-- Parent Comment -->
              <div class="flex gap-3">
                <div class="w-8 h-8 bg-slate-100 rounded-full overflow-hidden flex-shrink-0 border border-slate-200">
                  <img
                    v-if="!comment.deleted && comment.user?.profileImage"
                    :src="comment.user!.profileImage"
                    class="w-full h-full object-cover"
                  />
                  <div v-else class="w-full h-full flex items-center justify-center text-slate-300">
                    <UserIcon :size="16" />
                  </div>
                </div>
                <div class="flex-1">
                  <template v-if="comment.deleted">
                    <div class="h-full flex items-center">
                      <p class="text-xs text-slate-400 italic">삭제된 댓글입니다.</p>
                    </div>
                  </template>
                  <template v-else>
                    <!-- Edit Mode -->
                    <div v-if="editingCommentId === comment.commentId" class="w-full">
                      <div class="bg-slate-50 rounded-xl p-3 mb-2 border border-slate-200">
                        <textarea
                          v-model="editingContent"
                          class="w-full bg-transparent text-xs text-slate-700 focus:outline-none resize-none placeholder-slate-400"
                          rows="2"
                        ></textarea>
                      </div>
                      <div class="flex justify-end gap-2 text-xs font-bold">
                        <button @click="cancelEditComment" class="text-slate-400 hover:text-slate-600 transition">취소</button>
                        <button @click="submitEditComment(comment.commentId)" class="text-primary-600 hover:text-primary-700 transition">
                          저장
                        </button>
                      </div>
                    </div>

                    <!-- Display Mode -->
                    <div v-else>
                      <div class="flex justify-between items-start mb-1">
                        <span
                          class="text-xs font-bold mr-2 cursor-pointer hover:text-primary-600 transition"
                          :class="{
                            'text-slate-400 cursor-default hover:text-slate-400':
                              !comment.user?.userName,
                          }"
                          @click="comment.user?.userName ? openUserInfo(comment.user) : null"
                        >
                          {{ comment.user?.userName || '탈퇴한 사용자' }}
                        </span>
                        <span class="text-[10px] text-slate-400">{{
                          formatTime(comment.createdAt)
                        }}</span>
                      </div>
                      <p class="text-xs text-slate-700 mb-2 leading-relaxed">
                        {{ comment.content }}
                      </p>

                      <div class="flex gap-3 text-[10px] text-slate-400 font-bold items-center">
                        <button
                          @click="handleLikeComment(comment)"
                          class="flex items-center gap-1 hover:text-rose-500 transition"
                          :class="comment.isLiked ? 'text-rose-500' : ''"
                        >
                          <Heart :size="12" :fill="comment.isLiked ? 'currentColor' : 'none'" /> {{ comment.likeCount }}
                        </button>
                        <button
                          @click="setReplyTarget(comment.commentId, comment.user?.userName || '')"
                          class="hover:text-primary-600 transition"
                        >
                          답글달기
                        </button>
                        <template v-if="comment.user?.userId === authStore.user?.id">
                          <button
                            @click="startEditComment(comment)"
                            class="font-normal hover:text-slate-600 transition"
                          >
                            수정
                          </button>
                          <button
                            @click="handleDeleteComment(comment.commentId)"
                            class="font-normal hover:text-rose-500 transition"
                          >
                            삭제
                          </button>
                        </template>
                      </div>
                    </div>
                  </template>
                </div>
              </div>

              <div
                v-if="comment.children && comment.children.length > 0"
                class="pl-11 mt-3 space-y-3 relative"
              >
                <!-- Connecting Line -->
                <div class="absolute left-4 top-0 bottom-4 w-px bg-slate-100"></div>

                <div v-for="reply in comment.children" :key="reply.commentId" class="flex gap-3 relative">
                 <div class="absolute -left-7 top-3 w-4 h-4 text-slate-200">
                    <CornerDownRight :size="16" />
                 </div>
                  <div class="w-6 h-6 bg-slate-100 rounded-full overflow-hidden flex-shrink-0 border border-slate-200">
                    <img
                      v-if="!reply.deleted && reply.user?.profileImage"
                      :src="reply.user!.profileImage"
                      class="w-full h-full object-cover"
                    />
                    <div v-else class="w-full h-full flex items-center justify-center text-slate-300">
                        <UserIcon :size="12" />
                    </div>
                  </div>
                  <div class="flex-1">
                    <template v-if="reply.deleted">
                      <div class="h-full flex items-center">
                        <p class="text-xs text-slate-400 italic">삭제된 댓글입니다.</p>
                      </div>
                    </template>
                    <template v-else>
                      <!-- Edit Mode -->
                      <div v-if="editingCommentId === reply.commentId" class="w-full">
                        <div class="bg-slate-50 rounded-xl p-3 mb-2 border border-slate-200">
                          <textarea
                            v-model="editingContent"
                            class="w-full bg-transparent text-xs text-slate-700 focus:outline-none resize-none placeholder-slate-400"
                            rows="2"
                          ></textarea>
                        </div>
                        <div class="flex justify-end gap-2 text-xs font-bold">
                          <button @click="cancelEditComment" class="text-slate-400 hover:text-slate-600 transition">취소</button>
                          <button @click="submitEditComment(reply.commentId)" class="text-primary-600 hover:text-primary-700 transition">
                            저장
                          </button>
                        </div>
                      </div>

                      <!-- Display Mode -->
                      <div v-else>
                        <div class="flex justify-between items-start mb-1">
                          <span
                            class="text-xs font-bold mr-2 text-slate-700"
                            :class="{ 'text-slate-400': !reply.user?.userName }"
                            >{{ reply.user?.userName || '탈퇴한 사용자' }}</span
                          >
                          <span class="text-[10px] text-slate-400">{{
                            formatTime(reply.createdAt)
                          }}</span>
                        </div>
                        <p class="text-xs text-slate-700 mb-2 leading-relaxed">
                          {{ reply.content }}
                        </p>
                        <div class="flex gap-3 text-[10px] text-slate-400 font-bold items-center">
                          <button
                            @click="handleLikeComment(reply)"
                            class="flex items-center gap-1 hover:text-rose-500 transition"
                            :class="reply.isLiked ? 'text-rose-500' : ''"
                          >
                             <Heart :size="12" :fill="reply.isLiked ? 'currentColor' : 'none'" /> {{ reply.likeCount }}
                          </button>
                          <!-- 답글의 답글 -> 원댓글에 달림 (가이드) -->
                          <button
                            @click="setReplyTarget(comment.commentId, reply.user?.userName || '')"
                            class="hover:text-primary-600 transition"
                          >
                            답글달기
                          </button>
                          <template v-if="reply.user?.userId === authStore.user?.id">
                            <button
                              @click="startEditComment(reply)"
                              class="font-normal hover:text-slate-600 transition"
                            >
                              수정
                            </button>
                            <button
                              @click="handleDeleteComment(reply.commentId)"
                              class="font-normal hover:text-rose-500 transition"
                            >
                              삭제
                            </button>
                          </template>
                        </div>
                      </div>
                    </template>
                  </div>
                </div>
              </div>
            </div>

            <!-- Empty State -->
            <div
              v-if="!post.comments || post.comments.length === 0"
              class="text-center py-12 text-slate-400 text-xs flex flex-col items-center"
            >
                <div class="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3 text-slate-300">
                    <MessageSquare :size="24" />
                </div>
                첫 번째 댓글의 주인공이 되어보세요!
            </div>
          </div>
        </div>
      </main>

      <!-- Comment Input (Sticky Bottom) -->
      <div v-if="post" class="p-3 bg-white border-t border-slate-100 z-20">
        <div
          v-if="replyTarget"
          class="flex justify-between items-center bg-slate-50 border border-slate-100 px-3 py-2 rounded-lg mb-2 text-xs"
        >
          <span class="text-slate-600 flex items-center gap-1"
            ><CornerDownRight :size="12" /> <b>{{ replyTarget.name }}</b>님께 답글 작성 중</span
          >
          <button @click="cancelReply" class="text-slate-400 hover:text-slate-600 ml-2">✕</button>
        </div>
        <div class="flex gap-2 items-center">
          <input
            ref="commentInputRef"
            type="text"
            v-model="commentContent"
            class="flex-1 h-10 bg-slate-100 rounded-full px-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:bg-white border border-transparent focus:border-primary-500 transition-all placeholder-slate-400"
            placeholder="따뜻한 댓글을 남겨주세요..."
            name="commentBody"
            autocomplete="off"
            @keydown.enter.prevent="!$event.isComposing && handleSubmitComment()"
          />
          <button
            @click="handleSubmitComment"
            class="w-10 h-10 bg-primary-600 text-white rounded-full flex items-center justify-center disabled:bg-slate-200 disabled:cursor-not-allowed transition hover:bg-primary-700 active:scale-90"
            :disabled="!commentContent.trim()"
          >
            <Send :size="18" class="ml-0.5 mt-0.5" />
          </button>
        </div>
      </div>

      <!-- Confirm Modal -->
      <ConfirmModal
        :isOpen="isDeleteModalOpen"
        title="게시글 삭제"
        message="정말로 게시글을 삭제하시겠습니까? 삭제된 게시글은 복구할 수 없습니다."
        confirmText="삭제"
        @close="isDeleteModalOpen = false"
        @confirm="confirmDelete"
      />

      <!-- Comment Delete Modal -->
      <ConfirmModal
        :isOpen="isCommentDeleteModalOpen"
        title="댓글 삭제"
        message="정말로 댓글을 삭제하시겠습니까?"
        confirmText="삭제"
        @close="isCommentDeleteModalOpen = false"
        @confirm="confirmDeleteComment"
      />

      <!-- User Info Modal -->
      <UserInfoModal
        v-if="selectedUser"
        :is-open="isUserInfoOpen"
        :user="selectedUser"
        @close="isUserInfoOpen = false"
      />
    </div>
  </div>
</template>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
