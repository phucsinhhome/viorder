/*
 * Install the Generative AI SDK
 *
 * $ npm install @google/generative-ai
 *
 * See the getting started guide for more information
 * https://ai.google.dev/gemini-api/docs/get-started/node
 */

const {
    GoogleGenerativeAI,
    // HarmCategory,
    // HarmBlockThreshold,
} = require("@google/generative-ai");

const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
});

const generationConfig = {
    temperature: 1,
    topP: 0.95,
    topK: 64,
    maxOutputTokens: 8192,
    responseMimeType: "application/json",
};

var chatSession = null

async function run(expenseMessage) {

    if (chatSession == null) {
        console.warn("API Key" + apiKey)
        chatSession = model.startChat({
            generationConfig,
            // safetySettings: Adjust safety settings
            // See https://ai.google.dev/gemini-api/docs/safety-settings
            history: [
                {
                  role: "user",
                  parts: [
                    {text: "As a accountant, I need you to analyze the chat message and extract daily expense with following data fields: \nitem name\nquantity could be kilogram, gram, number\nprice in VND.\nThese are some examples\n\"5kg sugar 560k\" means \"item: Sugar, quantity: 5, unit: kg, price: 560000\"\n\"560 sugar for 5kg\" means \"item: Sugar, quantity: 5, unit: kg, price: 560000\"\n\"sugar 5kg 560\" means \"item: Sugar, quantity: 5, unit: kg, price: 560000\"\n\"sugar 5g 560\" means \"item: Sugar, quantity: 5, unit: g, price: 560000\"\n\"5 buckets 230\" means \"item: Bucket, quantity: 5,  unit: count,price: 230000\"\n\"Can oil 5L 160\" means \"item: Oil 5L, quantity: 1,  unit: count,price: 160000\"\nPlease try to extract expense in message and format the item name with sentence case"},
                  ],
                },
                {
                  role: "model",
                  parts: [
                    {text: "{\"expenses\": [{\"item\": \"Sugar\", \"quantity\": 5, \"unit\": \"kg\", \"price\": 560000}, {\"item\": \"Sugar\", \"quantity\": 5, \"unit\": \"kg\", \"price\": 560000}, {\"item\": \"Sugar\", \"quantity\": 5, \"unit\": \"kg\", \"price\": 560000}, {\"item\": \"Sugar\", \"quantity\": 5, \"unit\": \"g\", \"price\": 560000}, {\"item\": \"Bucket\", \"quantity\": 5, \"unit\": \"count\", \"price\": 230000}, {\"item\": \"Oil 5L\", \"quantity\": 1, \"unit\": \"count\", \"price\": 160000}]}\n"},
                  ],
                },
                {
                  role: "user",
                  parts: [
                    {text: "I bought 3g sugar with 460k today"},
                  ],
                },
                {
                  role: "model",
                  parts: [
                    {text: "{\"expenses\": [{\"item\": \"Sugar\", \"quantity\": 3, \"unit\": \"g\", \"price\": 460000}]}\n"},
                  ],
                },
                {
                  role: "user",
                  parts: [
                    {text: "I buy 5 buckets with 460k"},
                  ],
                },
                {
                  role: "model",
                  parts: [
                    {text: "{\"expenses\": [{\"item\": \"Bucket\", \"quantity\": 5, \"unit\": \"count\", \"price\": 460000}]}\n"},
                  ],
                },
                {
                  role: "user",
                  parts: [
                    {text: "Bottle of Mezan 5L 700k"},
                  ],
                },
                {
                  role: "model",
                  parts: [
                    {text: "{\"expenses\": [{\"item\": \"Mezan 5L\", \"quantity\": 1, \"unit\": \"count\", \"price\": 700000}]}\n\n"},
                  ],
                },
                {
                  role: "user",
                  parts: [
                    {text: "2 bottles of Mezan 5L cost 1200k"},
                  ],
                },
                {
                  role: "model",
                  parts: [
                    {text: "{\"expenses\": [{\"item\": \"Mezan 5L\", \"quantity\": 2, \"unit\": \"count\", \"price\": 1200000}]}\n"},
                  ],
                },
                {
                  role: "user",
                  parts: [
                    {text: "2 Mezan 5L 1200k"},
                  ],
                },
                {
                  role: "model",
                  parts: [
                    {text: "{\"expenses\": [{\"item\": \"Mezan 5L\", \"quantity\": 2, \"unit\": \"count\", \"price\": 1200000}]}\n"},
                  ],
                },
                {
                  role: "user",
                  parts: [
                    {text: "2 Mezan 5L 1,2 million"},
                  ],
                },
                {
                  role: "model",
                  parts: [
                    {text: "{\"expenses\": [{\"item\": \"Mezan 5L\", \"quantity\": 2, \"unit\": \"count\", \"price\": 1200000}]}\n"},
                  ],
                },
                {
                  role: "user",
                  parts: [
                    {text: "15kg đường cát trắng"},
                  ],
                },
                {
                  role: "model",
                  parts: [
                    {text: "{\"expenses\": [{\"item\": \"Đường cát trắng\", \"quantity\": 15, \"unit\": \"kg\", \"price\": null}]}\n"},
                  ],
                },
              ],
        });
    }

    const result = await chatSession.sendMessage(expenseMessage);
    console.log("EXTRACTION DONE");

    return result.response.text();
}

export default run