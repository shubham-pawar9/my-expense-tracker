// utils/voiceParser.ts
export type ParsedExpense = {
    amount: number
    category: string
}

export function parseVoiceCommand(text: string): ParsedExpense | null {
    const cleaned = text.toLowerCase().trim()

    // Regex examples:
    // add 200 in food
    // add 150 to travel
    const regex = /add\s+(\d+)\s+(in|to)?\s*(\w+)/

    const match = cleaned.match(regex)

    if (!match) return null

    return {
        amount: Number(match[1]),
        category: match[3],
    }
}
