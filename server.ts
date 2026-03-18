import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Email Recovery API
  app.post("/api/auth/recover", async (req, res) => {
    const { username, emails, backupEmails } = req.body;

    if (!username || (!emails && (!backupEmails || backupEmails.length === 0))) {
      return res.status(400).json({ error: "Missing recovery information." });
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const allEmails = [emails, ...(backupEmails || [])].filter(Boolean);
    const recoveryLink = `${process.env.APP_URL || 'http://localhost:3000'}/recover?user=${username}&token=${Math.random().toString(36).substring(7)}`;

    try {
      await Promise.all(allEmails.map(email => 
        transporter.sendMail({
          from: `"Matrix Neural Core" <${process.env.SMTP_USER}>`,
          to: email,
          subject: "NEURAL LINK RECOVERY: PORTAL ESTABLISHED",
          text: `Greetings, ${username}.\n\nA recovery portal has been established for your neural link.\n\nAccess the portal here: ${recoveryLink}\n\nIf you did not request this, ignore this signal.`,
          html: `
            <div style="font-family: 'Courier New', Courier, monospace; background-color: #0f172a; color: #f8fafc; padding: 40px; border: 1px solid #1e293b; border-radius: 20px;">
              <h1 style="color: #6366f1; text-transform: uppercase; letter-spacing: 4px;">Neural Link Recovery</h1>
              <p style="font-size: 14px; line-height: 1.6;">Greetings, <strong>${username}</strong>.</p>
              <p style="font-size: 14px; line-height: 1.6;">A recovery portal has been established for your neural link in the Matrix.</p>
              <div style="margin: 40px 0;">
                <a href="${recoveryLink}" style="background-color: #6366f1; color: white; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: bold; text-transform: uppercase; font-size: 12px; letter-spacing: 2px;">Access Portal</a>
              </div>
              <p style="font-size: 10px; color: #64748b; text-transform: uppercase;">If you did not request this, ignore this signal. The portal will expire shortly.</p>
            </div>
          `
        })
      ));

      res.json({ success: true, message: "Recovery signals transmitted successfully." });
    } catch (error: any) {
      console.error("Email sending failed:", error);
      res.status(500).json({ error: "Failed to transmit recovery signals. Check SMTP configuration." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
