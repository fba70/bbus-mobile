# Разработка

Скачать репозиторий, установить pnpm, выполнить

```sh
pnpm i
```

После этого будет доступны команды с `expo`

Для запуска разработки при помощи `expo go`

```sh
pnpm start
```

# Настройки переменных

В файлах `.env` и `.env.local` переменная EXPO_PUBLIC_API_URL отвечает за адрес сервера

# Сборка apk

```sh
eas build -p android --profile preview
```