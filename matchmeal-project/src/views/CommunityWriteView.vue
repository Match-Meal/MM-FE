<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { 
  createPost, 
  updatePost, 
  getPostDetail, 
  CommunityCategory 
} from '@/services/communityService';

import { useAuthStore } from '@/stores/auth';
import { useToastStore } from '@/stores/toast';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const toastStore = useToastStore();

const isEditMode = computed(() => !!route.params.id);
const isLoading = ref(false);

// Form Data
const category = ref<string>(CommunityCategory.FREE);
const title = ref('');
const content = ref('');
const files = ref<File[]>([]);

// Previews
interface FileItem {
  url: string;
  type: 'image' | 'video';
  fileId?: number; // Added for tracking deletion
}

const previewItems = ref<FileItem[]>([]);
const existingItems = ref<FileItem[]>([]); // For edit mode display
const deletedFileIds = ref<number[]>([]);

const categories = computed(() => {
  const list = [
    { label: '🗣 자유', value: CommunityCategory.FREE },
    { label: '🥗 식단', value: CommunityCategory.DIET },
    { label: '❓ 질문', value: CommunityCategory.QNA },
    { label: '💡 정보', value: CommunityCategory.INFO },
  ];

  if (authStore.user?.role === 'ROLE_ADMIN') {
    list.unshift({ label: '📢 공지', value: CommunityCategory.NOTICE });
  }

  return list;
});

const fileInputRef = ref<HTMLInputElement | null>(null);

const triggerFileInput = () => {
    fileInputRef.value?.click();
};

// 이미지 압축 함수
const compressImage = async (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                const MAX_WIDTH = 1280;
                const MAX_HEIGHT = 1280;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);

                canvas.toBlob((blob) => {
                    if (blob) {
                        const compressedFile = new File([blob], file.name, {
                            type: 'image/jpeg',
                            lastModified: Date.now(),
                        });
                        resolve(compressedFile);
                    } else {
                        reject(new Error('Image compression failed'));
                    }
                }, 'image/jpeg', 0.7);
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
};

const handleFileChange = async (event: Event) => {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
        isLoading.value = true;
        try {
            const fileList = Array.from(target.files);
            
            // Calculate total count including existing items and currently selected files
            const currentTotal = existingItems.value.length + files.value.length;
            
            if (currentTotal + fileList.length > 5) {
                toastStore.show('최대 5개까지만 업로드 가능합니다.');
                return;
            }

            const processedFiles: File[] = [];
            const newPreviewItems: FileItem[] = [];

            for (const file of fileList) {
                if (file.type.startsWith('video/')) {
                    // Video Validation (e.g. 50MB limit)
                    if (file.size > 50 * 1024 * 1024) {
                        toastStore.show(`동영상 용량은 50MB 이하여야 합니다. (${file.name})`);
                        continue;
                    }
                    processedFiles.push(file);
                    newPreviewItems.push({
                        url: URL.createObjectURL(file),
                        type: 'video'
                    });
                } else if (file.type.startsWith('image/')) {
                    try {
                        const compressed = await compressImage(file);
                        processedFiles.push(compressed);
                        newPreviewItems.push({
                            url: URL.createObjectURL(compressed),
                            type: 'image'
                        });
                    } catch (e) {
                         console.error('Compression failed', e);
                         processedFiles.push(file);
                         newPreviewItems.push({
                            url: URL.createObjectURL(file),
                            type: 'image'
                        });
                    }
                }
            }

            // Append new files and previews
            files.value = [...files.value, ...processedFiles];
            previewItems.value = [...previewItems.value, ...newPreviewItems];
            
        } finally {
            isLoading.value = false;
            // Reset input so same file can be selected again or continuous selection works
            if (fileInputRef.value) fileInputRef.value.value = '';
        }
    }
};

const clearFiles = () => {
    files.value = [];
    previewItems.value.forEach(item => URL.revokeObjectURL(item.url));
    previewItems.value = [];
    if (fileInputRef.value) fileInputRef.value.value = '';

    if (isEditMode.value && initialExistingItems.length > 0) {
        // "Clear All" logic: check if we need to add existing items to deletedFileIds
        if (existingItems.value.length > 0) {
             existingItems.value.forEach(item => {
                 if (item.fileId) deletedFileIds.value.push(item.fileId);
             });
             existingItems.value = [];
        }
    }
};

const removeNewFile = (index: number) => {
    // Revoke URL if exists
    if (previewItems.value[index]) {
        URL.revokeObjectURL(previewItems.value[index].url);
    }
    
    // Remove from arrays
    previewItems.value.splice(index, 1);
    const newFiles = [...files.value];
    newFiles.splice(index, 1);
    files.value = newFiles;
};

const removeExistingFile = (index: number) => {
    const item = existingItems.value[index];
    if (item && item.fileId) {
        deletedFileIds.value.push(item.fileId);
    }
    existingItems.value.splice(index, 1);
};

let initialExistingItems: FileItem[] = [];

const initData = async () => {
    if (isEditMode.value) {
        try {
            isLoading.value = true;
            const postId = Number(route.params.id);
            const data = await getPostDetail(postId);
            title.value = data.title;
            content.value = data.content;
            
            const combined: FileItem[] = [];
            
            // Prefer 'files' if available (contains fileId), otherwise fallback to images/videos (old way)
            // Combine images and videos from response (which are now PostFile objects)
            if (data.images) {
                data.images.forEach(img => {
                    combined.push({
                        url: img.fileUrl,
                        type: 'image',
                        fileId: img.fileId
                    });
                });
            }
            if (data.videos) {
                data.videos.forEach(vid => {
                    combined.push({
                        url: vid.fileUrl,
                        type: 'video',
                        fileId: vid.fileId
                    });
                });
            }
            
            existingItems.value = combined;
            initialExistingItems = [...combined];
            deletedFileIds.value = []; // Reset deleted IDs
        } catch (e) {
            console.error(e);
            toastStore.show('게시글 정보를 불러오지 못했습니다.');
            router.back();
        } finally {
            isLoading.value = false;
        }
    }
};

