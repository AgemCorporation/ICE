import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly apiKey = process.env.CINETPAY_API_KEY || '';
  private readonly siteId = process.env.CINETPAY_SITE_ID || '';
  private readonly fixedAmount = 2000;
  
  constructor(private readonly prisma: PrismaService) {}

  async initFeePayment(quoteRequestId: string) {
    if (!this.apiKey || !this.siteId) {
      throw new HttpException("Configuration CinetPay manquante dans l'environnement", HttpStatus.INTERNAL_SERVER_ERROR);
    }

    const quote = await this.prisma.quoteRequest.findUnique({
      where: { id: quoteRequestId }
    });

    if (!quote) {
      throw new HttpException('Devis introuvable', HttpStatus.NOT_FOUND);
    }

    if (quote.status === 'ACCEPTED') {
      throw new HttpException('Ce devis est déjà accepté et payé.', HttpStatus.BAD_REQUEST);
    }

    const transactionId = `TX_${quoteRequestId.substring(0, 8)}_${Date.now()}`;

    // Create pending transaction in DB
    await this.prisma.paymentTransaction.create({
      data: {
        transactionId,
        amount: this.fixedAmount,
        quoteRequestId,
        status: 'PENDING'
      }
    });

    const notifyUrl = process.env.PUBLIC_API_URL 
      ? `${process.env.PUBLIC_API_URL}/api/payments/cinetpay-webhook`
      : 'https://ice-m7jm.onrender.com/api/payments/cinetpay-webhook';

    try {
      const response = await fetch('https://api-checkout.cinetpay.com/v2/payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          apikey: this.apiKey,
          site_id: this.siteId,
          transaction_id: transactionId,
          amount: this.fixedAmount,
          currency: 'XOF',
          description: `Frais de gestion - Devis ${quoteRequestId.substring(0, 8)}`,
          notify_url: notifyUrl,
          return_url: `iceapp://payment-success`, // Deep link
          channels: 'ALL',
          customer_name: quote.motoristName || 'Client ICE',
          customer_surname: '',
          customer_phone_number: quote.motoristPhone || '0022500000000',
          customer_email: quote.motoristEmail || 'no-reply@agemcorporation.com',
          customer_city: quote.locationCity || 'Abidjan',
          customer_country: 'CI',
          customer_state: 'CI',
          customer_zip_code: '00225'
        })
      });

      const data = await response.json() as any;
      if (data.code === '201') {
        return {
          paymentUrl: data.data.payment_url,
          paymentToken: data.data.payment_token,
          transactionId
        };
      } else {
        this.logger.error('Erreur CinetPay (init): ' + JSON.stringify(data));
        throw new HttpException(data.message || 'Erreur CinetPay', HttpStatus.BAD_GATEWAY);
      }
    } catch (err) {
      if (err instanceof HttpException) throw err;
      this.logger.error('Exception CinetPay init: ' + err);
      throw new HttpException('Impossible de contacter le service de paiement', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async handleWebhook(payload: any) {
    const transaction_id = payload.cpm_trans_id;
    if (!transaction_id) {
      this.logger.warn('Webhook vide ou sans cpm_trans_id reçu');
      return { status: 'ignored' };
    }

    const tx = await this.prisma.paymentTransaction.findUnique({
      where: { transactionId: transaction_id }
    });

    if (!tx || tx.status === 'SUCCESS') return { status: 'already_processed' };

    // Need to verify via CinetPay check API
    try {
      const response = await fetch('https://api-checkout.cinetpay.com/v2/payment/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apikey: this.apiKey,
          site_id: this.siteId,
          transaction_id
        })
      });

      const data = await response.json() as any;

      if (data.code === '00' && data.data.status === 'ACCEPTED') {
        // Payment successful
        await this.prisma.$transaction(async (prisma) => {
          await prisma.paymentTransaction.update({
            where: { transactionId: transaction_id },
            data: { status: 'SUCCESS', cinetpayId: data.data.payment_method }
          });
          
          await prisma.quoteRequest.update({
            where: { id: tx.quoteRequestId },
            data: { status: 'ACCEPTED' }
          });
        });
        this.logger.log(`Transaction ${transaction_id} validée et devis mis à jour.`);
      } else {
        // Did not succeed
        await this.prisma.paymentTransaction.update({
          where: { transactionId: transaction_id },
          data: { status: 'FAILED' }
        });
        this.logger.warn(`Transaction ${transaction_id} refusée ou échouée (Statut CinetPay: ${data?.data?.status}).`);
      }
    } catch (err) {
      this.logger.error('Erreur lors de la vérification du Webhook CinetPay: ' + err);
    }

    return { status: 'processed' };
  }
}
