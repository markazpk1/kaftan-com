// Type declarations for Deno environment
declare module "https://deno.land/std@0.168.0/http/server.ts" {
  export function serve(handler: (req: Request) => Response | Promise<Response>): void;
}

declare module "https://esm.sh/nodemailer@6.9.7" {
  export interface Transporter {
    sendMail(options: any): Promise<any>;
    verify(): Promise<void>;
  }
  
  export function createTransporter(options: any): Transporter;
}
