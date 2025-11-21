import axios from "axios";

async function testNewTelegramIds() {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID_NEW;
  const checkinsChatId = process.env.TELEGRAM_CHECKINS_CHAT_ID_NEW;

  console.log("🧪 Тестирование отправки с новыми Chat ID:\n");
  console.log(`Bot Token: ${botToken ? "✅ Настроен" : "❌ Отсутствует"}`);
  console.log(`Admin Chat ID (NEW): ${adminChatId || "❌ Отсутствует"}`);
  console.log(`Checkins Chat ID (NEW): ${checkinsChatId || "❌ Отсутствует"}\n`);

  if (!botToken) {
    console.log("❌ TELEGRAM_BOT_TOKEN не настроен");
    return;
  }

  // Тест 1: Отправка в админский чат
  if (adminChatId) {
    console.log(`📤 Тест 1: Отправка в личный чат администратора (${adminChatId})`);
    try {
      const response = await axios.post(
        `https://api.telegram.org/bot${botToken}/sendMessage`,
        {
          chat_id: adminChatId,
          text: "🌅 Тестовый утренний отчёт DREWNO\n\nЭто проверка работы автоматизации!\n✅ Бот настроен правильно.",
        }
      );

      if (response.data?.ok) {
        console.log(`   ✅ Сообщение успешно отправлено!`);
        console.log(`   Message ID: ${response.data.result.message_id}\n`);
      }
    } catch (error: any) {
      console.log(`   ❌ Ошибка: ${error.message}`);
      if (error.response?.data) {
        console.log(`   Детали:`, error.response.data);
      }
      console.log();
    }
  } else {
    console.log("⚠️ TELEGRAM_ADMIN_CHAT_ID_NEW не настроен\n");
  }

  // Тест 2: Отправка в группу заездов
  if (checkinsChatId) {
    console.log(`📤 Тест 2: Отправка в группу заездов (${checkinsChatId})`);
    try {
      const response = await axios.post(
        `https://api.telegram.org/bot${botToken}/sendMessage`,
        {
          chat_id: checkinsChatId,
          text: "🏡 Тестовый отчёт о заездах DREWNO\n\nЭто проверка работы автоматизации!\n✅ Бот настроен правильно.",
        }
      );

      if (response.data?.ok) {
        console.log(`   ✅ Сообщение успешно отправлено!`);
        console.log(`   Message ID: ${response.data.result.message_id}\n`);
      }
    } catch (error: any) {
      console.log(`   ❌ Ошибка: ${error.message}`);
      if (error.response?.data) {
        console.log(`   Детали:`, error.response.data);
      }
      console.log();
    }
  } else {
    console.log("⚠️ TELEGRAM_CHECKINS_CHAT_ID_NEW не настроен\n");
  }

  console.log("✨ Тестирование завершено!");
}

testNewTelegramIds().catch(console.error);
