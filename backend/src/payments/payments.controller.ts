import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('init-fee')
  async initFeePayment(@Body() body: { quoteRequestId: string }) {
    return this.paymentsService.initFeePayment(body.quoteRequestId);
  }

  @Post('cinetpay-webhook')
  @HttpCode(200) // Alway return 200 to acknowledge receipt to CinetPay
  async handleWebhook(@Body() payload: any) {
    // CinetPay usually sends data such as { cpm_trans_id: ... }
    return this.paymentsService.handleWebhook(payload);
  }
}
