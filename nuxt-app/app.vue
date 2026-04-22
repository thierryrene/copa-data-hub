<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup>
// Boot do tema antes de qualquer render (evita flash).
if (import.meta.client) {
  const settings = useSettingsStore()
  settings.bootThemeAndPalette()
}
</script>
