<script setup lang="ts">
import { useConfirmStore } from '@/stores/confirm'
import ConfirmModal from '@/components/common/ConfirmModal.vue'

const confirmStore = useConfirmStore()
</script>

<template>
  <ConfirmModal
    :is-open="confirmStore.isOpen"
    :title="confirmStore.title"
    :message="confirmStore.message"
    :confirm-text="confirmStore.confirmText"
    :cancel-text="confirmStore.cancelText"
    @close="confirmStore.cancel"
    @confirm="confirmStore.confirm"
  />
</template>
