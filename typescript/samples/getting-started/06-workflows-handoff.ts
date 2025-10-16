import { OpenAIChatClient, createHandOffWorkflow } from '@microsoft/agent-framework';

/**
 * Workflow with HandOff Pattern Example
 * 
 * This sample demonstrates how to use workflows to orchestrate multiple agents
 * in a sequential HandOff pattern, where one agent hands control to the next.
 * 
 * This is useful for multi-stage processing where each agent has a specific role.
 */

async function main() {
  console.log('=== Workflow with HandOff Pattern Example ===\n');

  // Create a client
  const client = new OpenAIChatClient({
    apiKey: process.env.OPENAI_API_KEY,
  });

  // Create specialized agents
  const writerAgent = client.createAgent({
    name: 'writer',
    instructions: 'You are an excellent content writer. Create engaging and informative content.',
    model: 'gpt-4o-mini',
  });

  const reviewerAgent = client.createAgent({
    name: 'reviewer',
    instructions: 'You are a content reviewer. Provide constructive feedback on the content.',
    model: 'gpt-4o-mini',
  });

  const editorAgent = client.createAgent({
    name: 'editor',
    instructions: 'You are an editor. Polish the content based on the feedback received.',
    model: 'gpt-4o-mini',
  });

  // Create a HandOff workflow: writer -> reviewer -> editor
  const workflow = createHandOffWorkflow(
    [writerAgent, reviewerAgent, editorAgent],
    {
      name: 'Content Creation Workflow',
      description: 'A workflow for creating, reviewing, and editing content',
    }
  );

  // Run the workflow
  console.log('User: Create a product description for a smart water bottle');
  console.log('\nRunning workflow...\n');
  
  const result = await workflow.run('Create a product description for a smart water bottle that tracks hydration');

  // Display results
  console.log('=== Workflow Results ===\n');
  console.log(`Final State: ${result.state}`);
  console.log(`\nOutputs (${result.outputs.length}):`);
  
  result.outputs.forEach((output, index) => {
    console.log(`\nOutput ${index + 1}:`);
    console.log(output);
  });

  // Display events
  console.log('\n=== Workflow Events ===\n');
  for (const event of result.events) {
    if (event.type === 'executor.invoked') {
      console.log(`→ ${event.executorId} started`);
    } else if (event.type === 'executor.completed') {
      console.log(`✓ ${event.executorId} completed`);
    }
  }
}

main().catch(console.error);
