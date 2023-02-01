// import path from 'path'
import { Image, ThresholdAlgorithm } from 'image-js'
import tesseract from 'node-tesseract-ocr'

// const filepath = path.join(
//   __dirname,
//   "test",
//   "fixtures",
//   "node-native-ocr.jpg"
// )

const config = {
    lang: 'eng',
    oem: 1,
    psm: 4
}

const imageName = 'tmp/AgACAgEAAxkBAAIFxWPUFCBiTc9jYldif9WA7-qpOnnmAAL5qzEbzZqhRvY_NfYUnwa0AQADAgADeQADLQQ'

const main = async () => {
    const receiptImage = await Image.load(imageName + '.jpg')

    const l = [
        'maxentropy',
        'otsu',
        'renyientropy',
        'intermodes',
        'isodata',
        'shanbhag',
        'triangle',
        'yen'
    ].forEach(type => {
        const modifiedImage = receiptImage
            .grey({
                // @ts-ignore
                algorithm: 'lightness'
            })
            .mask({
                // @ts-ignore
                // algorithm: 'maxentropy'
                // algorithm: 'otsu'
                // algorithm: 'renyientropy'
                // algorithm: 'intermodes'
                // algorithm: 'isodata'
                // algorithm: 'shanbhag'
                // algorithm: 'triangle'
                algorithm: type
            })
    
        modifiedImage.save(type + '.jpg')
    
        const receiptImageBuffer = Buffer.from(modifiedImage.toBuffer())
    
        tesseract
            .recognize(receiptImageBuffer, config)
            .then(text => console.log('result', text))
            .catch(console.error)
    })

}

main()
