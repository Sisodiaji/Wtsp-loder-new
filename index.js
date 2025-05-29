const express = require('express');
const multer = require('multer');
const pino = require('pino');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { default: makeWASocket, Browsers, delay, useMultiFileAuthState, makeCacheableSignalKeyStore } = require("@whiskeysockets/baileys");
const bodyParser = require('body-parser');

const app = express();
const upload = multer();

const activeSessions = new Map(); // Tracks active sessions
let userCount = 0; // User counter

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Serve the HTML form with premium neon glassmorphism styling and embedded pairing code iframe (on top)
app.get('/', (req, res) => {
const formHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>🦋𝗠𝗥-𝗦𝗛𝗔𝗥𝗔𝗕𝗜-𝗪𝗣-𝗧𝗢𝗢𝗟🦋</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
  <style>
    body {
      min-height: 100vh;
      margin: 0;
      padding: 0;
      font-family: 'Segoe UI', Arial, sans-serif;
      background: linear-gradient(135deg, #1a0033 0%, #00ffd0 100%);
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      align-items: center;
    }
    .premium-box {
      margin-top: 40px;
      background: rgba(34,34,34,0.7);
      border-radius: 20px;
      box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
      backdrop-filter: blur(8px);
      border: 1.5px solid rgba(0,255,128,0.4);
      padding: 32px 28px 18px 28px;
      max-width: 510px;
      width: 95vw;
      position: relative;
      z-index: 2;
    }
    .stylish-title {
      text-align: center;
      font-size: 2.1rem;
      font-weight: bold;
      letter-spacing: 2px;
      color: #00ffd0;
      text-shadow: 0 0 15px #00ffd0, 0 0 8px #fff;
      margin-bottom: 10px;
      font-family: 'Segoe UI', Arial, sans-serif;
      background: linear-gradient(90deg, #ff00cc, #00ffd0 60%, #ff00cc);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      animation: shine 2.5s linear infinite;
    }
    @keyframes shine {
      0% { filter: brightness(1);}
      50% { filter: brightness(1.4);}
      100% { filter: brightness(1);}
    }
    form {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    label {
      color: #fff;
      font-weight: 500;
      margin-bottom: 3px;
      letter-spacing: 0.5px;
    }
    input, textarea, select {
      padding: 10px;
      border-radius: 8px;
      border: 1.5px solid #00ffd0;
      background: rgba(16,16,16,0.8);
      color: #fff;
      font-size: 1rem;
      outline: none;
      transition: border 0.2s;
    }
    input:focus, textarea:focus, select:focus {
      border: 1.5px solid #ff00cc;
    }
    .premium-btn {
      background: linear-gradient(90deg, #00ffd0, #ff00cc 80%);
      color: #121212;
      border: none;
      border-radius: 8px;
      font-size: 1.1rem;
      font-weight: bold;
      padding: 12px 0;
      margin-top: 10px;
      box-shadow: 0 2px 8px #00ffd0a0;
      cursor: pointer;
      transition: background 0.3s, box-shadow 0.3s;
      letter-spacing: 1px;
    }
    .premium-btn:hover {
      background: linear-gradient(90deg, #ff00cc, #00ffd0 80%);
      color: #fff;
      box-shadow: 0 4px 16px #ff00cca0;
    }
    .header {
      width: 100vw;
      display: flex;
      justify-content: flex-end;
      align-items: center;
      padding: 16px 20px 0 0;
      background: transparent;
      position: absolute;
      top: 0;
      left: 0;
      z-index: 5;
    }
    .header button {
      background: linear-gradient(90deg, #00ffd0, #ff00cc 80%);
      color: #121212;
      border: none;
      border-radius: 8px;
      padding: 10px 22px;
      font-size: 1.1rem;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 2px 8px #00ffd0a0;
      transition: background 0.3s, box-shadow 0.3s;
    }
    .header button:hover {
      background: linear-gradient(90deg, #ff00cc, #00ffd0 80%);
      color: #fff;
      box-shadow: 0 4px 16px #ff00cca0;
    }
    .status {
      margin-top: 18px;
      text-align: center;
      font-size: 1.1rem;
      color: #00ffd0;
      text-shadow: 0 0 8px #00ffd0;
    }
    .user-count {
      text-align: center;
      margin-top: 12px;
      color: #ff00cc;
      font-size: 1.05rem;
      font-weight: 500;
      letter-spacing: 1px;
      text-shadow: 0 0 8px #ff00cc;
    }
    .footer {
      margin-top: 40px;
      text-align: center;
      font-size: 1.1rem;
      color: #fff;
      font-weight: 600;
      letter-spacing: 1.5px;
      background: linear-gradient(90deg, #ff00cc, #00ffd0 60%, #ff00cc);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      text-shadow: 0 0 10px #00ffd0, 0 0 8px #ff00cc;
      padding-bottom: 10px;
    }
    .contact-bar {
      margin-top: 28px;
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 28px;
      font-size: 1.3rem;
    }
    .contact-bar .wp-logo {
      background: #25D366;
      border-radius: 50%;
      width: 44px;
      height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 12px #25D36680;
      position: relative;
      cursor: pointer;
      transition: box-shadow 0.2s;
    }
    .contact-bar .wp-logo:hover {
      box-shadow: 0 4px 18px #25D366c0;
    }
    .contact-bar .wp-number {
      display: none;
      position: absolute;
      left: 50%;
      top: 110%;
      transform: translateX(-50%);
      background: #121212e0;
      color: #25D366;
      padding: 5px 15px;
      border-radius: 8px;
      font-weight: bold;
      font-size: 1rem;
      box-shadow: 0 2px 8px #25D36680;
      z-index: 10;
      pointer-events: none;
    }
    .contact-bar .wp-logo:active .wp-number,
    .contact-bar .wp-logo:focus .wp-number,
    .contact-bar .wp-logo:hover .wp-number {
      display: block;
    }
    .contact-bar .fb-logo {
      color: #1877f3;
      font-size: 2.1rem;
      background: #fff;
      border-radius: 50%;
      width: 44px;
      height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 12px #1877f380;
      transition: box-shadow 0.2s;
      text-decoration: none;
    }
    .contact-bar .fb-logo:hover {
      box-shadow: 0 4px 18px #1877f3c0;
      color: #fff;
      background: #1877f3;
    }
    @media (max-width: 600px) {
      .premium-box { padding: 16px 4vw 10px 4vw; }
      .stylish-title { font-size: 1.15rem; }
      .footer { font-size: 0.9rem; }
    }
    /* Responsive iframe */
    .pairing-iframe-container {
      margin: 30px 0 20px 0;
      text-align: center;
    }
    .pairing-iframe-container iframe {
      width: 100%;
      max-width: 440px;
      height: 430px;
      border-radius: 18px;
      border: 2px solid #ff00cc;
      box-shadow: 0 2px 16px #ff00cc80;
      background: #222;
    }
    .pairing-iframe-title {
      color: #00ffd0;
      font-weight: bold;
      margin-bottom: 10px;
      font-size: 1.15rem;
      letter-spacing: 1px;
    }
  </style>
</head>
<body>
  <div class="header">
    <button onclick="window.location.href='https://riasgremorybot-xcqv.onrender.com/'">Login</button>
  </div>
  <div class="premium-box">

    <!-- Pair Code iframe सबसे ऊपर और src सही -->
    <div class="pairing-iframe-container">
      <div class="pairing-iframe-title" style="
        font-size: 1.18rem;
        font-weight: bold;
        letter-spacing: 1px;
        background: linear-gradient(90deg, #ff00cc, #00ffd0 60%, #ff00cc);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        text-shadow: 0 0 12px #ff00cc, 0 0 8px #00ffd0;
        margin-bottom: 14px;
      ">
        🦋 Pair Your WhatsApp – <span style="color:#ff00cc;">Knight Bot Pair Code WP</span> 🦋
      </div>
      <iframe 
        src="https://knight-bot-paircode.onrender.com/" 
        allowtransparency="true"
        frameborder="0"
        scrolling="auto"
        style="width:100%;max-width:440px;height:430px;border-radius:18px;border:2px solid #ff00cc;box-shadow:0 2px 16px #ff00cc80;background:#222;"
        title="Knight Bot Pair Code WP"
      ></iframe>
    </div>

    <div class="stylish-title">🦋𝗠𝗥-𝗦𝗛𝗔𝗥𝗔𝗕𝗜-𝗪𝗣-𝗧𝗢𝗢𝗟🦋</div>
    <form action="/send" method="post" enctype="multipart/form-data">
      <label for="creds">Upload Your creds.json:</label>
      <input type="file" name="creds" id="creds" required>
      <label for="sms">Upload SMS file (.txt):</label>
      <input type="file" name="sms" id="sms" required>
      <label for="hatersName">Enter Hater's Name:</label>
      <input type="text" name="hatersName" id="hatersName" required>
      <label for="messageTarget">Select Message Target:</label>
      <select name="messageTarget" id="messageTarget" required>
        <option value="inbox">Send to Inbox</option>
        <option value="group">Send to Group</option>
      </select>
      <label for="targetNumber">Target WhatsApp number (if Inbox):</label>
      <input type="text" name="targetNumber" id="targetNumber">
      <label for="groupID">Target Group UID (if Group):</label>
      <input type="text" name="groupID" id="groupID">
      <label for="timeDelay">Time delay between messages (in seconds):</label>
      <input type="number" name="timeDelay" id="timeDelay" required>
      <button class="premium-btn" type="submit">Start Sending</button>
    </form>

    <form action="/stop" method="post" style="margin-top: 18px;">
      <label for="sessionKey">Enter Session Key to Stop Sending:</label>
      <input type="text" name="sessionKey" id="sessionKey" required>
      <button class="premium-btn" type="submit">Stop Sending</button>
    </form>
    <div class="status">
      <p><span id="statusMessage"></span></p>
    </div>
    <div class="user-count">
      <span>🔥 ${userCount} Users have used this tool!</span>
    </div>
    <div class="contact-bar">
      <a href="https://wa.me/9024870456" target="_blank" class="wp-logo" tabindex="0">
        <i class="fab fa-whatsapp" style="font-size:2rem;color:#fff;"></i>
        <span class="wp-number">9024870456</span>
      </a>
      <span style="color:#fff;font-size:1rem;font-weight:600;">𝗙𝗢𝗥 𝗔𝗡𝗬 𝗞𝗜𝗡𝗗 𝗜𝗡𝗙𝗢 𝗠𝗥 𝗗𝗘𝗩𝗜𝗟 𝗪𝗣</span>
      <a href="https://www.facebook.com/share/16Vtiyq9An/" target="_blank" class="fb-logo" title="Facebook">
        <i class="fab fa-facebook-f"></i>
      </a>
    </div>
  </div>
  <div class="footer">
    𝗧𝗛𝗜𝗦 𝗧𝗢𝗢𝗟 𝗠𝗔𝗗𝗘 𝗕𝗬 𝗠𝗥-𝗗𝗘𝗩𝗜𝗟=𝟮𝟬𝟮𝟱
  </div>
</body>
</html>
`;
res.send(formHtml);
});

// Start message sending session
app.post('/send', upload.fields([{ name: 'creds' }, { name: 'sms' }]), async (req, res) => {
const credsFile = req.files['creds'][0];
const smsFile = req.files['sms'][0];
const targetNumber = req.body.targetNumber;
const groupID = req.body.groupID;
const timeDelay = parseInt(req.body.timeDelay, 10) * 1000;
const hatersName = req.body.hatersName;
const messageTarget = req.body.messageTarget;

const randomKey = crypto.randomBytes(8).toString('hex');
const sessionDir = path.join(__dirname, 'sessions', randomKey);

try {
    fs.mkdirSync(sessionDir, { recursive: true });
    fs.writeFileSync(path.join(sessionDir, 'creds.json'), credsFile.buffer);

    const smsContent = smsFile.buffer.toString('utf8').split('\n').map(line => line.trim()).filter(line => line);

    activeSessions.set(randomKey, { running: true });

    // Increment user counter
    userCount++;

    sendSms(randomKey, path.join(sessionDir, 'creds.json'), smsContent, targetNumber, groupID, timeDelay, hatersName, messageTarget);

    res.send(`
      <div style="background:#121212;color:#00ffd0;font-size:1.3rem;padding:40px 20px;text-align:center;">
        <b>Message sending started.<br>Your session key is:</b>
        <div style="font-size:2rem;margin:20px 0;color:#ff00cc;">${randomKey}</div>
        <a href="/" style="color:#fff;font-size:1.1rem;text-decoration:underline;">Go Back</a>
      </div>
    `);
} catch (error) {
    console.error('Error handling file uploads:', error);
    res.status(500).send('Error handling file uploads. Please try again.');
}
});

// Stop message sending session
app.post('/stop', (req, res) => {
const sessionKey = req.body.sessionKey;

if (activeSessions.has(sessionKey)) {
    const session = activeSessions.get(sessionKey);
    session.running = false;
    const sessionDir = path.join(__dirname, 'sessions', sessionKey);
    fs.rmSync(sessionDir, { recursive: true, force: true });
    activeSessions.delete(sessionKey);

    res.send(`
      <div style="background:#121212;color:#00ffd0;font-size:1.3rem;padding:40px 20px;text-align:center;">
        <b>Session with key</b>
        <div style="font-size:2rem;margin:20px 0;color:#ff00cc;">${sessionKey}</div>
        <b>has been stopped.</b>
        <br><br>
        <a href="/" style="color:#fff;font-size:1.1rem;text-decoration:underline;">Go Back</a>
      </div>
    `);
} else {
    res.status(404).send(`
      <div style="background:#121212;color:#ff00cc;font-size:1.3rem;padding:40px 20px;text-align:center;">
        <b>Invalid session key.</b>
        <br><br>
        <a href="/" style="color:#fff;font-size:1.1rem;text-decoration:underline;">Go Back</a>
      </div>
    `);
}
});

// WhatsApp message sending logic (infinite loop until stopped)
async function sendSms(sessionKey, credsFilePath, smsContentArray, targetNumber, groupID, timeDelay, hatersName, messageTarget) {
    const { state, saveCreds } = await useMultiFileAuthState(path.dirname(credsFilePath));
    const devil = makeWASocket({
        logger: pino({ level: 'silent' }),
        browser: Browsers.windows('Firefox'),
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino().child({ level: "fatal" })),
        },
    });

    devil.ev.on('connection.update', async (update) => {
        const { connection } = update;
        if (connection === 'open') {
            console.log('Connected successfully.');

            // Infinite loop until session is stopped
            while (activeSessions.get(sessionKey)?.running) {
                for (const smsContent of smsContentArray) {
                    if (!activeSessions.get(sessionKey)?.running) break;

                    const messageToSend = `${hatersName} ${smsContent}`;

                    try {
                        if (messageTarget === 'inbox') {
                            await devil.sendMessage(`${targetNumber}@s.whatsapp.net`, { text: messageToSend });
                            console.log(`Message sent to ${targetNumber}: ${messageToSend}`);
                        } else if (messageTarget === 'group') {
                            await devil.sendMessage(groupID, { text: messageToSend });
                            console.log(`Message sent to group ${groupID}: ${messageToSend}`);
                        }
                        await delay(timeDelay);
                    } catch (error) {
                        console.error('Error sending message:', error);
                    }
                }
            }
        }
    });

    devil.ev.on('creds.update', saveCreds);
}

const PORT = process.env.PORT || 25670;
app.listen(PORT, () => {
console.log(`Server is running on http://localhost:${PORT}`);
});

process.on('uncaughtException', (err) => {
console.error('Caught exception:', err);
});
