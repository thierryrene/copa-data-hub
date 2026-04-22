// Controle global do SearchOverlay via useState.
// API: { isOpen, open, close, toggle }. Montar <SearchOverlay> 1x no layout.

export function useSearchOverlay() {
  const isOpen = useState('cdh_search_overlay_open', () => false);

  function open() {
    isOpen.value = true;
  }

  function close() {
    isOpen.value = false;
  }

  function toggle() {
    isOpen.value = !isOpen.value;
  }

  return { isOpen, open, close, toggle };
}
