import axios from "axios";

/**
 * Скрипт для получения последних обновлений от Telegram бота
 * Используется для определения Chat ID
 */
async function getTelegramUpdates() {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  if (!botToken) {
    console.log("❌ TELEGRAM_BOT_TOKEN не настроен");
    return;
  }

  console.log("📡 Получение последних обновлений от Telegram бота...\n");

  try {
    const response = await axios.get(
      `https://api.telegram.org/bot${botToken}/getUpdates`
    );

    if (response.data?.ok && response.data.result?.length > 0) {
      console.log(`✅ Найдено ${response.data.result.length} обновлений:\n`);

      response.data.result.forEach((update: any, index: number) => {
        console.log(`--- Обновление #${index + 1} ---`);
        
        if (update.message) {
          const chat = update.message.chat;
          const from = update.message.from;
          
          console.log(`📧 Тип чата: ${chat.type}`);
          console.log(`💬 Chat ID: ${chat.id}`);
          
          if (chat.title) {
            console.log(`🏷️  Название: ${chat.title}`);
          }
          
          if (chat.username) {
            console.log(`🔗 Username: @${chat.username}`);
          }
          
          console.log(`👤 От: ${from.first_name} ${from.last_name || ""} (@${from.username || "нет"})`);
          console.log(`📝 Текст: ${update.message.text || "(нет текста)"}`);
        } else if (update.my_chat_member) {
          const chat = update.my_chat_member.chat;
          console.log(`🤖 Изменение статуса бота в чате`);
          console.log(`💬 Chat ID: ${chat.id}`);
          console.log(`📧 Тип чата: ${chat.type}`);
          
          if (chat.title) {
            console.log(`🏷️  Название: ${chat.title}`);
          }
        }
        
        console.log();
      });

      console.log("\n💡 Используйте эти Chat ID в переменных окружения:");
      console.log("   TELEGRAM_ADMIN_CHAT_ID - для личного чата с администратором");
      console.log("   TELEGRAM_CHECKINS_CHAT_ID - для группы/канала с заездами");
    } else {
      console.log("⚠️  Обновлений не найдено.");
      console.log("\n💡 Чтобы получить Chat ID:");
      console.log("   1. Отправьте боту @Drewnoo_bot любое сообщение в личку");
      console.log("   2. Добавьте бота в группу/канал и отправьте там сообщение");
      console.log("   3. Запустите этот скрипт снова");
    }
  } catch (error: any) {
    console.log(`❌ Ошибка: ${error.message}`);
  }
}

getTelegramUpdates().catch(console.error);
