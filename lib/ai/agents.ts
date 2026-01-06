import OpenAI from 'openai'
import { searchKnowledge } from './knowledge'

let openai: OpenAI | null = null

export function getOpenAI(): OpenAI {
  if (!openai) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }
  return openai
}

export type AgentType = 'owner' | 'cleaner'

interface AgentConfig {
  name: string
  description: string
  basePrompt: string
}

// Compact base prompts - knowledge base provides the details
export const AGENT_CONFIGS: Record<AgentType, AgentConfig> = {
  owner: {
    name: 'Villa Assistant',
    description: 'Your personal assistant for managing your villas and bookings',
    basePrompt: `You are Villa Assistant for Alicante Cleaners, helping villa owners manage their properties and bookings.

Be friendly, professional, and concise. Owners are typically English-speaking expats with villas in Spain.

Guide users to the right app features:
- Home: "I'm Coming Home" arrival prep, upcoming bookings
- Bookings: History, leave reviews
- Properties: Add/edit villas
- Messages: Chat with cleaners
- Account: Referral code, settings`,
  },
  cleaner: {
    name: 'Pro Assistant',
    description: 'Your professional assistant for managing bookings and team',
    basePrompt: `You are Pro Assistant for Alicante Cleaners, helping professional cleaners manage their work.

Be professional and supportive. Many cleaners speak Spanish primarily - keep explanations clear.

Guide users to the right app features:
- Home: Earnings, upcoming bookings
- Bookings: Accept/decline/complete jobs
- Team: Create or join teams
- Messages: Chat with owners
- Profile: Bio, rates, service areas`,
  },
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export async function chatWithAgent(
  agentType: AgentType,
  messages: ChatMessage[],
  userContext: string
): Promise<string> {
  const client = getOpenAI()
  const config = AGENT_CONFIGS[agentType]

  // OPTIMIZATION: Limit conversation history to last 6 messages
  const recentMessages = messages.slice(-6)

  // Load knowledge base and search for relevant content
  const latestUserMessage = recentMessages.filter(m => m.role === 'user').pop()?.content || ''
  const relevantKnowledge = searchKnowledge(agentType, latestUserMessage)

  // Build system message with knowledge
  const systemMessage = `${config.basePrompt}

${relevantKnowledge ? `KNOWLEDGE BASE:\n${relevantKnowledge}\n` : ''}
USER CONTEXT:
${userContext}

Be helpful and concise. Guide users to the right features.`

  console.log(`[Agent] ${agentType} - knowledge: ${relevantKnowledge.length} chars, messages: ${recentMessages.length}`)

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.7,
    max_tokens: 500,
    messages: [
      { role: 'system', content: systemMessage },
      ...recentMessages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    ],
  })

  return response.choices[0]?.message?.content || 'I apologize, but I was unable to generate a response. Please try again.'
}
