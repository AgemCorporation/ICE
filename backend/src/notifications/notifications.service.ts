import { Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private firebaseApp: admin.app.App | null = null;

  constructor(private prisma: PrismaService) {
    this.initializeFirebase();
  }

  private initializeFirebase() {
    try {
      if (!admin.apps.length) {
        let credential: admin.credential.Credential | null = null;

        // 1. Try environment variable first (production on Render)
        const envJson = process.env.FIREBASE_SERVICE_ACCOUNT;
        if (envJson) {
          try {
            const serviceAccount = JSON.parse(envJson);
            credential = admin.credential.cert(serviceAccount);
            this.logger.log('Firebase credentials loaded from FIREBASE_SERVICE_ACCOUNT env var.');
          } catch (parseErr) {
            this.logger.error('Failed to parse FIREBASE_SERVICE_ACCOUNT env var', parseErr);
          }
        }

        // 2. Fallback to local file (development)
        if (!credential) {
          const serviceAccountPath = path.resolve(process.cwd(), 'firebase-admin-key.json');
          if (fs.existsSync(serviceAccountPath)) {
            const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
            credential = admin.credential.cert(serviceAccount);
            this.logger.log('Firebase credentials loaded from local file.');
          }
        }

        if (credential) {
          this.firebaseApp = admin.initializeApp({ credential });
          this.logger.log('Firebase Admin SDK initialized successfully.');
        } else {
          this.logger.warn('No Firebase credentials found. Push notifications will be mocked.');
        }
      } else {
        this.firebaseApp = admin.app();
      }
    } catch (error) {
      this.logger.error('Failed to initialize Firebase Admin SDK', error);
    }
  }

  /**
   * Send a push notification to a specific client
   * @param phone The client's phone number
   * @param title Notification title
   * @param body Notification body
   * @param data Optional payload data
   */
  async sendPushNotificationToClient(phone: string, title: string, body: string, data?: { [key: string]: string }) {
    try {
      const client = await this.prisma.client.findFirst({
        where: { phone },
        select: { pushToken: true, id: true, firstName: true }
      });

      if (!client || !client.pushToken) {
        this.logger.debug(`No push token found for client phone ending in ${phone.slice(-4)}`);
        return false;
      }

      return this.sendPushNotification(client.pushToken, title, body, data);
    } catch (error) {
      this.logger.error(`Error fetching client to send notification: ${error}`);
      return false;
    }
  }

  /**
   * Core function to send notification via FCM
   */
  async sendPushNotification(token: string, title: string, body: string, data?: { [key: string]: string }) {
    if (!this.firebaseApp) {
      this.logger.warn(`Mocking Notification to token [${token}]: ${title} - ${body}`);
      return true; // Return true as a mock
    }

    try {
      const message: admin.messaging.Message = {
        token,
        notification: {
          title,
          body,
        },
        data: data || {},
        android: {
          notification: { sound: 'default' },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
            },
          },
        },
      };

      const response = await this.firebaseApp.messaging().send(message);
      this.logger.log(`Successfully sent message: ${response}`);
      return true;
    } catch (error) {
      this.logger.error('Error sending message:', error);
      return false;
    }
  }
}
