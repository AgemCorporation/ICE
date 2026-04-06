import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  constructor(private readonly prisma: PrismaService) {}

  async initFeePayment(quoteRequestId: string) {
    const apiKey = process.env.CINETPAY_API_KEY;
    const siteId = process.env.CINETPAY_SITE_ID;

    if (!apiKey || !siteId) {
      throw new HttpException("Configuration CinetPay manquante dans l'environnement", HttpStatus.INTERNAL_SERVER_ERROR);
    }
    const quote = await this.prisma.quoteRequest.findUnique({
      where: { id: quoteRequestId }
    });

    if (!quote) {
      throw new HttpException('Devis introuvable', HttpStatus.NOT_FOUND);
    }
    
    // Dynamic Fee Amount Based on Client Type
    const feeParticulier = process.env.CINETPAY_FEE_AMOUNT_PARTICULIER ? parseInt(process.env.CINETPAY_FEE_AMOUNT_PARTICULIER) : 2000;
    const feeEntreprise = process.env.CINETPAY_FEE_AMOUNT_ENTREPRISE ? parseInt(process.env.CINETPAY_FEE_AMOUNT_ENTREPRISE) : 2500;

    let feeAmount = feeParticulier;

    const client = await this.prisma.client.findFirst({
      where: { phone: quote.motoristPhone }
    });
    
    if (client && client.type === 'Entreprise') {
      feeAmount = feeEntreprise;
    }

    if ((quote as any).hasPaidFees) {
      throw new HttpException('Les frais de gestion pour cette demande ont déjà été payés.', HttpStatus.BAD_REQUEST);
    }

    const transactionId = `TX_${quoteRequestId.substring(0, 8)}_${Date.now()}`;

    // Create pending transaction in DB
    await this.prisma.paymentTransaction.create({
      data: {
        transactionId,
        amount: feeAmount,
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
          apikey: apiKey,
          site_id: siteId,
          transaction_id: transactionId,
          amount: feeAmount,
          currency: 'XOF',
          description: `Frais de gestion - Devis ${quoteRequestId.substring(0, 8)}`,
          notify_url: notifyUrl,
          return_url: 'https://ice-m7jm.onrender.com/api/payments/cinetpay-return', // Route interceptant le POST de retour
          channels: 'ALL',
          customer_name: quote.motoristName || 'Client',
          customer_surname: 'ICE',
          customer_phone_number: quote.motoristPhone || '0022500000000',
          customer_email: quote.motoristEmail || 'no-reply@agemcorporation.com',
          customer_address: 'Abidjan', // Obligatoire pour CinetPay V2
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
    this.logger.log('--- WEBHOOK CINETPAY REÇU --- : ' + JSON.stringify(payload));
    
    const transaction_id = payload.cpm_trans_id;
    if (!transaction_id) {
      this.logger.warn('Webhook vide ou sans cpm_trans_id reçu');
      return { status: 'ignored' };
    }

    const tx = await this.prisma.paymentTransaction.findUnique({
      where: { transactionId: transaction_id }
    });

    if (!tx || tx.status === 'SUCCESS') return { status: 'already_processed' };

    const apiKey = process.env.CINETPAY_API_KEY;
    const siteId = process.env.CINETPAY_SITE_ID;

    // Need to verify via CinetPay check API
    try {
      const response = await fetch('https://api-checkout.cinetpay.com/v2/payment/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apikey: apiKey,
          site_id: siteId,
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
            data: { hasPaidFees: true }
          });
        });
        this.logger.log(`Transaction ${transaction_id} validée et devis débloqués.`);
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
