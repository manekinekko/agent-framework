import {
  OpenAIChatClient,
  useObservability,
  setupObservability,
  getTracer,
  OtelAttr,
} from '@microsoft/agent-framework';
import { trace, SpanStatusCode } from '@opentelemetry/api';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { ConsoleSpanExporter, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';

/**
 * OpenTelemetry Observability Example
 * 
 * This sample demonstrates how to use OpenTelemetry for observability:
 * - Setting up telemetry
 * - Instrumenting agents
 * - Creating custom spans
 * - Viewing trace data
 */

// Set up OpenTelemetry with console exporter (for demo purposes)
function setupTelemetry() {
  const provider = new NodeTracerProvider();
  
  // Use console exporter to see spans in the console
  provider.addSpanProcessor(
    new SimpleSpanProcessor(new ConsoleSpanExporter())
  );
  
  provider.register();
  
  console.log('✓ OpenTelemetry configured with console exporter\n');
}

async function basicObservability() {
  console.log('=== Basic Observability Example ===\n');

  // Set up telemetry
  setupTelemetry();

  // Configure agent framework observability
  setupObservability({
    enabled: true,
    captureMessageContent: true, // Enable for demo (be careful with sensitive data)
  });

  // Create a client and agent
  const client = new OpenAIChatClient({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const agent = client.createAgent({
    name: 'TracedAgent',
    instructions: 'You are a helpful assistant.',
    model: 'gpt-4o-mini',
  });

  // Wrap the agent with observability
  const observableAgent = useObservability(agent);

  // Run the agent - this will automatically create spans
  console.log('Running agent with observability...\n');
  const response = await observableAgent.run('What is 2 + 2?');
  
  console.log(`\nResponse: ${response.text}`);
  console.log('\n(Check the console output above for span data)\n');
}

async function customSpans() {
  console.log('=== Custom Spans Example ===\n');

  setupTelemetry();
  
  setupObservability({ enabled: true });

  const client = new OpenAIChatClient({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const agent = useObservability(
    client.createAgent({
      name: 'MathAgent',
      instructions: 'You help solve math problems.',
      model: 'gpt-4o-mini',
    })
  );

  // Create a custom span for your application logic
  const tracer = getTracer();
  
  await tracer.startActiveSpan('solve_math_problem', async (span) => {
    try {
      span.setAttribute('problem.type', 'arithmetic');
      span.setAttribute('problem.difficulty', 'easy');
      
      span.addEvent('problem_received');
      
      // The agent call will be a child span
      const response = await agent.run('Calculate 15 * 23');
      
      span.addEvent('problem_solved');
      span.setStatus({ code: SpanStatusCode.OK });
      
      console.log(`Solution: ${response.text}`);
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({ code: SpanStatusCode.ERROR });
      throw error;
    } finally {
      span.end();
    }
  });
}

async function streamingObservability() {
  console.log('\n=== Streaming with Observability ===\n');

  setupTelemetry();
  
  setupObservability({ enabled: true });

  const client = new OpenAIChatClient({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const agent = useObservability(
    client.createAgent({
      name: 'StreamingAgent',
      instructions: 'You are a helpful assistant.',
      model: 'gpt-4o-mini',
    })
  );

  console.log('Streaming response with telemetry:\n');
  
  // Streaming also creates spans with chunk events
  for await (const update of agent.runStream('Count from 1 to 5')) {
    if (update.text) {
      process.stdout.write(update.text);
    }
  }
  
  console.log('\n\n(Check console output for streaming span data)\n');
}

async function main() {
  console.log('=== OpenTelemetry Observability Examples ===\n');
  
  // Note: In production, you would typically:
  // 1. Use a proper exporter (OTLP, Jaeger, Zipkin, etc.)
  // 2. Configure resource attributes
  // 3. Set up proper sampling
  // 4. Connect to an observability backend
  
  await basicObservability();
  await customSpans();
  await streamingObservability();
  
  console.log('=== All Examples Complete ===');
  console.log('\nTip: For production use, configure a proper OpenTelemetry exporter');
  console.log('to send telemetry to Azure Monitor, Jaeger, or other backends.');
}

main().catch(console.error);
