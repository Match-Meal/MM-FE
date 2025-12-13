import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useToastStore = defineStore('toast', () => {
    const message = ref('');
    const isVisible = ref(false);
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const show = (msg: string, duration = 2000) => {
        message.value = msg;
        isVisible.value = true;
        
        if (timeoutId) clearTimeout(timeoutId);
        
        timeoutId = setTimeout(() => {
            isVisible.value = false;
        }, duration);
    };

    return { message, isVisible, show };
});
