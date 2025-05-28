import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { FeedbackData } from '@/lib/context/AppContext'; // Adjusted path for Next.js alias

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});



export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { transcript, duration } = body;
    // In src/app/api/generate-feedback/route.ts, within the try block:
    
    //console.log("--- WPM DEBUG START ---");
    //console.log("Received Full Request Body:", JSON.stringify(body)); // Log the whole body
    //console.log("Received Transcript (type):", typeof transcript);
    //console.log("Received Transcript (raw):", transcript); // Log the exact transcript string
    // For more detailed inspection of the string:
    // console.log("Received Transcript (char codes):", transcript.split('').map(c => c.charCodeAt(0)).join(', '));
    console.log("Received Duration (seconds):", duration);

    // Test the split directly
    const wordsArray = transcript.split(/\s+/);
    //console.log("Words array (after split):", JSON.stringify(wordsArray));
    const filteredWordsArray = wordsArray.filter(Boolean);
    //console.log("Filtered words array (after filter):", JSON.stringify(filteredWordsArray));
    const wordCount = filteredWordsArray.length; // Define wordCount here from the filtered array
    //console.log("Calculated wordCount (from debug block):", wordCount);

    if (!transcript || typeof transcript !== 'string' || transcript.trim() === '') {
      return NextResponse.json({ error: 'Transcript is required and must be a non-empty string.' }, { status: 400 });
    }
    if (duration === undefined || typeof duration !== 'number' || duration <= 0) {
      return NextResponse.json({ error: 'Duration is required and must be a positive number.' }, { status: 400 });
    }

    // Calculate WPM
    // const wordCount = transcript.split(/\s+/).filter(Boolean).length; // THIS IS THE DUPLICATE - REMOVE/COMMENT OUT
    // console.log("Calculated wordCount:", wordCount); // This log is fine if wordCount is defined above
    const durationInMinutes = duration / 60;
    //console.log("Calculated durationInMinutes:", durationInMinutes);
    const calculatedWpm = durationInMinutes > 0 ? Math.round(wordCount / durationInMinutes) : 0;
    //console.log("Calculated WPM (before sending to LLM):", calculatedWpm);
    //console.log("--- WPM DEBUG END ---");

    // Note: The type definition for FeedbackData is provided within the prompt for clarity to the LLM.
    // The import { FeedbackData } from '@/lib/context/AppContext'; is for type safety within this route handler.
    const prompt = `
      You are an expert speech coach. Analyze the following speech transcript and provide detailed feedback.
      The user was asked to speak on a topic for approximately 2 minutes (120 seconds).
      Transcript: "${transcript}"
      Actual speech duration: ${duration} seconds.
      Word count: ${wordCount} words.
      Calculated Words Per Minute (WPM): ${calculatedWpm}.
      The target WPM is generally between 140-160 for effective public speaking.

      Your entire response MUST be a single, valid JSON object that strictly adheres to the following TypeScript type structure:
      \`\`\`typescript
      type FeedbackData = {
        structure: {
          score: number; // Score out of 10
          comments: string;
          examples: string; // Provide examples of how the speaker could have improved their structure
        };
        coherence: {
          score: number; // Score out of 10
          comments: string;
          examples: string; // Provide examples of how the speaker could have improved their coherence
        };
        speed: {
          wordsPerMinute: number; // This MUST be the calculatedWpm: ${calculatedWpm}
          comments: string; // Comments on the WPM based on target range
        };
        fillerWords: {
          count: number; // Total count of common filler words
          examples: string[]; // Array of unique filler words found (e.g., ["um", "like", "so", "you know"]). Empty array if none.
          comments: string;
        };
        repetition: {
          instances: number; // Count of noticeably repetitive phrases or ideas
          examples: string[]; // Array of example repetitive phrases/ideas (e.g., ["as I said before"]). Empty array if none.
          comments: string;
        };
        timeManagement: {
          score: number; // Score out of 10, considering the 2-minute target
          comments: string;
        };
        overallFeedback: string; // A summary of overall performance and key improvement areas. Suggest 1-2 actionable steps for the speaker to improve based on the feedbackdata
      };
      \`\`\`
      
      Specific Instructions:
      - Provide specific, constructive comments and objective scores where applicable.
      - For 'fillerWords': Identify common English filler words like 'um', 'uh', 'ah', 'er', 'like', 'you know', 'so', 'actually', 'basically', 'literally', 'right', 'well'. Provide a total count. 'examples' should be an array of unique filler words found (e.g., ["um", "like"]); if no filler words are found, 'count' must be 0 and 'examples' must be an empty array [].
      - For 'repetition': Identify phrases or core ideas repeated unnecessarily. Provide a count of such instances. 'examples' should be an array of these phrases/ideas (e.g., ["as I said before", "the main point is"]); if no repetitions are found, 'instances' must be 0 and 'examples' must be an empty array [].
      - For 'timeManagement': Evaluate how well the speaker utilized the approximate 2-minute target.
      - For 'speed': The 'wordsPerMinute' field in your JSON response MUST be exactly ${calculatedWpm}. Base your 'comments' on this WPM.
      - Do not include any text outside of the main JSON object. Ensure the JSON is well-formed.
    `;

     console.log("Sending prompt to OpenAI:", prompt); // Uncomment for debugging the prompt

    const llmResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.2, // Lower temperature for more deterministic JSON and factual feedback
    });

    if (!llmResponse.choices || !llmResponse.choices[0] || !llmResponse.choices[0].message.content) {
      console.error('Invalid response structure from OpenAI API:', llmResponse);
      throw new Error('Invalid response structure from OpenAI API');
    }

    const feedbackJsonString = llmResponse.choices[0].message.content;
    // console.log("Received JSON string from OpenAI:", feedbackJsonString); // Uncomment for debugging

    let parsedFeedback: FeedbackData;
    try {
      parsedFeedback = JSON.parse(feedbackJsonString);
    } catch (e: any) {
      console.error("Error parsing JSON from OpenAI:", e, "Raw JSON string:", feedbackJsonString);
      throw new Error(`Failed to parse feedback JSON from OpenAI. Received: ${feedbackJsonString}. Error: ${e.message}`);
    }

    // Final validation and cleanup of the parsed feedback to ensure conformity
    parsedFeedback.speed = {
      ...parsedFeedback.speed, // Keep comments from LLM
      wordsPerMinute: calculatedWpm, // Enforce our calculated WPM
    };

    parsedFeedback.fillerWords = {
      count: parsedFeedback.fillerWords?.count || 0,
      examples: Array.isArray(parsedFeedback.fillerWords?.examples) ? parsedFeedback.fillerWords.examples : [],
      comments: parsedFeedback.fillerWords?.comments || "No specific comments on filler words.",
    };
    
    parsedFeedback.repetition = {
      instances: parsedFeedback.repetition?.instances || 0,
      examples: Array.isArray(parsedFeedback.repetition?.examples) ? parsedFeedback.repetition.examples : [],
      comments: parsedFeedback.repetition?.comments || "No specific comments on repetition.",
    };
    
    // Ensure all required top-level keys exist, providing defaults if absolutely necessary
    const requiredKeys: Array<keyof FeedbackData> = ['structure', 'coherence', 'speed', 'fillerWords', 'repetition', 'timeManagement', 'overallFeedback'];
    for (const key of requiredKeys) {
        if (!(key in parsedFeedback)) {
            console.warn(`[API generate-feedback] LLM response was missing key: ${key}.`);
            // Add a very basic default to prevent crashes, though this indicates a prompt/LLM issue.
            // @ts-ignore
            parsedFeedback[key] = { score: 0, comments: "Data missing from AI response." }; 
            if (key === 'overallFeedback') (parsedFeedback as any)[key] = "Overall feedback missing from AI response.";
            if (key === 'fillerWords' || key === 'repetition') (parsedFeedback as any)[key].examples = [];
            if (key === 'speed') (parsedFeedback as any)[key].wordsPerMinute = calculatedWpm;
        }
    }


    return NextResponse.json(parsedFeedback);

  } catch (error: any) {
    console.error('[API generate-feedback] Error:', error);
    let errorMessage = 'An unexpected error occurred while generating feedback.';
    let errorStatus = 500;

    if (error instanceof OpenAI.APIError) {
      errorMessage = error.message || 'Error from OpenAI API';
      errorStatus = error.status || 500;
    } else if (error.message && error.message.toLowerCase().includes('json')) {
      errorMessage = `Error processing AI response: ${error.message}`;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    const errorDetail = error.cause instanceof Error ? error.cause.message : (error.message || 'No additional details');
    return NextResponse.json({ error: errorMessage, details: String(errorDetail) }, { status: errorStatus });
  }
} 