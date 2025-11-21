import { drewnoReportsWorkflow } from "./src/mastra/workflows/drewnoReportsWorkflow";

async function testWorkflow() {
  console.log("🧪 Тестирование workflow Drewno Daily Reports...\n");

  try {
    const run = await drewnoReportsWorkflow.createRunAsync();
    console.log("✅ Workflow run создан успешно");
    console.log("🚀 Запуск workflow...\n");

    const result = await run.start({ inputData: {} });

    console.log("\n📊 Результаты выполнения:");
    console.log(JSON.stringify(result, null, 2));
  } catch (error: any) {
    console.error("❌ Ошибка при выполнении workflow:", error.message);
    console.error(error.stack);
  }
}

testWorkflow();
