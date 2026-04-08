import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private apiToken: string | null = null;
  private fromEmail: string;
  private fromName: string;

  constructor() {
    this.apiToken = process.env.MAILTRAP_API_TOKEN || null;
    this.fromEmail = process.env.SMTP_FROM_EMAIL || 'no-reply@mecatechconcept.com';
    this.fromName = process.env.SMTP_FROM_NAME || 'ICE by Mécatech';

    if (!this.apiToken) {
      this.logger.warn('MAILTRAP_API_TOKEN not set. Emails will be logged but not sent.');
    } else {
      this.logger.log('Mailtrap HTTP API mail service ready ✉️');
    }
  }

  /**
   * Send a welcome email to a newly registered mobile user.
   */
  async sendWelcomeEmail(to: string, firstName: string): Promise<boolean> {
    const subject = `Bienvenue sur MonAuto, ${firstName} ! 🚗`;
    const html = this.buildWelcomeHtml(firstName);
    return this.sendEmail(to, subject, html, 'welcome');
  }

  /**
   * Generic email send via Mailtrap HTTP API (bypasses SMTP port blocks on Render).
   */
  async sendEmail(to: string, subject: string, html: string, category?: string): Promise<boolean> {
    if (!this.apiToken) {
      this.logger.warn(`[MOCK] To: ${to} | Subject: ${subject}`);
      return true;
    }

    const payload: any = {
      from: { email: this.fromEmail, name: this.fromName },
      to: [{ email: to }],
      subject,
      html,
    };
    if (category) {
      payload.category = category;
    }

    try {
      const response = await fetch('https://send.api.mailtrap.io/api/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Api-Token': this.apiToken,
        },
        body: JSON.stringify(payload),
      });

      const body = await response.text();

      if (response.ok) {
        this.logger.log(`Email sent to ${to} — response: ${body}`);
        return true;
      } else {
        this.logger.error(`Mailtrap API error (${response.status}) for ${to}: ${body}`);
        return false;
      }
    } catch (error: any) {
      this.logger.error(`Failed to send email to ${to}: ${error.message}`);
      return false;
    }
  }

  /**
   * Build the branded HTML for the welcome email.
   */
  private buildWelcomeHtml(firstName: string): string {
    const year = new Date().getFullYear();
    return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bienvenue sur MonAuto</title>
</head>
<body style="margin:0;padding:0;background-color:#f0f2f5;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f0f2f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header gradient -->
          <tr>
            <td style="background:linear-gradient(135deg,#4f46e5 0%,#7c3aed 50%,#6366f1 100%);padding:40px 40px 30px;text-align:center;">
              <div style="font-size:36px;margin-bottom:12px;">🚗</div>
              <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;letter-spacing:-0.5px;">
                Bienvenue sur MonAuto
              </h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;font-weight:400;">
                Votre compagnon automobile intelligent
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px 20px;">
              <p style="margin:0 0 20px;color:#1e293b;font-size:17px;line-height:1.6;">
                Bonjour <strong>${firstName}</strong>,
              </p>
              <p style="margin:0 0 20px;color:#475569;font-size:15px;line-height:1.7;">
                Nous sommes ravis de vous accueillir sur <strong>MonAuto</strong> ! Votre compte a été créé avec succès et vous pouvez dès maintenant profiter de tous nos services.
              </p>

              <!-- Feature cards -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:24px 0;">
                <tr>
                  <td style="padding:16px 20px;background:#f8fafc;border-radius:12px;border-left:4px solid #4f46e5;margin-bottom:12px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td width="40" style="font-size:22px;vertical-align:top;">🔧</td>
                        <td>
                          <strong style="color:#1e293b;font-size:14px;">Demande de Devis</strong>
                          <p style="margin:4px 0 0;color:#64748b;font-size:13px;line-height:1.5;">
                            Obtenez des devis gratuits et sans engagement auprès de nos garages partenaires.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr><td style="height:12px;"></td></tr>
                <tr>
                  <td style="padding:16px 20px;background:#f8fafc;border-radius:12px;border-left:4px solid #7c3aed;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td width="40" style="font-size:22px;vertical-align:top;">📋</td>
                        <td>
                          <strong style="color:#1e293b;font-size:14px;">Suivi en Temps Réel</strong>
                          <p style="margin:4px 0 0;color:#64748b;font-size:13px;line-height:1.5;">
                            Suivez l'avancement de vos réparations depuis votre téléphone.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr><td style="height:12px;"></td></tr>
                <tr>
                  <td style="padding:16px 20px;background:#f8fafc;border-radius:12px;border-left:4px solid #6366f1;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td width="40" style="font-size:22px;vertical-align:top;">🚘</td>
                        <td>
                          <strong style="color:#1e293b;font-size:14px;">Gestion de Véhicules</strong>
                          <p style="margin:4px 0 0;color:#64748b;font-size:13px;line-height:1.5;">
                            Ajoutez et gérez votre flotte de véhicules en toute simplicité.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style="margin:24px 0 20px;color:#475569;font-size:15px;line-height:1.7;">
                Si vous avez des questions, n'hésitez pas à nous contacter. Notre équipe est à votre disposition pour vous accompagner.
              </p>


            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;">
              <p style="margin:0 0 8px;color:#94a3b8;font-size:12px;">
                © ${year} MonAuto — Tous droits réservés
              </p>
              <p style="margin:0;color:#94a3b8;font-size:11px;">
                Cet email a été envoyé automatiquement suite à la création de votre compte.
                <br>
                Vous recevez ce message car vous vous êtes inscrit sur notre plateforme.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }
}
