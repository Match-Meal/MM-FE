<script setup lang="ts">
import { ref, onMounted, computed, nextTick, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useToastStore } from '@/stores/toast';
import { 
  getPostDetail, 
  deletePost, 
  togglePostLike, 
  createComment, 
  deleteComment, 
  toggleCommentLike,
  updateComment,
  type PostDetail, 
  type Comment 
} from '@/services/communityService';
import dayjs from 'dayjs';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const toastStore = useToastStore();

const postId = Number(route.params.id);
const post = ref<PostDetail | null>(null);
const isLoading = ref(true);
const commentContent = ref('');
const replyTarget = ref<{ id: number, name: string } | null>(null);
const isMenuOpen = ref(false);

// Media Carousel
const mediaScrollRef = ref<HTMLElement | null>(null);
const currentMediaIndex = ref(0);

const hasMedia = computed(() => {
    return (post.value?.images && post.value.images.length > 0) || (post.value?.videos && post.value.videos.length > 0);
});

const totalMediaCount = computed(() => {
    if (!post.value) return 0;
    return (post.value.images?.length || 0) + (post.value.videos?.length || 0);
});

const handleScroll = () => {
    if (!mediaScrollRef.value) return;
    const scrollLeft = mediaScrollRef.value.scrollLeft;
    const width = mediaScrollRef.value.offsetWidth;
    currentMediaIndex.value = Math.round(scrollLeft / width);
};

// Pause all videos when slide changes
watch(currentMediaIndex, () => {
    if (!mediaScrollRef.value) return;
    const videos = mediaScrollRef.value.querySelectorAll('video');
    videos.forEach(video => {
        video.pause();
    });
});

const scrollPrev = () => {
    if (!mediaScrollRef.value) return;
    mediaScrollRef.value.scrollBy({ left: -mediaScrollRef.value.offsetWidth, behavior: 'smooth' });
};

const scrollNext = () => {
    if (!mediaScrollRef.value) return;
    mediaScrollRef.value.scrollBy({ left: mediaScrollRef.value.offsetWidth, behavior: 'smooth' });
};

// Input ref for focus
const commentInputRef = ref<HTMLInputElement | null>(null);

const initData = async () => {
  try {
    isLoading.value = true;
    post.value = await getPostDetail(postId);
    console.log('Post Detail:', post.value); // Debugging
  } catch (e) {
    console.error(e);
    toastStore.show('게시글을 불러오지 못했습니다.');
    router.back();
  } finally {
    isLoading.value = false;
  }
};

const goBack = () => router.back();

const isOwner = computed(() => {
  return post.value?.user.userId === authStore.user?.id;
});

import ConfirmModal from '@/components/common/ConfirmModal.vue';

// ... (existing imports)

const isDeleteModalOpen = ref(false);

// Post Actions
const handleDeletePost = async () => {
    isDeleteModalOpen.value = true;
};

const confirmDelete = async () => {
  try {
    await deletePost(postId);
    toastStore.show('게시글이 삭제되었습니다.');
    router.replace('/community');
  } catch (e) {
    console.error(e);
    toastStore.show('삭제 실패했습니다.');
  }
};

const handleEditPost = () => {
  router.push(`/community/edit/${postId}`);
};

const handleLikePost = async () => {
  if (!post.value) return;
  try {
    const isLiked = await togglePostLike(postId);
    post.value.isLiked = isLiked;
    post.value.likeCount += isLiked ? 1 : -1;
  } catch (e) {
    console.error(e);
  }
};

// Comment Actions
const handleSubmitComment = async () => {
  if (!commentContent.value.trim()) return;
  if (!post.value) return;

  try {
    // If replyTarget exists, it's a child comment
    const parentId = replyTarget.value ? replyTarget.value.id : undefined;
    
    // Optimistic UI or fetch again? 
    // API returns the created comment. We should probably fetch detail again or manually append.
    // Fetching again ensures correct ordering and structure.
    await createComment(postId, commentContent.value, parentId);
    
    commentContent.value = '';
    replyTarget.value = null; // Reset reply target
    
    // Refresh data
    await initData();
    
    // Scroll to bottom? Or just let user see.
  } catch (e) {
    console.error(e);
    toastStore.show('댓글 등록 실패');
  }
};

const handleDeleteComment = async (commentId: number) => {
  deletingCommentId.value = commentId;
  isCommentDeleteModalOpen.value = true;
};

const deletingCommentId = ref<number | null>(null);
const isCommentDeleteModalOpen = ref(false);

