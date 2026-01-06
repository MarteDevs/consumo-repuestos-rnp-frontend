<script setup lang="ts">
import { ref, watch } from 'vue';

export interface ToastProps {
  show: boolean;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

const props = withDefaults(defineProps<ToastProps>(), {
  type: 'info',
  duration: 3000
});

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const visible = ref(props.show);

watch(() => props.show, (newVal) => {
  visible.value = newVal;
  if (newVal && props.duration > 0) {
    setTimeout(() => {
      visible.value = false;
      emit('close');
    }, props.duration);
  }
});

const getIcon = () => {
  switch (props.type) {
    case 'success': return '✅';
    case 'error': return '❌';
    case 'warning': return '⚠️';
    default: return 'ℹ️';
  }
};

const getColorClasses = () => {
  switch (props.type) {
    case 'success': return 'bg-green-50 text-green-800 border-green-200';
    case 'error': return 'bg-red-50 text-red-800 border-red-200';
    case 'warning': return 'bg-yellow-50 text-yellow-800 border-yellow-200';
    default: return 'bg-blue-50 text-blue-800 border-blue-200';
  }
};

const close = () => {
  visible.value = false;
  emit('close');
};
</script>

<template>
  <Transition
    enter-active-class="transition ease-out duration-300"
    enter-from-class="translate-y-2 opacity-0"
    enter-to-class="translate-y-0 opacity-100"
    leave-active-class="transition ease-in duration-200"
    leave-from-class="translate-y-0 opacity-100"
    leave-to-class="translate-y-2 opacity-0"
  >
    <div
      v-if="visible"
      :class="`fixed top-4 right-4 z-50 max-w-sm w-full shadow-lg rounded-lg border-2 p-4 flex items-center gap-3 ${getColorClasses()}`"
    >
      <span class="text-2xl">{{ getIcon() }}</span>
      <p class="flex-1 font-medium">{{ message }}</p>
      <button
        @click="close"
        class="text-gray-400 hover:text-gray-600 transition-colors"
      >
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
        </svg>
      </button>
    </div>
  </Transition>
</template>
