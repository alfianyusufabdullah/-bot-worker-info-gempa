const cron = require('node-cron');
const axios = require('axios').default;
const { JSDOM } = require("jsdom");

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

let isRunning = false
let latest = ''

function sendPhoto(chatId, data) {
    return new Promise(async (resolve, reject) => {
        let caption = `<strong>${data.locationName}</strong>\n\n`
        caption += `📅 <strong>${data.time.split(', ')[0]}</strong>\n`
        caption += `🕐 <strong>${data.time.split(', ')[1]}</strong>\n`
        caption += `💢 <strong>${data.magnitude} SR</strong>\n`
        caption += `🌎 <strong>${data.location}</strong>\n`
        caption += `🕐 Kedalaman: <strong>${data.depth}</strong>\n\n`
        caption += `<strong>${data.status}</strong>\n`
        try {
            await axios.post(process.env.TELEGRAM_BOT_ENDPOINT + 'sendPhoto?parse_mode=html', JSON.stringify(
                {
                    "chat_id": chatId,
                    "photo": data.imageUri,
                    "caption": caption
                }
            ), {
                headers: { 'Content-Type': 'application/json' }
            });

            resolve()
        } catch (error) {
            reject(error)
        }
    })
}

cron.schedule('*/60 * * * * *', async () => {
    if (isRunning) return

    const { data } = await axios.get('https://www.bmkg.go.id/');
    const { document } = new JSDOM(data).window;
    const container = document.querySelector('.gempabumi-home-bg');
    const imageUri = container.querySelector('img').getAttribute('src');

    const detailContainer = container.querySelectorAll('.gempabumi-detail.no-padding>ul>li');
    const time = detailContainer[0].textContent;
    const magnitude = detailContainer[1].textContent;
    const depth = detailContainer[2].textContent;
    const location = detailContainer[3].textContent;
    const locationName = detailContainer[4].textContent;
    const status = detailContainer[5].textContent;

    if (latest === location) return console.log('Gempa terbaru tidak terdeteksi');
    latest = location

    let { data: users, error } = await supabase
        .from('users_queue')
        .select('*')

    if (error) return console.log(error);
    if (users.length < 1) return console.log('Pengguna tidak ditemukan');

    await Promise.all(users.map(user => sendPhoto(user.chat_id, { imageUri, time, magnitude, depth, location, locationName, status })))
})

