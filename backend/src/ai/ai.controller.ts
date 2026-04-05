import { Controller, Post, Body } from '@nestjs/common';
import { AiService } from './ai.service';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('summarize')
  async summarize(@Body('text') text: string) {
    if (!text) {
      return { summary: '' };
    }
    return this.aiService.summarizeTranscription(text);
  }
}
