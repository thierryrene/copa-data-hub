// Toast composable — estado global via useState.
// API: showToast(message, kind?) onde kind ∈ 'success' | 'error' | 'xp'.
// ToastContainer é montado pelo layout default; aqui só empurra no array.

export function useToast() {
  const toasts = useState('cdh_toasts', () => []);

  let _seq = 0;

  function showToast(message, kind = 'success', duration = 3000) {
    const id = ++_seq;
    toasts.value = [...toasts.value, { id, message, kind }];
    if (import.meta.client) {
      setTimeout(() => {
        toasts.value = toasts.value.filter((t) => t.id !== id);
      }, duration);
    }
    return id;
  }

  function dismissToast(id) {
    toasts.value = toasts.value.filter((t) => t.id !== id);
  }

  return { toasts, showToast, dismissToast };
}