const submitPost = async () => {
    if (!title.value.trim() || !content.value.trim()) {
        toastStore.show('제목과 내용을 입력해주세요.');
        return;
    }

    try {
        isLoading.value = true;
        const payload = {
            category: category.value,
            title: title.value,
            content: content.value,
            deleteFileIds: deletedFileIds.value.length > 0 ? deletedFileIds.value : undefined
        };

        if (isEditMode.value) {
             await updatePost(Number(route.params.id), payload, files.value);
             toastStore.show('게시글이 수정되었습니다.');
             router.back();
        } else {
             await createPost(payload, files.value);
             toastStore.show('게시글이 등록되었습니다.');
             router.replace('/community'); // Create goes to list (or we could go to detail)
        }
    } catch (e) {
        console.error(e);
        toastStore.show('저장에 실패했습니다.');
    } finally {
        isLoading.value = false;
    }
};

const goBack = () => router.back();

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
        <h1 class="font-bold text-lg truncate">{{ isEditMode ? '게시글 수정' : '새 게시글' }}</h1>
        <button @click="submitPost" class="text-sm font-bold text-blue-600 w-8" :disabled="isLoading">완료</button>
      </header>

      <main class="flex-1 overflow-y-auto bg-white p-6 pb-20 no-scrollbar">
          
          <!-- Category Select -->
          <div class="mb-4">
              <label class="block text-xs font-bold text-gray-500 mb-2">카테고리</label>
              <div class="flex flex-wrap gap-2">
                  <button 
                    v-for="cat in categories" 
                    :key="cat.value"
                    @click="category = cat.value"
                    class="px-3 py-2 rounded-lg text-xs font-bold border transition"
                    :class="category === cat.value ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 text-gray-600 border-gray-200'"
                  >
                    {{ cat.label }}
                  </button>
              </div>
          </div>

          <!-- Title -->
          <div class="mb-4">
               <input 
                 type="text" 
                 v-model="title" 
                 name="postTitle"
                 id="postTitle"
                 autocomplete="off"
                 class="w-full text-lg font-bold border-b border-gray-200 py-2 focus:outline-none focus:border-blue-500 placeholder-gray-300"
                 placeholder="제목을 입력하세요"
               >
          </div>

          <!-- Content -->
          <div class="mb-6">
              <textarea 
                v-model="content" 
                class="w-full h-64 resize-none text-sm leading-relaxed focus:outline-none placeholder-gray-300"
                placeholder="내용을 입력하세요. (건강한 커뮤니티를 위해 서로 존중해주세요!)"
              ></textarea>
          </div>

          <!-- Image Upload -->
          <div>
              <div class="flex items-center justify-between mb-2">
                  <label class="text-xs font-bold text-gray-500">사진/동영상 첨부</label>
                  <button v-if="previewItems.length > 0 || existingItems.length > 0" @click="clearFiles" class="text-xs text-red-500">전체 삭제</button>
              </div>

              <!-- Horizontal Scroll for images -->
              <div class="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                  <!-- Add Button -->
                  <div 
                    @click="triggerFileInput"
                    class="w-20 h-20 bg-gray-50 rounded-xl border border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 cursor-pointer overflow-hidden flex-shrink-0"
                  >
                      <span class="text-xl">📷</span>
                      <span class="text-[10px]">{{ previewItems.length }}/5</span>
                  </div>

                  <!-- Existing Items (Edit Mode) -->
                  <div 
                    v-for="(item, index) in existingItems" 
                    :key="`existing-${index}`"
                    class="w-20 h-20 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0 relative border"
                  >
                      <img v-if="item.type === 'image'" :src="item.url" class="w-full h-full object-cover opacity-70">
                      <video v-else :src="item.url" class="w-full h-full object-cover opacity-70"></video>
                      <div class="absolute inset-0 flex items-center justify-center text-[10px] text-white font-bold bg-black/30 pointer-events-none">기존</div>
                      
                      <!-- Delete Button -->
                      <button 
                        @click="removeExistingFile(index)"
                        class="absolute top-1 right-1 w-5 h-5 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-red-500 transition z-10"
                      >
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" /></svg>
                      </button>
                  </div>

                  <!-- New Previews -->
                  <div 
                    v-for="(item, idx) in previewItems" 
                    :key="idx" 
                    class="w-20 h-20 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0 border relative"
                  >
                      <img v-if="item.type === 'image'" :src="item.url" class="w-full h-full object-cover">
                      <video v-else :src="item.url" class="w-full h-full object-cover"></video>
                      
                      <!-- Video Indicator -->
                      <div v-if="item.type === 'video'" class="absolute bottom-1 right-1 bg-black/50 text-white rounded-full p-0.5 pointer-events-none">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" /></svg>
                      </div>

                      <!-- Delete Button -->
                      <button 
                        @click="removeNewFile(idx)"
                        class="absolute top-1 right-1 w-5 h-5 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-red-500 transition z-10"
                      >
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" /></svg>
                      </button>
                  </div>
              </div>
              
              <input 
                type="file" 
                ref="fileInputRef" 
                multiple 
                accept="image/*,video/*" 
                class="hidden"
                @change="handleFileChange"
              >
              <p class="text-[10px] text-gray-400 mt-2">* 사진/동영상은 최대 5개, 동영상은 개당 50MB까지 가능합니다.</p>
          </div>

      </main>

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
