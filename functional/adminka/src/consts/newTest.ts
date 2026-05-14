import type { VariantTaskKey } from '@/types/ui/newTest';

export const RUSSIAN_LETTERS = 'АБВГДЕЖЗИКЛМНОПРСТУФХЦЧШЩЭЮЯ'.split('');

export const VARIANT_BUILD_ATTEMPTS = 600;

export const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() || 'admin@kritsky.local';

export const TASK2_EXTRA_OPTION_FALLBACK = 'Не относится ни к одному из персонажей';

export const TASK2_PAIR_PICK_ATTEMPTS = 32;

export const SERVICE_TAGS = new Set([
    'встречается',
    'используется',
    'можно найти',
    'относится',
    'принадлежит',
    'содержит',
    'можно заметить',
    'обозначается',
    'называется',
]);

export const ROD_SINGLE_USE_IN_BLOCK11 = new Set(['лирика', 'пьеса', 'поэма']);

export const NO_AUTHOR_TAGS = new Set(['без автора', 'без-автора', 'без_автора']);

export const BLOCK11_KEYS = ['task11_1', 'task11_2', 'task11_3', 'task11_4', 'task11_5'] as const;

export const THEME_GROUP_1_KEYS = ['task4_1', 'task4_2', 'task5'] as const;

export const THEME_GROUP_2_KEYS = ['task9_1', 'task9_2', 'task10'] as const;

export const THEME_GROUP_3_KEYS = ['task11_1', 'task11_2', 'task11_3', 'task11_4', 'task11_5'] as const;

export const SERVICE_TAG_ALLOWED_KEYS = new Set(['task3', 'task6']);

export const CHARACTER_TAG_ALLOWED_KEYS = new Set(['task2', 'task5', 'task11_1', 'task11_2', 'task11_3', 'task11_4', 'task11_5']);

export const HTML_TAG_PATTERN = /<\/?[a-z][\s\S]*>/iu;

export const TASK8_MAX_OPTIONS = 7;

export const TASK8_MIN_CORRECT_OPTIONS = 2;

export const TASK8_MAX_CORRECT_OPTIONS = 6;

export const VARIANT_TASK_KEYS: VariantTaskKey[] = [
    'task1',
    'task2',
    'task3',
    'task4_1',
    'task4_2',
    'task5',
    'task6',
    'task7',
    'task8',
    'task9_1',
    'task9_2',
    'task10',
    'task11_1',
    'task11_2',
    'task11_3',
    'task11_4',
    'task11_5',
];