const confirmDeleteComment = async () => {
    if (!deletingCommentId.value) return;
    try {
        await deleteComment(deletingCommentId.value);
        await initData();
        toastStore.show('댓글이 삭제되었습니다.');
    } catch (e) {
        console.error(e);
        toastStore.show('댓글 삭제 실패');
    } finally {
        isCommentDeleteModalOpen.value = false;
        deletingCommentId.value = null;
    }
};

const handleLikeComment = async (comment: Comment) => {
  try {
    const isLiked = await toggleCommentLike(comment.commentId);
    comment.isLiked = isLiked;
    comment.likeCount += isLiked ? 1 : -1;
  } catch (e) {
    console.error(e);
  }
};

// Comment Editing
const editingCommentId = ref<number | null>(null);
const editingContent = ref('');

const startEditComment = (comment: Comment) => {
    editingCommentId.value = comment.commentId;
    editingContent.value = comment.content;
};

const cancelEditComment = () => {
    editingCommentId.value = null;
    editingContent.value = '';
};

const submitEditComment = async (commentId: number) => {
    if (!editingContent.value.trim()) {
        toastStore.show('내용을 입력해주세요.');
        return;
    }
    try {
        await updateComment(commentId, editingContent.value);
        toastStore.show('댓글이 수정되었습니다.');
        cancelEditComment();
        // Refresh post to see changes (or update locally)
        await initData();
    } catch (e) {
        console.error(e);
        toastStore.show('댓글 수정 실패');
    }
};

const setReplyTarget = (commentId: number, userName: string) => {
  replyTarget.value = { id: commentId, name: userName };
  nextTick(() => {
    commentInputRef.value?.focus();
  });
};

const cancelReply = () => {
  replyTarget.value = null;
};

const formatTime = (dateStr: string) => dayjs(dateStr).format('YYYY.MM.DD HH:mm');

onMounted(() => {
  initData();
});
</script>

