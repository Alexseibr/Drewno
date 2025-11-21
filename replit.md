# Overview

This is an agent-stack-mastra project built on the Mastra framework - a TypeScript-based platform for creating AI-powered agents, workflows, and automations. The system integrates with multiple LLM providers (OpenAI, Anthropic, etc.) and uses PostgreSQL/LibSQL for persistent storage. It's designed to run automated workflows triggered by time-based schedules or webhooks from third-party services like Slack and Telegram.

The project includes a custom "Drewno Daily Reports" workflow that generates and sends automated reports, likely for property management or booking systems based on the Bnovo integration.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Core Framework Components

**Mastra Framework**: The application is built on Mastra v0.20.0, which provides the foundational abstractions for agents, workflows, tools, and memory management. All AI capabilities flow through this framework's unified API.

**Workflow Engine**: Uses Mastra's graph-based workflow system for deterministic, multi-step processes. Workflows are composed of steps with defined input/output schemas using Zod for type safety. The system supports branching, parallel execution, suspend/resume for human-in-the-loop interactions, and step-level retry policies.

**Agent System**: Agents use LLMs to perform open-ended reasoning tasks. The drewnoReportsAgent demonstrates the agent pattern with custom instructions and tool integration. Agents can be composed as workflow steps or called directly within step execution logic.

**Inngest Integration**: For production durability, workflows run through Inngest (`@mastra/inngest`), which provides step memoization, automatic retries, and execution monitoring. This ensures workflows can recover from failures without losing progress. The integration is centralized in `src/mastra/inngest/` with custom configuration for the Replit deployment environment.

## Data Layer

**Storage Strategy**: The application uses a shared PostgreSQL storage instance (`sharedPostgresStorage` in `src/mastra/storage`) configured through `@mastra/pg`. This provides persistence for agent memory, workflow state, and conversation threads.

**Memory Architecture**: Agents use Mastra's Memory system with three components:
- Working memory for persistent user data and preferences
- Conversation history for recent message context
- Semantic recall using vector embeddings for long-term memory retrieval

Memory can be scoped per-thread (conversation-level) or per-resource (user-level across all conversations).

**Vector Storage**: The system supports pgvector extension for semantic search capabilities, enabling agents to recall relevant information from past interactions.

## LLM Provider Strategy

**Multi-Provider Support**: The application integrates with multiple LLM providers through Mastra's unified model router:
- OpenAI (GPT-4o, GPT-4o-mini) via `@ai-sdk/openai`
- OpenRouter for access to various models via `@openrouter/ai-sdk-provider`
- Vercel AI SDK v4.3.16 for streaming and generation

**Model Selection**: Models are specified as `"provider/model-name"` strings (e.g., `"openai/gpt-4o-mini"`). The framework automatically handles API key detection and request routing.

## Webhook Trigger System

**Trigger Architecture**: The application supports webhook-based workflow triggers from third-party services. Triggers are defined in `src/triggers/` with a consistent pattern:
- Each connector has its own trigger file (e.g., `slackTriggers.ts`, `telegramTriggers.ts`)
- Triggers register API routes that accept webhook payloads
- Full payloads are passed to handlers, allowing consumers to extract needed data
- Triggers are registered in `src/mastra/index.ts` via the Inngest serve function

**Example Integrations**:
- Slack: Handles message events from channels with SSE streaming for real-time responses
- Telegram: Processes incoming messages with user/message parameters extracted from payload
- Generic connector pattern documented in `exampleConnectorTrigger.ts`

## Logging and Observability

**Custom Logger Implementation**: ProductionPinoLogger extends MastraLogger using Pino for structured logging with JSON output, ISO timestamps, and configurable log levels. This provides production-ready observability while maintaining Mastra's logger interface.

**Playground UI**: Mastra includes a built-in playground UI for development that provides:
- Visual workflow graph inspection with plain English node descriptions
- Agent interaction testing (note: requires `.generateLegacy()` for backward compatibility)
- Real-time execution monitoring
- The UI is user-facing only - the Replit Agent cannot interact with it

## Tool System

**Tool Pattern**: Tools extend agent capabilities beyond text generation by providing structured functions for API calls, database queries, or custom operations. Each tool defines:
- Input schema (Zod) for validation
- Output schema for type-safe results
- Execute function with access to Mastra context
- Description for agent decision-making

**Example Tools**: The codebase includes tools for:
- Bnovo booking system integration (`bnovoTools.ts`)
- Report formatting (`reportFormattingTools.ts`)
- Telegram messaging (`telegramTools.ts`)

## Deployment Configuration

**Node Version**: Requires Node.js >=20.9.0 as specified in package.json engines

**TypeScript Setup**: ES2022 target with module bundler resolution, strict mode enabled

**Build System**: Uses TSX for development (`tsx` package) and Mastra CLI for builds (`mastra build`, `mastra dev`)

**Environment Management**: Configuration via dotenv for API keys and service credentials

# External Dependencies

## AI & LLM Services
- **OpenAI**: Primary LLM provider for GPT-4o models (requires `OPENAI_API_KEY`)
- **Anthropic**: Alternative LLM provider (requires `ANTHROPIC_API_KEY`)
- **OpenRouter**: Multi-model gateway for accessing various LLM providers

## Database & Storage
- **PostgreSQL**: Primary database with pgvector extension for vector storage (requires `DATABASE_URL`)
- **LibSQL**: Alternative lightweight SQL database option via `@mastra/libsql`
- **Upstash**: Optional Redis and Vector storage via `@mastra/upstash`

## Messaging & Communication Platforms
- **Slack**: Integration via `@slack/web-api` for webhook triggers and messaging
- **Telegram**: Bot integration for receiving and sending messages (requires `TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_USERNAME`)

## Workflow Infrastructure
- **Inngest**: Durable execution engine for workflows with retry logic and monitoring (requires `INNGEST_API_KEY` for production)
- **Inngest Realtime**: Real-time event streaming via `@inngest/realtime`

## Booking System Integration
- **Bnovo**: Property management/booking system integration (credentials required for `getBnovoBookingsCreatedBetween`, `getBnovoBookingsByArrivalDate` tools)

## Search & Discovery
- **Exa**: Search API integration via `exa-js` package

## Development Tools
- **Prettier**: Code formatting
- **TypeScript**: Type safety and compilation
- **Mastra CLI**: Framework tooling for development and builds