# 15 Минут - Мессенджер

Современный веб-мессенджер с поддержкой чатов, каналов и ивентов.

## 🎨 Цветовая палитра

- **Основной акцент**: #D37841 (оранжевый)
- **Фон**: #00A896 (бирюзовый)
- **Детализация фона**: #F4F9F4 (светло-зелёный)

## 📋 Страницы

### 1. **auth.html** - Аутентификация
- Вход в аккаунт
- Регистрация нового пользователя
- Валидация данных
- Интеграция с Supabase Auth

### 2. **index.html** - Главная (Чаты)
- Список личных чатов
- Окно чата с историей сообщений
- Общий чат для всех пользователей
- Создание новых чатов
- Real-time сообщения

### 3. **channels.html** - Каналы
- Список каналов
- Просмотр сообщений канала
- Создание новых каналов
- Публичные каналы для групповых обсуждений

### 4. **event.html** - Ивенты
- Просмотр ближайших ивентов
- Создание новых ивентов
- Отображение даты и времени ивента
- Информация о создателе ивента

### 5. **Логотип**
- **Имя файла**: `Logotype.png`
- **Расположение**: `assets/Logotype.png`
- **Отображается**: На всех страницах кроме event.html

## 🗂️ Структура проекта

```
15Minute/
├── index.html           # Главная страница (чаты)
├── auth.html           # Страница аутентификации
├── channels.html       # Страница каналов
├── event.html          # Страница ивентов
├── styles.css          # Главный стилист
├── assets/
│   └── Logotype.png    # Логотип приложения
└── js/
    ├── config.js       # Конфигурация Supabase
    ├── auth.js         # Логика аутентификации
    ├── main.js         # Логика чатов и общего чата
    ├── channels.js     # Логика каналов
    └── events.js       # Логика ивентов
```

## 🔧 Интеграция с Supabase

### Учётные данные
- **URL**: https://yfftzhmawfopthlmwgsb.supabase.co
- **Public Key**: sb_publishable_6avDDRSjmi-N-IIcMmye4w_GMWOVSpV

### Требуемые таблицы в Supabase

#### 1. **profiles** (профили пользователей)
```sql
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users,
  name text,
  email text UNIQUE,
  created_at timestamp DEFAULT NOW()
);
```

#### 2. **chats** (личные чаты)
```sql
CREATE TABLE chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_by uuid REFERENCES auth.users,
  created_at timestamp DEFAULT NOW()
);
```

#### 3. **messages** (сообщения в чатах)
```sql
CREATE TABLE messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id uuid REFERENCES chats ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users,
  user_name text,
  content text NOT NULL,
  created_at timestamp DEFAULT NOW()
);
```

#### 4. **general_chat** (общий чат)
```sql
CREATE TABLE general_chat (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users,
  user_name text,
  content text NOT NULL,
  created_at timestamp DEFAULT NOW()
);
```

#### 5. **channels** (каналы)
```sql
CREATE TABLE channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_by uuid REFERENCES auth.users,
  created_at timestamp DEFAULT NOW()
);
```

#### 6. **channel_messages** (сообщения в каналах)
```sql
CREATE TABLE channel_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid REFERENCES channels ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users,
  user_name text,
  content text NOT NULL,
  created_at timestamp DEFAULT NOW()
);
```

#### 7. **events** (ивенты)
```sql
CREATE TABLE events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  event_date timestamp,
  created_by uuid REFERENCES auth.users,
  creator_name text,
  created_at timestamp DEFAULT NOW()
);
```

## 🚀 Функциональность

### Аутентификация
✅ Регистрация новых пользователей
✅ Вход в аккаунт
✅ Безопасное хранение паролей
✅ Валидация данных

### Чаты
✅ Создание личных чатов
✅ Отправка и получение сообщений
✅ История сообщений
✅ Real-time обновление
✅ Общий чат для всех пользователей

### Каналы
✅ Создание публичных каналов
✅ Добавление описания к каналам
✅ Групповые обсуждения
✅ Real-time сообщения в каналах

### Ивенты
✅ Создание ивентов с датой и временем
✅ Просмотр списка ивентов
✅ Информация о создателе
✅ Сортировка по дате

## 📱 Адаптивный дизайн

Приложение полностью адаптивно и работает на:
- 🖥️ Десктопных браузерах
- 📱 Мобильных устройствах
- 📲 Планшетах

## 🎯 Навигация

Основное меню навигации расположено под заголовком:
- **Чаты** - Личные чаты и общий чат
- **Ивенты** - Создание и просмотр ивентов
- **Каналы** - Публичные каналы для группового общения

## 💡 Особенности

- 🎨 Современный и привлекательный дизайн
- 🔐 Безопасная аутентификация через Supabase
- ⚡ Real-time обновление сообщений
- 📱 Полная адаптивность
- 🌍 Поддержка русского языка
- ♿ Доступный интерфейс

## 🔄 Real-time обновления

Приложение использует Supabase Realtime для мгновенных обновлений:
- Новые сообщения появляются сразу
- Новые ивенты отображаются в реальном времени
- Список каналов обновляется автоматически

## 📝 Примечания

- Логотип размещается в папке `assets/` с именем `Logotype.png`
- Все стили централизованы в файле `styles.css`
- JavaScript модули используют Supabase JS SDK версии 2.38.4
- Приложение требует активного интернета для работы с Supabase

## 🔐 Безопасность

- Пароли хранятся в зашифрованном виде в Supabase
- Все API запросы выполняются через защищённые соединения
- User ID используется для идентификации пользователя
- RLS (Row Level Security) должны быть настроены в Supabase