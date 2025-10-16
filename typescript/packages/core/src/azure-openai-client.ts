// Copyright (c) Microsoft. All rights reserved.

import { AzureOpenAI } from 'openai';
import type { TokenCredential } from '@azure/identity';
import { OpenAIChatAgent, type OpenAIChatAgentOptions } from './openai-client.js';

/**
 * Client for creating Azure OpenAI chat agents.
 */
export class AzureOpenAIChatClient {
  private readonly client: AzureOpenAI;
  private readonly deploymentName: string;

  constructor(options: {
    endpoint: string;
    deploymentName: string;
    credential?: TokenCredential;
    apiKey?: string;
    apiVersion?: string;
  }) {
    const endpoint = options.endpoint;
    const apiVersion = options.apiVersion ?? '2024-08-01-preview';

    if (options.credential) {
      // Use Azure AD authentication
      this.client = new AzureOpenAI({
        endpoint,
        apiVersion,
        azureADTokenProvider: async () => {
          const token = await options.credential!.getToken(
            'https://cognitiveservices.azure.com/.default'
          );
          return token?.token ?? '';
        },
      });
    } else if (options.apiKey) {
      // Use API key authentication
      this.client = new AzureOpenAI({
        endpoint,
        apiKey: options.apiKey,
        apiVersion,
      });
    } else {
      throw new Error('Either credential or apiKey must be provided');
    }

    this.deploymentName = options.deploymentName;
  }

  /**
   * Creates a new chat agent using the Azure OpenAI deployment.
   * @param options - Options for the agent
   * @returns A new OpenAIChatAgent configured for Azure OpenAI
   */
  createAgent(options: Omit<OpenAIChatAgentOptions, 'model'> = {}): OpenAIChatAgent {
    return new OpenAIChatAgent(this.client as any, {
      ...options,
      model: this.deploymentName,
    });
  }
}
