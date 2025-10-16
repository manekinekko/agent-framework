import {
  OpenAIChatClient,
  WorkflowBuilder,
  defineFunction,
  inferSchema,
} from '@microsoft/agent-framework';

/**
 * Custom Workflow Example
 * 
 * This sample demonstrates how to build custom workflows with:
 * - Multiple agents
 * - Custom functions
 * - Conditional edges
 * - Shared state
 */

async function main() {
  console.log('=== Custom Workflow Example ===\n');

  // Create a client
  const client = new OpenAIChatClient({
    apiKey: process.env.OPENAI_API_KEY,
  });

  // Create agents
  const classifierAgent = client.createAgent({
    name: 'classifier',
    instructions: 'You classify customer requests as either "technical" or "billing". Respond with ONLY the word "technical" or "billing".',
    model: 'gpt-4o-mini',
  });

  const technicalAgent = client.createAgent({
    name: 'technical',
    instructions: 'You are a technical support specialist. Provide helpful technical guidance.',
    model: 'gpt-4o-mini',
  });

  const billingAgent = client.createAgent({
    name: 'billing',
    instructions: 'You are a billing specialist. Help customers with payment and billing questions.',
    model: 'gpt-4o-mini',
  });

  // Create a summary function
  const summarize = defineFunction(
    'summarize',
    'Summarize the conversation',
    async (input, context) => {
      const summary = `Summary: Processed request and routed to appropriate specialist.`;
      context.output(summary);
      return summary;
    },
    inferSchema({})
  );

  // Build the workflow with conditional routing
  const workflow = new WorkflowBuilder()
    .setName('Customer Support Workflow')
    .setDescription('Routes customer requests to the right specialist')
    .setStartExecutor('classifier')
    .addExecutor('classifier', classifierAgent)
    .addExecutor('technical', technicalAgent)
    .addExecutor('billing', billingAgent)
    .addExecutor('summarize', summarize)
    // Route to technical if classified as technical
    .addEdge('classifier', 'technical', async (result) => {
      const classification = String(result).toLowerCase();
      return classification.includes('technical');
    })
    // Route to billing if classified as billing
    .addEdge('classifier', 'billing', async (result) => {
      const classification = String(result).toLowerCase();
      return classification.includes('billing');
    })
    // Both specialists route to summarize
    .addEdge('technical', 'summarize')
    .addEdge('billing', 'summarize')
    .build();

  // Test with technical request
  console.log('=== Test 1: Technical Request ===');
  console.log('User: My app keeps crashing when I try to sync\n');
  
  const result1 = await workflow.run('My app keeps crashing when I try to sync');
  console.log('Response:', result1.outputs[result1.outputs.length - 1]);

  console.log('\n=== Test 2: Billing Request ===');
  console.log('User: I was charged twice this month\n');
  
  const result2 = await workflow.run('I was charged twice this month');
  console.log('Response:', result2.outputs[result2.outputs.length - 1]);
}

main().catch(console.error);
