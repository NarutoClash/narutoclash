'use server';
/**
 * @fileOverview Generates AI ninja opponents with customizable difficulty and fighting styles.
 *
 * - generateAINinjaOpponent - A function that generates an AI ninja opponent.
 * - GenerateAINinjaOpponentInput - The input type for the generateAINinjaOpponent function.
 * - GenerateAINinjaOpponentOutput - The return type for the generateAINinjaOpponent function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateAINinjaOpponentInputSchema = z.object({
  difficulty: z
    .enum(['easy', 'medium', 'hard'])
    .describe('The difficulty of the AI opponent.'),
  fightingStyle: z
    .string()
    .describe(
      'The fighting style of the AI opponent, e.g., aggressive, defensive, tactical.'
    ),
  characterName: z.string().optional().describe('Optional character name'),
  description: z.string().optional().describe('Optional character description'),
});
export type GenerateAINinjaOpponentInput = z.infer<
  typeof GenerateAINinjaOpponentInputSchema
>;

const GenerateAINinjaOpponentOutputSchema = z.object({
  name: z.string().describe('The name of the AI ninja opponent.'),
  description: z
    .string()
    .describe('The description of the AI ninja opponent.'),
  fightingStyle: z.string().describe('The fighting style of the AI opponent.'),
  difficulty: z.string().describe('The difficulty of the AI opponent.'),
});
export type GenerateAINinjaOpponentOutput = z.infer<
  typeof GenerateAINinjaOpponentOutputSchema
>;

export async function generateAINinjaOpponent(
  input: GenerateAINinjaOpponentInput
): Promise<GenerateAINinjaOpponentOutput> {
  return generateAINinjaOpponentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateAINinjaOpponentPrompt',
  input: {schema: GenerateAINinjaOpponentInputSchema},
  output: {schema: GenerateAINinjaOpponentOutputSchema},
  prompt: `You are an expert in creating AI ninja opponents for a fighting game.

Create an AI ninja opponent with the following characteristics:

Difficulty: {{{difficulty}}}
Fighting Style: {{{fightingStyle}}}

Here is a optional description
{{{ description }}}

Generate a name and description for the AI ninja opponent. Return the
result as a JSON object with the following keys:

- name: The name of the AI ninja opponent.
- description: A detailed description of the AI ninja opponent's abilities and personality.
- fightingStyle: The fighting style of the AI ninja opponent.
- difficulty: The difficulty of the AI ninja opponent.

Make sure the description is no more than 100 words.

{{#if characterName}}
Use the character name {{{characterName}}} if provided.
{{/if}}`,
});

const generateAINinjaOpponentFlow = ai.defineFlow(
  {
    name: 'generateAINinjaOpponentFlow',
    inputSchema: GenerateAINinjaOpponentInputSchema,
    outputSchema: GenerateAINinjaOpponentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
