import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class AiService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
      // Use the modern 3.0-flash model
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-3.0-flash' });
    }
  }

  async summarizeTranscription(transcription: string) {
    if (!this.model) {
      throw new InternalServerErrorException('GEMINI_API_KEY is not configured on the server');
    }

    const prompt = `Voici la retranscription brute et potentiellement désorganisée d'un échange vocal (appel téléphonique) capté automatiquement. Ton rôle est de le nettoyer, de le résumer professionnellement pour un ticket de support client de type "Centre d'Appels Garage Automobile". Formate ta réponse de manière concise en markdown, en faisant ressortir les points essentiels. Évite les blablas : va droit au but.
    
    Retranscription brute :
    """
    ${transcription}
    """
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      return { summary: text };
    } catch (error) {
      console.error('Gemini Error:', error);
      throw new InternalServerErrorException('Impossible de générer le résumé via Gemini.');
    }
  }
}
