import fs from 'fs'
import fetch from 'node-fetch'

const email = {
    subject: 'Receipt from LOWES.COM for your $100.58 USD purchase',
    date: 'Mon, 2 Jan 2023 13:26:31 -0800',
    body: fs.readFileSync(`app/lib/helpers/test-data/lowes.html`).toString()
}

fetch('http://localhost:8000/emails', {
    method: 'post',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(email)
})
.then(r => r.json()
    .then(console.log))
.catch(console.error)