import fs from 'fs'
import fetch from 'node-fetch'

const email = {
    "body": "Receipt for Your Payment to Zapier, Inc.\n\n/**\n\n* PayPal-Open Fonts\n\n*/\n\n/* Body text - font-weight:400 */\n\n@font-face {\n\nfont-family: PayPal-Open;\n\nfont-style: normal;\n\nfont-weight: 400;\n\nsrc: url('https://www.paypalobjects.com/digitalassets/c/system-triggered-email/n/layout/fonts/PayPalOpen/PayPalOpen-Regular.otf') format(\"opentype\");\n\n/* IE9 Compat Modes */\n\nsrc: url('https://www.paypalobjects.com/digitalassets/c/system-triggered-email/n/layout/fonts/PayPalOpen/PayPalOpen-Regular.woff2') format('woff2'),\n\n/*Moderner Browsers*/\n\nurl('https://www.paypalobjects.com/digitalassets/c/system-triggered-email/n/layout/fonts/PayPalOpen/PayPalOpen-Regular.woff') format('woff');\n\n/* Modern Browsers */\n\n/* Fallback font for - MS Outlook older versions (2007,13, 16)*/\n\nmso-font-alt: 'Calibri';\n\n}\n\n/* Headline/Subheadline/Button text font-weight:500 */\n\n@font-face {\n\nfont-family: PayPal-Open;\n\nfont-style: normal;\n\nfont-weight: 500;\n\nsrc: url('https://www.paypalobjects.com/digitalassets/c/system-triggered-email/n/layout/fonts/PayPalOpen/PayPalOpen-Medium.otf') format(\"opentype\");\n\n/* IE9 Compat Modes */\n\nsrc: url('https://www.paypalobjects.com/digitalassets/c/system-triggered-email/n/layout/fonts/PayPalOpen/PayPalOpen-Medium.woff2') format('woff2'),\n\n/*Moderner Browsers*/\n\nurl('https://www.paypalobjects.com/digitalassets/c/system-triggered-email/n/layout/fonts/PayPalOpen/PayPalOpen-Medium.woff') format('woff');\n\n/* Modern Browsers */\n\n/* Fallback font for - MS Outlook older versions (2007,13, 16)*/\n\nmso-font-alt: 'Calibri';\n\n}\n\n/* Bold text - , Bold equals to font-weight:700 */\n\n@font-face {\n\nfont-family: PayPal-Open;\n\nfont-style: normal;\n\nfont-weight: 700;\n\nsrc: url('https://www.paypalobjects.com/digitalassets/c/system-triggered-email/n/layout/fonts/PayPalOpen/PayPalOpen-Bold.otf') format(\"opentype\");\n\n/* IE9 Compat Modes */\n\nsrc: url('https://www.paypalobjects.com/digitalassets/c/system-triggered-email/n/layout/fonts/PayPalOpen/PayPalOpen-Bold.woff2') format('woff2'),\n\n/*Moderner Browsers*/\n\nurl('https://www.paypalobjects.com/digitalassets/c/system-triggered-email/n/layout/fonts/PayPalOpen/PayPalOpen-Bold.woff') format('woff');\n\n/* Modern Browsers */\n\n/* Fallback font for - MS Outlook older versions (2007,13, 16)*/\n\nmso-font-alt: 'Calibri';\n\n}\n\n/* End - PayPal-Open Fonts */\n\n/**\n\n* VX-LIB Styles\n\n* Import only the styles required for Email templates.\n\n*/\n\n@charset \"UTF-8\";\n\nhtml {\n\nbox-sizing: border-box;\n\n}\n\n*,\n\n*:before,\n\n*:after {\n\nbox-sizing: inherit;\n\n}\n\n/* Setting these elements to height of 100% ensures that\n\n* .vx_foreground-container fully covers the whole viewport\n\n*/\n\nhtml,\n\nbody {\n\nheight: 100%;\n\n}\n\nbody {\n\nfont-size: 14px !important;\n\nfont-family: PayPal-Open, 'Helvetica Neue', Helvetica, Arial, sans-serif;\n\n-webkit-font-smoothing: antialiased;\n\n-moz-osx-font-smoothing: grayscale;\n\nfont-smoothing: antialiased;\n\n}\n\na,\n\na:visited {\n\ncolor: #0070E0;\n\ntext-decoration: none;\n\nfont-weight: 500;\n\nfont-family: PayPal-Open, 'Helvetica Neue', Helvetica, Arial, sans-serif;\n\n}\n\na:active,\n\na:focus,\n\na:hover {\n\ncolor: #003087;\n\ntext-decoration: underline;\n\n}\n\np,\n\nli,\n\ndd,\n\ndt,\n\nlabel,\n\ninput,\n\ntextarea,\n\npre,\n\ncode,\n\ntable {\n\nfont-size: 14px;\n\nline-height: 1.6;\n\nfont-weight: 400;\n\ntext-transform: none;\n\nfont-family: PayPal-Open, 'Helvetica Neue', Helvetica, Arial, sans-serif;\n\ncolor: #001435;\n\n}\n\n.vx_legal-text {\n\nfont-size: 0.8125rem;\n\nline-height: 1.38461538;\n\nfont-weight: 400;\n\ntext-transform: none;\n\nfont-family: PayPal-Open, 'Helvetica Neue', Helvetica, Arial, sans-serif;\n\ncolor: #6c7378;\n\n}\n\n/* End - VX-LIB Styles */\n\n/**\n\n* Styles from Neptune\n\n*/\n\n/* prevent iOS font upsizing */\n\n* {\n\n-webkit-text-size-adjust: none;\n\n}\n\n/* force Outlook.com to honor line-height */\n\n.ExternalClass * {\n\nline-height: 100%;\n\n}\n\ntd {\n\nmso-line-height-rule: exactly;\n\n}\n\n/* prevent iOS auto-linking */\n\n/* Android margin fix */\n\nbody {\n\nmargin: 0;\n\npadding: 0;\n\n}\n\ndiv[style*=\"margin: 16px 0\"] {\n\nmargin: 0 !important;\n\n}\n\n/** Prevent Outlook Purple Links **/\n\n.greyLink a:link {\n\ncolor: #949595;\n\n}\n\n/* prevent iOS auto-linking */\n\n.applefix a {\n\n/* use on a span around the text */\n\ncolor: inherit;\n\ntext-decoration: none;\n\n}\n\n.ppsans {\n\nfont-family: PayPal-Open, 'Helvetica Neue', Helvetica, Arial, sans-serif !important;\n\n}\n\n/* use to make image scale to 100 percent */\n\n.mpidiv img {\n\nwidth: 100%;\n\nheight: auto;\n\nmin-width: 100%;\n\nmax-width: 100%;\n\n}\n\n.stackTbl {\n\nwidth: 100%;\n\ndisplay: table;\n\n}\n\n.offer-logo {\n\nborder-radius: 25px;\n\n}\n\n.offer-subtitle {\n\nfont-weight: 600 !important;\n\n}\n\n/* Responsive CSS */\n\n@media screen and (max-width: 640px) {\n\n/*** Image Width Styles ***/\n\n.imgWidth {\n\nwidth: 20px !important;\n\n}\n\n}\n\n@media screen and (max-width: 480px) {\n\n/*** Image Width Styles ***/\n\n.imgWidth {\n\nwidth: 10px !important;\n\n}\n\n}\n\n/* End - Responsive CSS */\n\n/* Responsive CSS PayPal Offers */\n\n@media screen and (min-width: 640px) {\n\n.offer-logo {\n\nwidth: 35px !important;\n\nheight: 35px !important;\n\nobject-fit: contain;\n\n}\n\n.offer-card-4th {\n\ndisplay: auto !important;\n\n}\n\n.offer-card-5th {\n\ndisplay: auto !important;\n\n}\n\n.offer-title {\n\nfont-size: 10pt !important;\n\n}\n\n.offer-subtitle {\n\nfont-size: 8pt !important;\n\n}\n\n.offer-cta {\n\nwidth: 30px !important;\n\nheight: 30px !important;\n\nfloat: right;\n\n}\n\n.offer-table td {\n\nmin-width: 100px;\n\n}\n\n}\n\n@media (min-width: 520px) and (max-width: 639px) {\n\n.offer-logo {\n\nwidth: 35px !important;\n\nheight: 35px !important;\n\nobject-fit: contain;\n\n}\n\n.offer-card-4th {\n\ndisplay: auto !important;\n\n}\n\n.offer-card-5th {\n\ndisplay: none !important;\n\n}\n\n.offer-title {\n\nfont-size: 10pt !important;\n\n}\n\n.offer-subtitle {\n\nfont-size: 8pt !important;\n\n}\n\n.offer-cta {\n\nwidth: 30px !important;\n\nheight: 30px !important;\n\nfloat: right;\n\n}\n\n.offer-table td {\n\nmin-width: 100px;\n\n}\n\n}\n\n@media screen and (max-width: 519px) {\n\n/*** Image Width Styles ***/\n\n.imgWidth {\n\nwidth: 10px !important;\n\n}\n\n.offer-logo {\n\nwidth: 25px !important;\n\nheight: 25px !important;\n\nobject-fit: contain;\n\n}\n\n.offer-card-4th {\n\ndisplay: none !important;\n\n}\n\n.offer-card-5th {\n\ndisplay: none !important;\n\n}\n\n.offer-title {\n\nfont-size: 9pt !important;\n\n}\n\n.offer-subtitle {\n\nfont-size: 7pt !important;\n\n}\n\n.offer-cta {\n\nwidth: 20px !important;\n\nheight: 20px !important;\n\nfloat: right;\n\n}\n\n.offer-table td {\n\nmin-width: 80px;\n\n}\n\n}\n\n/* End Responsive CSS PayPal Offers */\n\n/* Fix for Neptune partner logo */\n\n.partner_image {\n\nmax-width: 250px;\n\nmax-height: 90px;\n\ndisplay: block;\n\n}\n\n/* End - Styles from Neptune */\n\n/**\n\n* Styles - overrides for PayPal rebranding\n\n*/\n\nhtml,\n\nbody {\n\nbackground: #FAF8F5;\n\ncolor: #001435;\n\nfont-size: 14px;\n\nline-height: 1.6;\n\n}\n\n.footerDivider {\n\nmargin: 0px 35px;\n\n}\n\n/* Button */\n\ntd.paypal-button-primary:hover {\n\n/*Setting border to td would increase the buttton size on hover */\n\nbackground-color: #0070E0 !important;\n\n}\n\na.paypal-button-primary:hover {\n\nbackground-color: #0070E0 !important;\n\nborder: 2px solid #0070E0 !important;\n\n}\n\na.paypal-button-secondary:hover {\n\nborder: 2px solid #0070E0 !important;\n\ncolor: #0070E0 !important;\n\n}\n\n/**\n\n* Styles for Dark mode\n\n*/\n\n@media (prefers-color-scheme: dark) {\n\n/* Wrap entire logo with border */\n\n.footerDivider {\n\nmargin-left: 0px\n\n}\n\n}\n\nJeremy School, you successfully sent a payment.\n\nHello, Jeremy School\n\nYou sent a payment of $58.50 USD to Zapier, Inc.\n\nView or Manage Payment\n\nIt may take a few moments for this transaction to appear in your account.\n\nTransaction ID\n\n9K716797XY135811E\n\nTransaction date\n\nJan 18, 2023 11:18:16 PST\n\nMerchant\n\nZapier, Inc.\n\nInstructions to merchant\n\nYou haven't entered any instructions.\n\nInvoice ID\n\n0185c651-4cb8-f8c6-6cae-4daafb285a99\n\nDescription\n\nUnit price\n\nQty\n\nAmount\n\nStarter (1,500 Tasks) (monthly)\n\n$58.50 USD\n\n1\n\n$58.50 USD\n\nSubtotal\n\n$58.50 USD\n\nTotal\n\n$58.50 USD\n\nPayment\n\n$58.50 USD\n\nCharge will appear on your credit card statement as \"PAYPAL *ZAPIER INC\"\n\nPayment sent from jschool504@gmail.com\n\nFunding Sources Used (Total)\n\nAmerican Express x-8128\n\n$58.50 USD\n\nView or Manage Payment\n\nIssues with this transaction?\n\nYou have 180 days from the date of the transaction to open a dispute in the Resolution Center.\n\nHelp & Contact | Security | Apps\n\nPayPal is committed to preventing fraudulent emails. Emails from PayPal will always contain your full name. Learn to identify phishing\n\nPlease don't reply to this email. To get in touch with us, click Help & Contact .\n\nPayPal Customer Service can be reached at 888-221-1161.\n\nNot sure why you received this email? Learn more\n\nCopyright © 1999-2023 PayPal, Inc. All rights reserved. PayPal is located at 2211 N. First St., San Jose, CA 95131.\n\nPayPal RT000016:en_US(en-US):1.5.0:2782a280b6f04",
    "body_en_US": "en-US",
    "body_format": "'woff'",
    "body_url": "'https://www.paypalobjects.com/digitalassets/c/system-triggered-email/n/layout/fonts/PayPalOpen/PayPalOpen-Bold.woff'",
    "date": "Wed, 18 Jan 2023 11:18:47 -0800",
    "subject": "Receipt for Your Payment to Zapier, Inc."
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