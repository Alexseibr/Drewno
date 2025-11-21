import axios from "axios";

async function testTelegramDirectly() {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
  const checkinsChatId = process.env.TELEGRAM_CHECKINS_CHAT_ID;

  console.log("🧪 Прямой тест Telegram Bot API:\n");
  console.log(`Bot Token: ${botToken ? "✅ Настроен" : "❌ Отсутствует"}`);
  console.log(`Admin Chat ID: ${adminChatId}`);
  console.log(`Checkins Chat ID: ${checkinsChatId}\n`);

  if (!botToken) {
    console.log("❌ TELEGRAM_BOT_TOKEN не настроен");
    return;
  }

  // Тест 1: getMe - проверка бота
  console.log("📡 Тест 1: Проверка подключения к боту (getMe)");
  try {
    const getMeResponse = await axios.get(
      `https://api.telegram.org/bot${botToken}/getMe`
    );
    if (getMeResponse.data?.ok) {
      console.log(`✅ Бот найден: @${getMeResponse.data.result.username}`);
      console.log(`   ID: ${getMeResponse.data.result.id}`);
      console.log(`   Имя: ${getMeResponse.data.result.first_name}\n`);
    }
  } catch (error: any) {
    console.log(`❌ Ошибка: ${error.message}\n`);
  }

  // Тест 2: Отправка сообщения в админский чат
  if (adminChatId) {
    console.log(`📡 Тест 2: Отправка тестового сообщения в админский чат (${adminChatId})`);
    try {
      const sendResponse = await axios.post(
        `https://api.telegram.org/bot${botToken}/sendMessage`,
        {
          chat_id: adminChatId,
          text: "🧪 Тестовое сообщение от Drewno Automation",
        }
      );

      if (sendResponse.data?.ok) {
        console.log(`✅ Сообщение отправлено!`);
        console.log(`   Message ID: ${sendResponse.data.result.message_id}\n`);
      } else {
        console.log(`❌ Ошибка API:`, sendResponse.data);
      }
    } catch (error: any) {
      console.log(`❌ Ошибка: ${error.message}`);
      if (error.response?.data) {
        console.log(`   Детали:`, error.response.data);
      }
      console.log();
    }
  }

  // Тест 3: Отправка сообщения в чат заездов
  if (checkinsChatId) {
    console.log(`📡 Тест 3: Отправка тестового сообщения в чат заездов (${checkinsChatId})`);
    try {
      const sendResponse = await axios.post(
        `https://api.telegram.org/bot${botToken}/sendMessage`,
        {
          chat_id: checkinsChatId,
          text: "🧪 Тестовое сообщение от Drewno Automation",
        }
      );

      if (sendResponse.data?.ok) {
        console.log(`✅ Сообщение отправлено!`);
        console.log(`   Message ID: ${sendResponse.data.result.message_id}\n`);
      } else {
        console.log(`❌ Ошибка API:`, sendResponse.data);
      }
    } catch (error: any) {
      console.log(`❌ Ошибка: ${error.message}`);
      if (error.response?.data) {
        console.log(`   Детали:`, error.response.data);
      }
      console.log();
    }
  }

  console.log("✨ Тестирование завершено!");
}

testTelegramDirectly().catch(console.error);
