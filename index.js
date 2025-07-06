// index.js (Samin-X1 - V2: More Powerful)

const express = require('express');
const bodyParser = require('body-parser');
const MessagingResponse = require('twilio').twiml.MessagingResponse;
const axios = require('axios'); // ওয়েব থেকে ডেটা আনার জন্য (যেমন Joke API)

const app = express();
const port = process.env.PORT || 3000;

// Twilio থেকে আসা রিকোয়েস্ট বডি পার্স করার জন্য মিডলওয়্যার
app.use(bodyParser.urlencoded({ extended: false }));

// বটের স্টেট ম্যানেজমেন্টের জন্য একটি সাধারণ অবজেক্ট।
// প্রোডাকশনে ডেটাবেস ব্যবহার করা উচিত (যেমন MongoDB, Redis)
const userStates = {};

// কিছু কমন মেসেজ এবং কমান্ড
const WELCOME_MESSAGE = "নমস্কার! আমি আপনার Samin-X1 বট। 🤖\n\nকিছু কমান্ড চেষ্টা করে দেখুন:\n/hi - শুভেচ্ছা জানান\n/joke - একটি মজার জোক শুনুন\n/time - বর্তমান সময় জানুন\n/help - সাহায্যের জন্য";
const HELP_MESSAGE = "Samin-X1 আপনাকে কিভাবে সাহায্য করতে পারে?\n\nউপলব্ধ কমান্ড:\n/hi\n/joke\n/time\n/help\n\nআপনি যদি কোনো নির্দিষ্ট কিছু জানতে চান, তাহলে সরাসরি প্রশ্ন করতে পারেন!";
const UNKNOWN_COMMAND = "দুঃখিত, আপনার কমান্ডটি বুঝতে পারিনি। 😕\n\nসাহায্যের জন্য `/help` টাইপ করুন।";

// হোয়াটসঅ্যাপ মেসেজ রিসিভ করার জন্য এন্ডপয়েন্ট
app.post('/whatsapp', async (req, res) => {
    const incomingMsg = req.body.Body ? req.body.Body.toLowerCase().trim() : '';
    const senderNumber = req.body.From || '';

    const twiml = new MessagingResponse();

    // ব্যবহারকারীর বর্তমান স্টেট নিন (যদি থাকে)
    let currentUserState = userStates[senderNumber] || {};

    try {
        // --- ওয়েলকাম মেসেজ (প্রথম বার বা '/hi' কমান্ডে) ---
        if (incomingMsg === '/hi' || Object.keys(currentUserState).length === 0 && !incomingMsg) {
            twiml.message(WELCOME_MESSAGE);
            userStates[senderNumber] = {}; // স্টেট রিসেট
        }
        // --- জোক কমান্ড ---
        else if (incomingMsg === '/joke') {
            try {
                const response = await axios.get('https://v2.jokeapi.dev/joke/Any?type=single');
                if (response.data && response.data.joke) {
                    twiml.message(`এখানে একটি জোক: ${response.data.joke}`);
                } else {
                    twiml.message("দুঃখিত, এখন একটি জোক লোড করতে পারছি না।");
                }
            } catch (error) {
                console.error("Joke API error:", error);
                twiml.message("জোক আনার সময় একটি সমস্যা হয়েছে। আবার চেষ্টা করুন।");
            }
        }
        // --- সময় কমান্ড ---
        else if (incomingMsg === '/time') {
            const now = new Date();
            const timeString = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            const dateString = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            twiml.message(`বর্তমান সময়: ${timeString}\nতারিখ: ${dateString}\n\nআপনার Samin-X1 এইমাত্র এই তথ্য দিয়েছে!`);
        }
        // --- হেল্প কমান্ড ---
        else if (incomingMsg === '/help') {
            twiml.message(HELP_MESSAGE);
            userStates[senderNumber] = {}; // স্টেট রিসেট
        }
        // --- মাল্টি-টার্ন কনভার্সেশন উদাহরণ: ফেভারিট রঙ জিজ্ঞাসা ---
        else if (incomingMsg.includes('whats your favorite color')) {
            twiml.message("আমার কোনো ফেভারিট রঙ নেই, কারণ আমি একটি এআই। আপনার ফেভারিট রঙ কি?");
            userStates[senderNumber] = { waitingForColor: true }; // স্টেট সেট
        }
        else if (currentUserState.waitingForColor) {
            twiml.message(`আপনার ফেভারিট রঙ ${incomingMsg.toUpperCase()}? বাহ! দারুণ পছন্দ!`);
            delete userStates[senderNumber].waitingForColor; // স্টেট রিসেট
        }
        // --- অজানা কমান্ড বা টেক্সট ---
        else {
            twiml.message(UNKNOWN_COMMAND);
        }

    } catch (error) {
        console.error("Error handling WhatsApp message:", error);
        twiml.message("দুঃখিত! Samin-X1 এর একটি অভ্যন্তরীণ সমস্যা হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।");
    } finally {
        // Twilio-কে XML ফরম্যাটে প্রতিক্রিয়া ফিরিয়ে দিচ্ছি।
        res.writeHead(200, {'Content-Type': 'text/xml'});
        res.end(twiml.toString());
    }
});

// সার্ভার চালু করা
app.listen(port, () => {
    console.log(`🚀 Samin-X1 WhatsApp bot server listening on port ${port}`);
    console.log(`Access the webhook at: http://localhost:${port}/whatsapp`);
});
