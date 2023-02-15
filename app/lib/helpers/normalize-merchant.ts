const GeneralModifiers = {
    StripTrailingPeriods: (merchant: string) => merchant.endsWith('.') ? merchant.slice(0, merchant.length - 2) : merchant
}


const createMerchantNameNormalizer = (merchants: string[]) => {

    const referenceList = merchants.map(m => {
        return GeneralModifiers.StripTrailingPeriods(m)
    })

    return (merchant: string) => {
        const normalized = merchant.toLowerCase().replaceAll(/[^a-z]+/g, '')
        const match = referenceList.find(ref => ref.toLowerCase().replaceAll(/[^a-z]+/g, '').includes(normalized))
    
        if (match) {
            return match
        }
    
        let out: { originalCandidate: string, candidate: string, uniqueChars: string[], commonChars: number, excessChars: number, lengthDiff: number, substringMatches: number, score: number }[] = []
        out = referenceList.map((originalRef: string) => {
            const ref = originalRef.toLowerCase().replaceAll(/[^a-z]+/g, '')
    
            const uniqueRefChars = Array.from(new Set([...ref]))
            const uniqueMerchChars = Array.from(new Set([...normalized]))
    
            const commonChars = uniqueRefChars.filter(r => uniqueMerchChars.includes(r)).length
    
            const excessChars = uniqueRefChars.filter(r => !normalized.includes(r)).length
    
            const lengthDiff = Math.abs(normalized.length - ref.length)
    
            const subStringsFromStart = [...normalized].map((char, idx) => normalized.substring(0, idx))
            const subStringsFromEnd = [...normalized].map((char, idx) => {
                return normalized.substring(normalized.length - idx, normalized.length)
            })
            
            const merchantSubstrings = [...subStringsFromStart, ...subStringsFromEnd].filter(a => a && a.length > 1)
            const substringMatches = merchantSubstrings.filter((sub) => ref.includes(sub))
            const substringScore = substringMatches.length / merchantSubstrings.length
    
            return {
                originalCandidate: originalRef,
                candidate: ref,
                uniqueChars: uniqueRefChars,
                commonChars: commonChars,
                excessChars: excessChars,
                lengthDiff: lengthDiff,
                substringMatches: substringMatches.length,
                score: (
                    substringScore
                    + commonChars / (commonChars + excessChars) * 0.5
                    + 1 - (excessChars / (commonChars + excessChars)) * 0.5
                )
            }
        })
    
        out.sort((a, b) => ({
            'true': 1,
            'false': -1,
        }[(a.score < b.score).toString()]))
    
    
        if (out[0].score < 1.5) {
            return null
        }
    
        return out[0].originalCandidate
    }
}

export default createMerchantNameNormalizer
