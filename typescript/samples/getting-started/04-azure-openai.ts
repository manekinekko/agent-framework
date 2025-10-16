import { AzureOpenAIChatClient } from '@microsoft/agent-framework';
import { DefaultAzureCredential } from '@azure/identity';

/**
 * Azure OpenAI Example
 * 
 * This sample demonstrates how to use the Azure OpenAI client with Azure AD authentication.
 */

async function main() {
  console.log('=== Azure OpenAI Example ===\n');

  // Get configuration from environment variables
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4o-mini';

  if (!endpoint) {
    console.error('Please set AZURE_OPENAI_ENDPOINT environment variable');
    process.exit(1);
  }

  // Create a client with Azure AD authentication
  const client = new AzureOpenAIChatClient({
    endpoint,
    deploymentName,
    credential: new DefaultAzureCredential(),
  });

  // Create an agent
  const agent = client.createAgent({
    name: 'HaikuBot',
    instructions: 'You are an upbeat assistant that writes beautifully.',
  });

  // Run the agent
  console.log('User: Write a haiku about Microsoft Azure.');
  const response = await agent.run('Write a haiku about Microsoft Azure.');
  console.log(`Agent: ${response.text}\n`);

  // Example with streaming
  console.log('User: Write another haiku about cloud computing.');
  console.log('Agent: ');
  for await (const update of agent.runStream('Write another haiku about cloud computing.')) {
    if (update.text) {
      process.stdout.write(update.text);
    }
  }
  console.log('\n');
}

main().catch(console.error);
