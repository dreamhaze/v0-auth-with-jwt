<script setup>
// Меню в sidebar
const menuItems = [
  { id: 'subscription', label: 'Подписка' },
  { id: 'personal-data', label: 'Личные данные' },
  { id: 'payment-history', label: 'История оплат' },
];

const activeMenuItem = ref('subscription');

// Вкладки в центральной части
const tabs = [
  { id: 'my-profile', label: 'Мой профиль' },
  { id: 'saved-variants', label: 'Сохраненные варианты' },
];

const activeTab = ref('my-profile');
</script>
<template>
  <div class="min-h-screen py-8">
    <!-- Контейнер -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Основная карточка -->
      <div class="bg-white rounded-3xl p-10 md:p-[40px_48px_48px] shadow-sm">
        <div class="flex flex-col lg:flex-row gap-10">
          <!-- Левая колонка (Sidebar) -->
          <aside class="w-full lg:w-[270px] flex-shrink-0">
            <!-- Блок 1: Меню -->
            <div class="space-y-2">
              <div
                v-for="(item, index) in menuItems"
                :key="index"
                class="rounded-xl px-5 py-3 cursor-pointer transition-colors"
                :class="{
                  'bg-gray-100 font-medium': activeMenuItem === item.id,
                  'hover:bg-gray-50': activeMenuItem !== item.id,
                }"
                @click="activeMenuItem = item.id"
              >
                {{ item.label }}
              </div>
            </div>

            <!-- Блок 2: Информация о подписке -->
            <div class="mt-5 bg-gray-50 rounded-2xl p-5">
              <div class="flex items-center gap-3">
                <UIcon name="i-heroicons-bolt" class="w-6 h-6 text-gray-600" />
                <div>
                  <p class="text-sm text-gray-500">Подписка активна до:</p>
                  <p class="font-bold text-lg">19.04.26</p>
                </div>
              </div>
            </div>

            <!-- Блок 3: Обратная связь -->
            <div
              class="mt-5 flex items-center gap-3 p-4 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <UIcon
                name="i-heroicons-envelope"
                class="w-5 h-5 text-gray-600"
              />
              <span class="font-medium tracking-wider text-sm"
                >ОБРАТНАЯ СВЯЗЬ</span
              >
            </div>
          </aside>

          <!-- Центральная колонка -->
          <main class="flex-1">
            <!-- Вкладки -->
            <div
              class="flex items-center justify-between border-b border-gray-200 mb-8"
            >
              <div class="flex gap-8">
                <button
                  v-for="(tab, index) in tabs"
                  :key="index"
                  class="pb-3 px-1 border-b-2 transition-colors"
                  :class="{
                    'border-black font-medium': activeTab === tab.id,
                    'border-transparent text-gray-500 hover:text-gray-700':
                      activeTab !== tab.id,
                  }"
                  @click="activeTab = tab.id"
                >
                  {{ tab.label }}
                </button>
              </div>
              <button
                class="flex items-center gap-2 text-gray-500 hover:text-gray-700"
              >
                <span>Выйти</span>
                <UIcon
                  name="i-heroicons-arrow-right-start-on-rectangle"
                  class="w-5 h-5"
                />
              </button>
            </div>

            <!-- Карточки -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <!-- Карточка 1: Подписка -->
              <div class="bg-gray-50 rounded-2xl p-7">
                <div class="flex items-start gap-4">
                  <UIcon
                    name="i-heroicons-bolt"
                    class="w-7 h-7 text-gray-500 mt-1"
                  />
                  <div>
                    <p
                      class="text-xs font-medium tracking-widest text-gray-500 uppercase"
                    >
                      ПОДПИСКА
                    </p>
                    <p class="text-xl font-bold mt-2">Активна до 19.04.26</p>
                    <p class="text-sm text-gray-600 mt-3">
                      Генерация без лимита,<br />
                      3 бесплатных скачивания<br />
                      или распечатки в день
                    </p>
                  </div>
                </div>
              </div>

              <!-- Карточка 2: Ежедневный лимит -->
              <div class="bg-gray-50 rounded-2xl p-7">
                <div class="flex items-start gap-4">
                  <UIcon
                    name="i-heroicons-clock"
                    class="w-7 h-7 text-gray-500 mt-1"
                  />
                  <div>
                    <p
                      class="text-xs font-medium tracking-widest text-gray-500 uppercase"
                    >
                      ЕЖЕДНЕВНЫЙ ЛИМИТ
                    </p>
                    <p class="text-xl font-bold mt-2">Доступно: 2 из 3</p>
                    <p class="text-sm text-gray-600 mt-3">
                      Лимит скачиваний по подписке<br />
                      Обновляется в 00:00
                    </p>
                  </div>
                </div>
              </div>

              <!-- Карточка 3: Купленные пакеты -->
              <div class="bg-gray-50 rounded-2xl p-7">
                <div class="flex items-start gap-4">
                  <UIcon
                    name="i-heroicons-document-stack"
                    class="w-7 h-7 text-gray-500 mt-1"
                  />
                  <div>
                    <p
                      class="text-xs font-medium tracking-widest text-gray-500 uppercase"
                    >
                      КУПЛЕННЫЕ ПАКЕТЫ
                    </p>
                    <p class="text-xl font-bold mt-2">Скачивания: 0</p>
                    <p class="text-sm text-gray-600 mt-3">
                      Пополнения из магазина<br />
                      Доступны бессрочно
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Предупреждение -->
            <div class="flex items-start gap-3 p-4 bg-gray-50 rounded-xl mb-8">
              <UIcon
                name="i-heroicons-exclamation-triangle"
                class="w-5 h-5 text-gray-500 mt-0.5"
              />
              <p class="text-sm text-gray-600">
                Если у вас уже есть активная подписка и купленные пакеты,
                сначала расходуется 3 ежедневных бесплатных скачивания
              </p>
            </div>

            <!-- Кнопки -->
            <div class="flex gap-4">
              <UButton
                label="ПРОДЛИТЬ ПОДПИСКУ"
                color="red"
                variant="solid"
                size="lg"
                class="font-bold uppercase tracking-wider"
              />
              <UButton
                label="КУПИТЬ ПАКЕТЫ"
                color="gray"
                variant="solid"
                size="lg"
                class="font-bold uppercase tracking-wider"
              />
            </div>
          </main>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Дополнительные стили, если нужно */
</style>
