// ============================================
// AI Chat Pro Client - Internationalization
// Supported: en (English), de (Deutsch), ru (Русский)
// ============================================

(function () {
  "use strict";

  const TRANSLATIONS = {
    en: {
      // App
      "app.name": "AI Chat Pro Client",

      // Popup – sidebar
      "sidebar.newChat": "New Chat",
      "sidebar.searchPlaceholder": "Search chats...",
      "sidebar.settings": "Settings",
      "sidebar.openInTab": "Open in tab",
      "sidebar.toggleSidebar": "Toggle sidebar",

      // Popup – header
      "header.newChat": "New Chat",
      "header.editTitle": "Edit title",
      "header.exportChat": "Export chat",
      "header.clearChat": "Clear chat",

      // Popup – welcome
      "welcome.title": "Welcome to AI Chat Pro Client",
      "welcome.subtitle": "Ask a question or start a conversation with the AI.",
      "welcome.quantum": "Explain quantum computing",
      "welcome.code": "Write Python code",
      "welcome.aitrends": "AI Trends 2025",
      "welcome.resume": "Create a CV",
      "welcome.quantumPrompt": "Explain quantum computing in simple terms",
      "welcome.codePrompt": "Write me a Python function that calculates Fibonacci numbers",
      "welcome.aitrendsPrompt": "What are the latest trends in AI development?",
      "welcome.resumePrompt": "Help me create a professional resume",

      // Popup – input area
      "input.placeholder": "Enter message...",
      "input.hint": "Enter to send, Shift+Enter for new line",

      // Popup – export modal
      "export.title": "Export chat",
      "export.md": "Markdown (.md)",
      "export.mdDesc": "Formatted text with code blocks",
      "export.json": "JSON (.json)",
      "export.jsonDesc": "Structured data for import",

      // Popup – delete modal
      "delete.title": "Delete chat?",
      "delete.body":
        "Do you really want to delete this chat? This action cannot be undone.",
      "delete.cancel": "Cancel",
      "delete.confirm": "Delete",

      // Popup – rename modal
      "rename.title": "Rename chat",
      "rename.placeholder": "Chat title",
      "rename.cancel": "Cancel",
      "rename.confirm": "Rename",

      // Popup – dynamic strings
      "toast.copied": "Copied!",
      "toast.exportedMd": "Chat exported as Markdown.",
      "toast.exportedJson": "Chat exported as JSON.",
      "toast.noApiKey":
        "API key not configured. Please open Settings and enter your API key.",
      "toast.renamed": "Chat renamed.",
      "conv.newChat": "New Chat",
      "conv.rename": "Rename",
      "conv.delete": "Delete",

      // Options – navigation
      "nav.api": "API",
      "nav.model": "Model",
      "nav.appearance": "Appearance",
      "nav.behavior": "Behavior",
      "nav.messages": "Messages",
      "nav.data": "Data",

      // Options – API section
      "api.title": "API Configuration",
      "api.subtitle":
        "Select your AI provider and configure the API key and connection.",
      "api.provider": "AI Provider",
      "api.keyHelpText": "Where can I get a key?",
      "api.keyHint":
        "Your API key is stored locally in the extension and never shared with third parties.",
      "api.serverUrl": "Server URL",
      "api.serverHint":
        "URL of the LM Studio local server. Default: http://localhost:1234",
      "api.advanced": "Advanced",
      "api.baseUrl": "Base URL (optional)",
      "api.baseUrlHint":
        "Leave empty for the default endpoint. Only change for custom proxies or OpenAI-compatible APIs.",
      "api.connectionTest": "Connection test",
      "api.testBtn": "Test API",
      "api.testing": "Testing...",
      "api.successLmStudio":
        "Connection successful. LM Studio is reachable without an API key.",
      "api.successLmStudioKey":
        "Connection successful. Optional API key was accepted.",
      "api.success": "Connection successful! API key is valid.",
      "api.noKey": "Please enter an API key first.",
      "api.errorPrefix": "Error: ",
      "api.connError": "Connection error: ",

      // Options – Model section
      "model.title": "Model Settings",
      "model.subtitle": "Select the AI model and adjust parameters.",
      "model.select": "Model",
      "model.checkBtn": "Check models",
      "model.addLabel": "Add model manually",
      "model.addPlaceholder": "e.g. gpt-5, gemini-3.1-flash",
      "model.addTitle": "Add",
      "model.temp": "Temperature",
      "model.tempPrecise": "Precise",
      "model.tempCreative": "Creative",
      "model.maxTokens": "Max. Tokens",
      "model.systemPrompt": "System Prompt",
      "model.systemPromptPlaceholder": "Define the AI behavior...",
      "model.systemPromptHint":
        "Give the AI a role or specific instructions.",
      "model.lmLoad": "Load models from LM Studio",
      "model.lmLoading": "Loading models...",
      "model.lmNone":
        "No models found. Please load a model in LM Studio.",
      "model.lmHint":
        "Start LM Studio and click the refresh icon.",
      "model.lmFound": "{0} model(s) found.",
      "model.lmConnError":
        "Connection error: {0} — is LM Studio running?",
      "model.checkNoKey": "Please enter an API key first.",
      "model.checkLastRun": "Last check: {0}",
      "model.removeTitle": "Remove",

      // Options – Appearance section
      "appearance.title": "Appearance",
      "appearance.subtitle": "Customize the design to your preferences.",
      "appearance.theme": "Theme",
      "appearance.dark": "Dark",
      "appearance.light": "Light",
      "appearance.system": "System",
      "appearance.fontSize": "Font size",
      "appearance.fontSmall": "Small",
      "appearance.fontLarge": "Large",
      "appearance.language": "Language",

      // Options – Behavior section
      "behavior.title": "Behavior",
      "behavior.subtitle": "Adjust the extension behavior.",
      "behavior.sendEnter": "Send with Enter",
      "behavior.sendEnterHint":
        "Send message with Enter, Shift+Enter for new line.",
      "behavior.showSources": "Show sources",
      "behavior.showSourcesHint": "Show source links below AI responses.",

      // Options – Data section
      "data.title": "Data & Storage",
      "data.subtitle": "Manage your stored data.",
      "data.history": "Chat history",
      "data.chats": "Chats",
      "data.messages": "Messages",
      "data.exportLabel": "Export backup",
      "data.exportBtn": "Export backup as JSON",
      "data.importLabel": "Import backup",
      "data.importBtn": "Import backup...",
      "data.importSuccess": "Backup imported successfully.",
      "data.importError": "Invalid backup file.",
      "data.danger": "Danger zone",
      "data.clearAll": "Delete all chats",
      "data.clearHint": "This action cannot be undone.",
      "data.clearConfirm":
        "Really delete all chats? This action cannot be undone.",
      "data.clearDone": "All chats have been deleted.",
      "data.reset": "Reset settings",
      "data.resetHint": "Resets all settings to their default values.",
      "data.resetConfirm": "Really reset settings?",
      "data.resetDone": "Settings have been reset.",
      "data.noChatToExport": "No chats to export.",

      // Popup – conversation list & messages
      "conv.empty": "No chats available",
      "msg.you": "You",
      "msg.ai": "AI Chat Pro Client",
      "msg.sources": "Sources",
      "code.copy": "Copy",
      "code.copied": "Copied!",
      "time.justNow": "just now",
      "time.min": "{0} min.",
      "input.hintCtrl": "Ctrl+Enter to send, Enter for new line",
      "toast.chatDeleted": "Chat deleted.",
      "toast.exportedChat": "Chat exported!",
      "toast.noChatToExport": "No chat to export.",
      "toast.copyFailed": "Copy failed.",

      // Backend errors (translated in popup from background errorCode)
      "error.apiKeyMissing":
        "API key not configured. Please set it in the settings.",
      "error.connection": "Connection error: {0}",
      "error.api": "API error ({0}): {1}",
      "error.lmstudio": "LM Studio error ({0}): {1}",

      // Announcement banner
      "announcement.dismiss": "Dismiss",

      // Options – Messages section
      "messages.title": "Messages",
      "messages.subtitle":
        "Recent announcements from the developer. Messages you dismissed in the chat banner are still listed here.",
      "messages.empty": "No messages yet.",
      "messages.clear": "Clear message history",

      // Saved indicator
      "status.saved": "Saved",
    },

    de: {
      // App
      "app.name": "AI Chat Pro Client",

      // Popup – sidebar
      "sidebar.newChat": "Neuer Chat",
      "sidebar.searchPlaceholder": "Chats durchsuchen...",
      "sidebar.settings": "Einstellungen",
      "sidebar.openInTab": "In Tab öffnen",
      "sidebar.toggleSidebar": "Sidebar umschalten",

      // Popup – header
      "header.newChat": "Neuer Chat",
      "header.editTitle": "Titel bearbeiten",
      "header.exportChat": "Chat exportieren",
      "header.clearChat": "Chat löschen",

      // Popup – welcome
      "welcome.title": "Willkommen bei AI Chat Pro Client",
      "welcome.subtitle":
        "Stelle eine Frage oder starte eine Unterhaltung mit der KI.",
      "welcome.quantum": "Quantencomputing erklären",
      "welcome.code": "Python Code schreiben",
      "welcome.aitrends": "KI-Trends 2025",
      "welcome.resume": "Lebenslauf erstellen",
      "welcome.quantumPrompt":
        "Erkläre mir Quantencomputing in einfachen Worten",
      "welcome.codePrompt":
        "Schreibe mir eine Python Funktion die Fibonacci Zahlen berechnet",
      "welcome.aitrendsPrompt":
        "Was sind die neuesten Trends in der KI-Entwicklung?",
      "welcome.resumePrompt":
        "Hilf mir einen professionellen Lebenslauf zu erstellen",

      // Popup – input area
      "input.placeholder": "Nachricht eingeben...",
      "input.hint": "Enter zum Senden, Shift+Enter für neue Zeile",

      // Popup – export modal
      "export.title": "Chat exportieren",
      "export.md": "Markdown (.md)",
      "export.mdDesc": "Formatierter Text mit Code-Blöcken",
      "export.json": "JSON (.json)",
      "export.jsonDesc": "Strukturierte Daten zum Importieren",

      // Popup – delete modal
      "delete.title": "Chat löschen?",
      "delete.body":
        "Möchtest du diesen Chat wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.",
      "delete.cancel": "Abbrechen",
      "delete.confirm": "Löschen",

      // Popup – rename modal
      "rename.title": "Chat umbenennen",
      "rename.placeholder": "Chat-Titel",
      "rename.cancel": "Abbrechen",
      "rename.confirm": "Umbenennen",

      // Popup – dynamic strings
      "toast.copied": "Kopiert!",
      "toast.exportedMd": "Chat als Markdown exportiert.",
      "toast.exportedJson": "Chat als JSON exportiert.",
      "toast.noApiKey":
        "API Key nicht konfiguriert. Bitte öffne die Einstellungen und gib deinen API Key ein.",
      "toast.renamed": "Chat umbenannt.",
      "conv.newChat": "Neuer Chat",
      "conv.rename": "Umbenennen",
      "conv.delete": "Löschen",

      // Options – navigation
      "nav.api": "API",
      "nav.model": "Modell",
      "nav.appearance": "Darstellung",
      "nav.behavior": "Verhalten",
      "nav.messages": "Nachrichten",
      "nav.data": "Daten",

      // Options – API section
      "api.title": "API-Konfiguration",
      "api.subtitle":
        "Wähle deinen KI-Anbieter und konfiguriere API Key und Verbindung.",
      "api.provider": "KI-Anbieter",
      "api.keyHelpText": "Wo bekomme ich einen Key?",
      "api.keyHint":
        "Dein API Key wird lokal in der Extension gespeichert und nie an Dritte weitergegeben.",
      "api.serverUrl": "Server-URL",
      "api.serverHint":
        "URL des LM Studio lokalen Servers. Standard: http://localhost:1234",
      "api.advanced": "Erweitert",
      "api.baseUrl": "Basis-URL (optional)",
      "api.baseUrlHint":
        "Leer lassen für den Standard-Endpunkt. Nur für eigene Proxies oder OpenAI-kompatible APIs ändern.",
      "api.connectionTest": "Verbindungstest",
      "api.testBtn": "API testen",
      "api.testing": "Teste...",
      "api.successLmStudio":
        "Verbindung erfolgreich. LM Studio ist ohne API Key erreichbar.",
      "api.successLmStudioKey":
        "Verbindung erfolgreich. Optionaler API Key wurde akzeptiert.",
      "api.success": "Verbindung erfolgreich! API Key ist gültig.",
      "api.noKey": "Bitte gib zuerst einen API Key ein.",
      "api.errorPrefix": "Fehler: ",
      "api.connError": "Verbindungsfehler: ",

      // Options – Model section
      "model.title": "Modell-Einstellungen",
      "model.subtitle": "Wähle das KI-Modell und passe die Parameter an.",
      "model.select": "Modell",
      "model.checkBtn": "Modelle prüfen",
      "model.addLabel": "Modell manuell hinzufügen",
      "model.addPlaceholder": "z.B. gpt-5, gemini-3.1-flash",
      "model.addTitle": "Hinzufügen",
      "model.temp": "Temperature",
      "model.tempPrecise": "Präzise",
      "model.tempCreative": "Kreativ",
      "model.maxTokens": "Max. Tokens",
      "model.systemPrompt": "System Prompt",
      "model.systemPromptPlaceholder": "Definiere das Verhalten der KI...",
      "model.systemPromptHint":
        "Gib der KI eine Rolle oder spezifische Anweisungen.",
      "model.lmLoad": "Modelle von LM Studio laden",
      "model.lmLoading": "Lade Modelle...",
      "model.lmNone":
        "Keine Modelle gefunden. Bitte ein Modell in LM Studio laden.",
      "model.lmHint": "LM Studio starten und auf das Aktualisieren-Symbol klicken.",
      "model.lmFound": "{0} Modell(e) gefunden.",
      "model.lmConnError": "Verbindungsfehler: {0} — LM Studio gestartet?",
      "model.checkNoKey": "Bitte zuerst API Key eingeben.",
      "model.checkLastRun": "Letzte Prüfung: {0}",
      "model.removeTitle": "Entfernen",

      // Options – Appearance section
      "appearance.title": "Darstellung",
      "appearance.subtitle": "Passe das Design nach deinen Wünschen an.",
      "appearance.theme": "Theme",
      "appearance.dark": "Dark",
      "appearance.light": "Light",
      "appearance.system": "System",
      "appearance.fontSize": "Schriftgröße",
      "appearance.fontSmall": "Klein",
      "appearance.fontLarge": "Groß",
      "appearance.language": "Sprache",

      // Options – Behavior section
      "behavior.title": "Verhalten",
      "behavior.subtitle": "Passe das Verhalten der Extension an.",
      "behavior.sendEnter": "Mit Enter senden",
      "behavior.sendEnterHint":
        "Nachricht mit Enter senden, Shift+Enter für Zeilenumbruch.",
      "behavior.showSources": "Quellen anzeigen",
      "behavior.showSourcesHint":
        "Zeige Quellen-Links unter AI-Antworten an.",

      // Options – Data section
      "data.title": "Daten & Speicher",
      "data.subtitle": "Verwalte deine gespeicherten Daten.",
      "data.history": "Chat-Verlauf",
      "data.chats": "Chats",
      "data.messages": "Nachrichten",
      "data.exportLabel": "Backup exportieren",
      "data.exportBtn": "Backup als JSON exportieren",
      "data.importLabel": "Backup importieren",
      "data.importBtn": "Backup importieren...",
      "data.importSuccess": "Backup erfolgreich importiert.",
      "data.importError": "Ungültige Backup-Datei.",
      "data.danger": "Gefahrenzone",
      "data.clearAll": "Alle Chats löschen",
      "data.clearHint": "Diese Aktion kann nicht rückgängig gemacht werden.",
      "data.clearConfirm":
        "Alle Chats wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.",
      "data.clearDone": "Alle Chats wurden gelöscht.",
      "data.reset": "Einstellungen zurücksetzen",
      "data.resetHint": "Setzt alle Einstellungen auf die Standardwerte zurück.",
      "data.resetConfirm": "Einstellungen wirklich zurücksetzen?",
      "data.resetDone": "Einstellungen wurden zurückgesetzt.",
      "data.noChatToExport": "Keine Chats zum Exportieren.",

      // Popup – conversation list & messages
      "conv.empty": "Keine Chats vorhanden",
      "msg.you": "Du",
      "msg.ai": "AI Chat Pro Client",
      "msg.sources": "Quellen",
      "code.copy": "Kopieren",
      "code.copied": "Kopiert!",
      "time.justNow": "gerade eben",
      "time.min": "{0} Min.",
      "input.hintCtrl": "Ctrl+Enter zum Senden, Enter für neue Zeile",
      "toast.chatDeleted": "Chat gelöscht.",
      "toast.exportedChat": "Chat exportiert!",
      "toast.noChatToExport": "Kein Chat zum Exportieren.",
      "toast.copyFailed": "Kopieren fehlgeschlagen.",

      // Backend errors
      "error.apiKeyMissing":
        "API Key nicht konfiguriert. Bitte in den Einstellungen hinterlegen.",
      "error.connection": "Verbindungsfehler: {0}",
      "error.api": "API Fehler ({0}): {1}",
      "error.lmstudio": "LM Studio Fehler ({0}): {1}",

      // Announcement banner
      "announcement.dismiss": "Ausblenden",

      // Options – Messages section
      "messages.title": "Nachrichten",
      "messages.subtitle":
        "Aktuelle Mitteilungen des Entwicklers. Nachrichten, die du im Chat-Banner weggeklickt hast, findest du hier weiterhin.",
      "messages.empty": "Noch keine Nachrichten.",
      "messages.clear": "Nachrichtenverlauf löschen",

      // Saved indicator
      "status.saved": "Gespeichert",
    },

    ru: {
      // App
      "app.name": "AI Chat Pro Client",

      // Popup – sidebar
      "sidebar.newChat": "Новый чат",
      "sidebar.searchPlaceholder": "Поиск чатов...",
      "sidebar.settings": "Настройки",
      "sidebar.openInTab": "Открыть в вкладке",
      "sidebar.toggleSidebar": "Переключить боковую панель",

      // Popup – header
      "header.newChat": "Новый чат",
      "header.editTitle": "Редактировать название",
      "header.exportChat": "Экспортировать чат",
      "header.clearChat": "Очистить чат",

      // Popup – welcome
      "welcome.title": "Добро пожаловать в AI Chat Pro Client",
      "welcome.subtitle": "Задайте вопрос или начните разговор с ИИ.",
      "welcome.quantum": "Объяснить квантовые вычисления",
      "welcome.code": "Написать код на Python",
      "welcome.aitrends": "Тренды ИИ 2025",
      "welcome.resume": "Создать резюме",
      "welcome.quantumPrompt":
        "Объясни мне квантовые вычисления простыми словами",
      "welcome.codePrompt":
        "Напиши функцию на Python, которая вычисляет числа Фибоначчи",
      "welcome.aitrendsPrompt":
        "Каковы последние тенденции в развитии ИИ?",
      "welcome.resumePrompt": "Помоги мне создать профессиональное резюме",

      // Popup – input area
      "input.placeholder": "Введите сообщение...",
      "input.hint": "Enter для отправки, Shift+Enter для новой строки",

      // Popup – export modal
      "export.title": "Экспортировать чат",
      "export.md": "Markdown (.md)",
      "export.mdDesc": "Форматированный текст с блоками кода",
      "export.json": "JSON (.json)",
      "export.jsonDesc": "Структурированные данные для импорта",

      // Popup – delete modal
      "delete.title": "Удалить чат?",
      "delete.body":
        "Вы действительно хотите удалить этот чат? Это действие нельзя отменить.",
      "delete.cancel": "Отмена",
      "delete.confirm": "Удалить",

      // Popup – rename modal
      "rename.title": "Переименовать чат",
      "rename.placeholder": "Название чата",
      "rename.cancel": "Отмена",
      "rename.confirm": "Переименовать",

      // Popup – dynamic strings
      "toast.copied": "Скопировано!",
      "toast.exportedMd": "Чат экспортирован как Markdown.",
      "toast.exportedJson": "Чат экспортирован как JSON.",
      "toast.noApiKey":
        "API-ключ не настроен. Откройте настройки и введите API-ключ.",
      "toast.renamed": "Чат переименован.",
      "conv.newChat": "Новый чат",
      "conv.rename": "Переименовать",
      "conv.delete": "Удалить",

      // Options – navigation
      "nav.api": "API",
      "nav.model": "Модель",
      "nav.appearance": "Внешний вид",
      "nav.behavior": "Поведение",
      "nav.messages": "Сообщения",
      "nav.data": "Данные",

      // Options – API section
      "api.title": "Настройка API",
      "api.subtitle":
        "Выберите провайдера ИИ и настройте API-ключ и соединение.",
      "api.provider": "Провайдер ИИ",
      "api.keyHelpText": "Где получить ключ?",
      "api.keyHint":
        "Ваш API-ключ хранится локально в расширении и никогда не передаётся третьим лицам.",
      "api.serverUrl": "URL сервера",
      "api.serverHint":
        "URL локального сервера LM Studio. По умолчанию: http://localhost:1234",
      "api.advanced": "Дополнительно",
      "api.baseUrl": "Базовый URL (необязательно)",
      "api.baseUrlHint":
        "Оставьте пустым для стандартного адреса. Изменяйте только для собственных прокси или OpenAI-совместимых API.",
      "api.connectionTest": "Тест соединения",
      "api.testBtn": "Тестировать API",
      "api.testing": "Тестирование...",
      "api.successLmStudio":
        "Соединение успешно. LM Studio доступен без API-ключа.",
      "api.successLmStudioKey":
        "Соединение успешно. Необязательный API-ключ принят.",
      "api.success": "Соединение успешно! API-ключ действителен.",
      "api.noKey": "Пожалуйста, сначала введите API-ключ.",
      "api.errorPrefix": "Ошибка: ",
      "api.connError": "Ошибка соединения: ",

      // Options – Model section
      "model.title": "Настройки модели",
      "model.subtitle": "Выберите модель ИИ и настройте параметры.",
      "model.select": "Модель",
      "model.checkBtn": "Проверить модели",
      "model.addLabel": "Добавить модель вручную",
      "model.addPlaceholder": "напр. gpt-5, gemini-3.1-flash",
      "model.addTitle": "Добавить",
      "model.temp": "Температура",
      "model.tempPrecise": "Точно",
      "model.tempCreative": "Творчески",
      "model.maxTokens": "Макс. токенов",
      "model.systemPrompt": "Системный промпт",
      "model.systemPromptPlaceholder": "Определите поведение ИИ...",
      "model.systemPromptHint":
        "Дайте ИИ роль или конкретные инструкции.",
      "model.lmLoad": "Загрузить модели из LM Studio",
      "model.lmLoading": "Загрузка моделей...",
      "model.lmNone":
        "Модели не найдены. Пожалуйста, загрузите модель в LM Studio.",
      "model.lmHint": "Запустите LM Studio и нажмите значок обновления.",
      "model.lmFound": "Найдено моделей: {0}.",
      "model.lmConnError": "Ошибка соединения: {0} — LM Studio запущен?",
      "model.checkNoKey": "Пожалуйста, сначала введите API-ключ.",
      "model.checkLastRun": "Последняя проверка: {0}",
      "model.removeTitle": "Удалить",

      // Options – Appearance section
      "appearance.title": "Внешний вид",
      "appearance.subtitle": "Настройте внешний вид по своему вкусу.",
      "appearance.theme": "Тема",
      "appearance.dark": "Тёмная",
      "appearance.light": "Светлая",
      "appearance.system": "Системная",
      "appearance.fontSize": "Размер шрифта",
      "appearance.fontSmall": "Маленький",
      "appearance.fontLarge": "Большой",
      "appearance.language": "Язык",

      // Options – Behavior section
      "behavior.title": "Поведение",
      "behavior.subtitle": "Настройте поведение расширения.",
      "behavior.sendEnter": "Отправлять через Enter",
      "behavior.sendEnterHint":
        "Отправлять сообщение клавишей Enter, Shift+Enter для новой строки.",
      "behavior.showSources": "Показывать источники",
      "behavior.showSourcesHint":
        "Показывать ссылки на источники под ответами ИИ.",

      // Options – Data section
      "data.title": "Данные и хранилище",
      "data.subtitle": "Управляйте сохранёнными данными.",
      "data.history": "История чатов",
      "data.chats": "Чаты",
      "data.messages": "Сообщения",
      "data.exportLabel": "Экспортировать резервную копию",
      "data.exportBtn": "Экспортировать резервную копию в JSON",
      "data.importLabel": "Импортировать резервную копию",
      "data.importBtn": "Импортировать резервную копию...",
      "data.importSuccess": "Резервная копия успешно импортирована.",
      "data.importError": "Недопустимый файл резервной копии.",
      "data.danger": "Опасная зона",
      "data.clearAll": "Удалить все чаты",
      "data.clearHint": "Это действие нельзя отменить.",
      "data.clearConfirm":
        "Действительно удалить все чаты? Это действие нельзя отменить.",
      "data.clearDone": "Все чаты удалены.",
      "data.reset": "Сбросить настройки",
      "data.resetHint": "Сбрасывает все настройки до значений по умолчанию.",
      "data.resetConfirm": "Действительно сбросить настройки?",
      "data.resetDone": "Настройки сброшены.",
      "data.noChatToExport": "Нет чатов для экспорта.",

      // Popup – conversation list & messages
      "conv.empty": "Нет чатов",
      "msg.you": "Вы",
      "msg.ai": "AI Chat Pro Client",
      "msg.sources": "Источники",
      "code.copy": "Копировать",
      "code.copied": "Скопировано!",
      "time.justNow": "только что",
      "time.min": "{0} мин.",
      "input.hintCtrl": "Ctrl+Enter для отправки, Enter для новой строки",
      "toast.chatDeleted": "Чат удалён.",
      "toast.exportedChat": "Чат экспортирован!",
      "toast.noChatToExport": "Нет чата для экспорта.",
      "toast.copyFailed": "Ошибка копирования.",

      // Backend errors
      "error.apiKeyMissing":
        "API-ключ не настроен. Укажите его в настройках.",
      "error.connection": "Ошибка соединения: {0}",
      "error.api": "Ошибка API ({0}): {1}",
      "error.lmstudio": "Ошибка LM Studio ({0}): {1}",

      // Announcement banner
      "announcement.dismiss": "Скрыть",

      // Options – Messages section
      "messages.title": "Сообщения",
      "messages.subtitle":
        "Последние объявления от разработчика. Сообщения, которые вы скрыли в баннере чата, по-прежнему доступны здесь.",
      "messages.empty": "Сообщений пока нет.",
      "messages.clear": "Очистить историю сообщений",

      // Saved indicator
      "status.saved": "Сохранено",
    },
  };

  /**
   * Determine current language.
   * Priority: localStorage → navigator.language → "en"
   */
  function i18nGetLang() {
    const stored = localStorage.getItem("ai-chat-lang");
    if (stored && TRANSLATIONS[stored]) return stored;
    const nav = (navigator.language || "en").substring(0, 2).toLowerCase();
    return TRANSLATIONS[nav] ? nav : "en";
  }

  /**
   * Translate a key. Supports {0}, {1}, … placeholders.
   */
  function t(key) {
    const lang = i18nGetLang();
    const dict = TRANSLATIONS[lang] || TRANSLATIONS["en"];
    let str = dict[key] ?? TRANSLATIONS["en"][key] ?? key;
    for (let i = 1; i < arguments.length; i++) {
      str = str.replace("{" + (i - 1) + "}", arguments[i]);
    }
    return str;
  }

  /**
   * Apply translations to all elements with data-i18n* attributes under `root`.
   * - data-i18n        → textContent
   * - data-i18n-html   → innerHTML (use carefully)
   * - data-i18n-placeholder → placeholder attribute
   * - data-i18n-title  → title attribute
   */
  function applyTranslations(root) {
    root = root || document;
    root.querySelectorAll("[data-i18n]").forEach(function (el) {
      el.textContent = t(el.dataset.i18n);
    });
    root.querySelectorAll("[data-i18n-placeholder]").forEach(function (el) {
      el.placeholder = t(el.dataset.i18nPlaceholder);
    });
    root.querySelectorAll("[data-i18n-title]").forEach(function (el) {
      el.title = t(el.dataset.i18nTitle);
    });
  }

  /**
   * Set language, persist to localStorage, and re-apply translations.
   */
  function setLang(lang) {
    if (!TRANSLATIONS[lang]) return;
    localStorage.setItem("ai-chat-lang", lang);
    applyTranslations();
  }

  // Expose globally
  window.i18n = { t, applyTranslations, setLang, i18nGetLang, TRANSLATIONS };
})();
