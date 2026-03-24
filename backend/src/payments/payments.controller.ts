import { Controller, Post, Body, HttpCode, Res } from '@nestjs/common';
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

  @Post('cinetpay-return')
  async handleReturn(@Body() payload: any, @Res() res: any) {
    // CinetPay redirige l'utilisateur avec une requête POST.
    // On renvoie une jolie page HTML confirmant le paiement pour qu'il puisse fermer.
    const html = `
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Paiement ICE</title>
        </head>
        <body style="display:flex; justify-content:center; align-items:center; height:100vh; font-family:sans-serif; text-align:center; padding:20px; background:#f8fafc;">
          <div style="background:white; padding:40px 20px; border-radius:16px; box-shadow:0 4px 6px -1px rgb(0 0 0 / 0.1);">
            <svg style="width:64px; height:64px; color:#10b981; margin:0 auto 20px;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h1 style="color:#0f172a; margin-bottom:10px; font-size:24px;">Paiement terminé</h1>
            <p style="color:#64748b; margin-bottom:20px;">Votre transaction a été enregistrée avec succès.</p>
            <p style="color:#334155; font-weight:bold;">Veuillez fermer cette fenêtre pour retourner à l'application.</p>
          </div>
        </body>
      </html>
    `;
    return res.status(200).send(html);
  }
}