<template>
  <div class="bg-gray-200 min-h-screen flex items-center justify-center font-sans text-gray-800">
    <div class="relative w-[375px] h-[812px] bg-white shadow-2xl rounded-[35px] overflow-hidden border-[8px] border-gray-800 flex flex-col">
      
      <!-- Header -->
      <header class="h-14 border-b flex items-center justify-between px-4 bg-white z-20 shrink-0">
        <button @click="goBack" class="text-2xl w-8">←</button>
        <h1 class="font-bold text-lg truncate">게시글 상세</h1>
        <div class="w-8 flex justify-end relative">
           <!-- More Menu (Edit/Delete) -->
           <button v-if="isOwner" @click="isMenuOpen = !isMenuOpen" class="text-xl px-2">⋮</button>
           <div v-if="isOwner && isMenuOpen" class="absolute top-8 right-0 bg-white border shadow-lg rounded-lg w-20 z-10 overflow-hidden">
               <button @click="handleEditPost" class="w-full text-left text-xs px-3 py-2 hover:bg-gray-50">수정</button>
               <button @click="handleDeletePost" class="w-full text-left text-xs px-3 py-2 hover:bg-gray-50 text-red-500">삭제</button>
           </div>
        </div>
      </header>

      <main v-if="isLoading" class="flex-1 flex items-center justify-center">
        Loading...
      </main>

      <main v-else-if="post" class="flex-1 overflow-y-auto bg-white pb-20 no-scrollbar relative">
        <!-- Post Content -->
        <div class="p-5 border-b-8 border-gray-100">
            <!-- User Info -->
            <div class="flex items-center gap-3 mb-4">
                <div class="w-10 h-10 bg-gray-200 rounded-full overflow-hidden border">
                    <img v-if="post.user.profileImage" :src="post.user.profileImage" class="w-full h-full object-cover">
                    <span v-else class="w-full h-full flex items-center justify-center">👤</span>
                </div>
                <div>
                     <p class="text-sm font-bold">{{ post.user.userName }}</p>
                     <p class="text-xs text-gray-400">{{ formatTime(post.createdAt) }} • 조회 {{ post.viewCount }}</p>
                </div>
            </div>

            <!-- Title & Body -->
            <h2 class="text-xl font-bold mb-3">{{ post.title }}</h2>
            <p class="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap mb-6">{{ post.content }}</p>

            <!-- Media Carousel -->
            <div v-if="hasMedia" class="relative -mx-5 mb-6 group bg-black">
                <!-- Scroll Container with Ref for tracking -->
                <div 
                    ref="mediaScrollRef"
                    @scroll="handleScroll"
                    class="flex overflow-x-auto snap-x snap-mandatory no-scrollbar aspect-square" 
                    style="scroll-behavior: smooth;"
                >
                    <!-- Images -->
                    <div v-for="(imgUrl, index) in post.images" :key="`img-${index}`" class="w-full flex-shrink-0 snap-center flex items-center justify-center bg-gray-100">
                        <img :src="imgUrl" class="w-full h-full object-cover">
                    </div>
                    <!-- Videos -->
                    <div v-for="(videoUrl, index) in post.videos" :key="`vid-${index}`" class="w-full flex-shrink-0 snap-center flex items-center justify-center bg-black">
                        <video :src="videoUrl" controls class="w-full h-full object-contain" playsinline></video>
                    </div>
                </div>

                <!-- Navigation Arrows (PC/Web) -->
                <!-- Prev Button -->
                <button 
                  v-if="currentMediaIndex > 0"
                  @click="scrollPrev"
                  class="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition z-10"
                >
                  <span class="text-xl pb-1">‹</span>
                </button>
                <!-- Next Button -->
                <button 
                  v-if="currentMediaIndex < totalMediaCount - 1"
                  @click="scrollNext"
                  class="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition z-10"
                >
                  <span class="text-xl pb-1">›</span>
                </button>
                
                <!-- Page Indicator -->
                <div v-if="totalMediaCount > 1" class="absolute bottom-4 right-4 bg-black/60 text-white text-[10px] px-2 py-1 rounded-full z-10 font-bold backdrop-blur-sm pointer-events-none">
                     {{ currentMediaIndex + 1 }} / {{ totalMediaCount }}
                </div>
            </div>

            <!-- Like Button -->
            <div class="flex justify-center">
                <button 
                    @click="handleLikePost"
                    class="flex items-center gap-2 px-4 py-2 rounded-full border transition"
                    :class="post.isLiked ? 'border-red-500 text-red-500 bg-red-50' : 'border-gray-300 text-gray-500'"
                >
                    <span class="text-lg">{{ post.isLiked ? '♥' : '♡' }}</span>
                    <span class="text-sm font-bold">{{ post.likeCount }}</span>
                </button>
            </div>
        </div>

        <!-- Comments Section -->
        <div class="p-5">
            <h3 class="font-bold text-sm mb-4">댓글 {{ post.commentCount }}</h3>

            <div class="space-y-6">
                <div v-for="comment in post.comments" :key="comment.commentId">
                    <!-- Parent Comment -->
                    <div class="flex gap-3">
                        <div class="w-8 h-8 bg-gray-200 rounded-full overflow-hidden flex-shrink-0">
                             <img v-if="!comment.deleted && comment.user?.profileImage" :src="comment.user!.profileImage" class="w-full h-full object-cover">
                             <span v-else class="w-full h-full flex items-center justify-center text-xs">👤</span>
                        </div>
                        <div class="flex-1">
                            <template v-if="comment.deleted">
                                <div class="h-full flex items-center">
                                    <p class="text-xs text-gray-400">삭제된 댓글입니다.</p>
                                </div>
                            </template>
                            <template v-else>
                                <!-- Edit Mode -->
                                <div v-if="editingCommentId === comment.commentId" class="w-full">
                                    <div class="bg-gray-100 rounded-xl p-2 mb-2">
                                        <textarea 
                                            v-model="editingContent"
                                            class="w-full bg-transparent text-xs text-gray-700 focus:outline-none resize-none"
                                            rows="2"
                                        ></textarea>
                                    </div>
                                    <div class="flex justify-end gap-2 text-xs font-bold">
                                        <button @click="cancelEditComment" class="text-gray-400">취소</button>
                                        <button @click="submitEditComment(comment.commentId)" class="text-blue-600">저장</button>
                                    </div>
                                </div>

                                <!-- Display Mode -->
                                <div v-else>
                                    <div class="flex justify-between items-start mb-1">
                                        <span class="text-xs font-bold mr-2">{{ comment.user?.userName }}</span>
                                        <span class="text-[10px] text-gray-400">{{ formatTime(comment.createdAt) }}</span>
                                    </div>
                                    <p class="text-xs text-gray-700 mb-2 leading-relaxed">{{ comment.content }}</p>
                                    
                                    <div class="flex gap-3 text-[10px] text-gray-500 font-bold">
                                        <button @click="handleLikeComment(comment)" :class="comment.isLiked ? 'text-red-500' : ''">
                                            좋아요 {{ comment.likeCount }}
                                        </button>
                                        <button @click="setReplyTarget(comment.commentId, comment.user?.userName || '')">답글달기</button> 
                                        <template v-if="comment.user?.userId === authStore.user?.id">
                                            <button @click="startEditComment(comment)" class="text-gray-400 font-normal">수정</button>
                                            <button @click="handleDeleteComment(comment.commentId)" class="text-gray-400 font-normal">삭제</button>
                                        </template>
                                    </div>
                                </div>
                            </template>
                        </div>
                    </div>

                    <div v-if="comment.children && comment.children.length > 0" class="pl-11 mt-3 space-y-3">
                        <div v-for="reply in comment.children" :key="reply.commentId" class="flex gap-3">
                             <div class="w-6 h-6 bg-gray-200 rounded-full overflow-hidden flex-shrink-0">
                                <img v-if="!reply.deleted && reply.user?.profileImage" :src="reply.user!.profileImage" class="w-full h-full object-cover">
                                <span v-else class="w-full h-full flex items-center justify-center text-[10px]">👤</span>
                            </div>
                            <div class="flex-1">
                                <template v-if="reply.deleted">
                                     <div class="h-full flex items-center">
                                        <p class="text-xs text-gray-400">삭제된 댓글입니다.</p>
                                    </div>
                                </template>
                                <template v-else>
                                    <!-- Edit Mode -->
                                    <div v-if="editingCommentId === reply.commentId" class="w-full">
                                        <div class="bg-gray-100 rounded-xl p-2 mb-2">
                                            <textarea 
                                                v-model="editingContent"
                                                class="w-full bg-transparent text-xs text-gray-700 focus:outline-none resize-none"
                                                rows="2"
                                            ></textarea>
                                        </div>
                                        <div class="flex justify-end gap-2 text-xs font-bold">
                                            <button @click="cancelEditComment" class="text-gray-400">취소</button>
                                            <button @click="submitEditComment(reply.commentId)" class="text-blue-600">저장</button>
                                        </div>
                                    </div>

                                    <!-- Display Mode -->
                                    <div v-else>
                                        <div class="flex justify-between items-start mb-1">
                                            <!-- Using optional chaining safely or relying on v-if check -->
                                            <span class="text-xs font-bold mr-2">{{ reply.user?.userName }}</span>
                                            <span class="text-[10px] text-gray-400">{{ formatTime(reply.createdAt) }}</span>
                                        </div>
                                        <p class="text-xs text-gray-700 mb-2 leading-relaxed">{{ reply.content }}</p>
                                        <div class="flex gap-3 text-[10px] text-gray-500 font-bold">
                                            <button @click="handleLikeComment(reply)" :class="reply.isLiked ? 'text-red-500' : ''">좋아요 {{ reply.likeCount }}</button>
                                            <!-- 답글의 답글 -> 원댓글에 달림 (가이드) -->
                                            <button @click="setReplyTarget(comment.commentId, reply.user?.userName || '')">답글달기</button>
                                            <template v-if="reply.user?.userId === authStore.user?.id">
                                                <button @click="startEditComment(reply)" class="text-gray-400 font-normal">수정</button>
                                                <button @click="handleDeleteComment(reply.commentId)" class="text-gray-400 font-normal">삭제</button>
                                            </template>
                                        </div>
                                    </div>
                                </template>
                            </div>
                        </div>
                    </div>
                </div>

                 <!-- Empty State -->
                <div v-if="(!post.comments || post.comments.length === 0)" class="text-center py-10 text-gray-400 text-xs">
                    첫 번째 댓글을 남겨보세요! 👋
                </div>
            </div>
        </div>
      </main>

      <!-- Comment Input (Sticky Bottom) -->
      <div v-if="post" class="p-3 bg-white border-t z-20">
         <div v-if="replyTarget" class="flex justify-between items-center bg-gray-50 px-3 py-1.5 rounded-lg mb-2 text-xs">
             <span class="text-gray-600">to. <b>{{ replyTarget.name }}</b>님께 답글 작성 중</span>
             <button @click="cancelReply" class="text-gray-400 ml-2">✕</button>
         </div>
         <div class="flex gap-2">
             <input 
                ref="commentInputRef"
                type="text" 
                v-model="commentContent"
                class="flex-1 h-10 bg-gray-100 rounded-full px-4 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="댓글을 입력하세요..."
                name="commentBody"
                autocomplete="off"
                @keyup.enter="handleSubmitComment"
             >
             <button 
                @click="handleSubmitComment"
                class="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center disabled:bg-gray-300 transition"
                :disabled="!commentContent.trim()"
             >
                ↑
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
