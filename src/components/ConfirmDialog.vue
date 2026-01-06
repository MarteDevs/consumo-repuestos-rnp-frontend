<script setup lang="ts">
import { ref, watch } from 'vue';

export interface ConfirmDialogProps {
  show: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

const props = withDefaults(defineProps<ConfirmDialogProps>(), {
  title: 'Confirmar acción',
  confirmText: 'Aceptar',
  cancelText: 'Cancelar',
  type: 'warning'
});

const emit = defineEmits<{
  (e: 'confirm'): void;
  (e: 'cancel'): void;
}>();

const visible = ref(props.show);

watch(() => props.show, (newVal) => {
  visible.value = newVal;
});

const handleConfirm = () => {
  visible.value = false;
  emit('confirm');
};

const handleCancel = () => {
  visible.value = false;
  emit('cancel');
};

const getIconAndColor = () => {
  switch (props.type) {
    case 'danger':
      return { icon: '⚠️', color: 'text-red-600' };
    case 'warning':
      return { icon: '⚠️', color: 'text-yellow-600' };
    default:
      return { icon: 'ℹ️', color: 'text-blue-600' };
  }
};
</script>

<template>
  <Transition
    enter-active-class="transition ease-out duration-200"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition ease-in duration-150"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div
      v-if="visible"
      class="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50"
      @click.self="handleCancel"
    >
      <Transition
        enter-active-class="transition ease-out duration-200"
        enter-from-class="opacity-0 scale-95"
        enter-to-class="opacity-100 scale-100"
        leave-active-class="transition ease-in duration-150"
        leave-from-class="opacity-100 scale-100"
        leave-to-class="opacity-0 scale-95"
      >
        <div
          v-if="visible"
          class="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
        >
          <div class="flex items-start gap-4">
            <div :class="`text-4xl ${getIconAndColor().color}`">
              {{ getIconAndColor().icon }}
            </div>
            <div class="flex-1">
              <h3 class="text-lg font-bold text-gray-900 mb-2">{{ title }}</h3>
              <p class="text-sm text-gray-600">{{ message }}</p>
            </div>
          </div>

          <div class="mt-6 flex justify-end gap-3">
            <button
              @click="handleCancel"
              class="bg-white hover:bg-gray-50 text-gray-700 font-semibold py-2 px-4 rounded border border-gray-300 shadow-sm transition-colors"
            >
              {{ cancelText }}
            </button>
            <button
              @click="handleConfirm"
              :class="type === 'danger' 
                ? 'bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded shadow-sm transition-colors'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded shadow-sm transition-colors'
              "
            >
              {{ confirmText }}
            </button>
          </div>
        </div>
      </Transition>
    </div>
  </Transition>
</template>
