# Speechninja - Speech Training Application

A training application to help improve impromptu speaking skills through practice and AI-powered feedback.

## Requirements

### Functional Requirements

1. **Difficulty Selection**
   - Provide option to select different difficulty levels (Easy, Medium, Hard)
   - Default to Easy level

2. **Speech Practice Flow**
   - Provide a topic based on the difficulty selected along with 10-second preparation countdown. Display the topic prominently.
   - 2-minute speech recording with visual countdown. Topic continues to be displayed.
   - Visual indicator for recording status (red recording symbol with sound wave)
   - Visual warning when 30 seconds remain (yellow countdown)
   - Option to cancel session at any point

3. **Speech Analysis**
   - Real-time speech-to-text conversion
   - LLM-powered feedback on:
     - Speech structure
     - Coherence and clarity
     - Speaking pace (140-150 words per minute target)
     - Filler word usage
     - Repetitive sentence detection
     - Time management

4. **User Interface**
   - Responsive design for both desktop and mobile browsers
   - Simple, intuitive navigation
   - Visual feedback during recording
   - Option to copy feedback to clipboard

### Non-Functional Requirements

1. **Performance**
   - Fast speech-to-text processing
   - Minimal latency for feedback generation

2. **Usability**
   - Intuitive interface requiring minimal instruction
   - Clear visual cues for timing and recording status

3. **Compatibility**
   - Cross-browser support
   - Responsive design for various screen sizes

## Tech Stack

### Frontend
- Framework: Next.js with TypeScript
- Styling: Tailwind CSS for responsive design
- UI Components: Shadcn UI for consistent, accessible components
- State Management: React Context API

### Backend
- Runtime: Node.js with Express
- API: RESTful endpoints for handling speech processing and feedback

### Speech Processing
- Speech-to-Text: OpenAI Whisper API
- Feedback Generation: OpenAI GPT-4o
- OpenAI API key is in the OS itself

### Deployment
- Local Development: Next.js development server
- Production: Vercel (frontend) and Railway/Render (backend if needed)

## Implementation Milestones

### Milestone 1: Project Setup and Basic UI
- Initialize Next.js project with TypeScript
- Set up Tailwind CSS and Shadcn UI
- Create responsive layouts for all pages
- Implement difficulty selection and basic navigation

### Milestone 2: Timer and Recording Functionality
- Implement 10-second preparation countdown
- Create 2-minute speech timer with color change at 1:30
- Develop audio recording functionality
- Design and implement sound wave visualization

### Milestone 3: Speech-to-Text Integration
- Integrate speech recognition API
- Implement real-time transcription
- Store speech text for analysis
- Add error handling for speech recognition

### Milestone 4: Feedback Generation
- Integrate with LLM API (OpenAI)
- Design prompt engineering for speech analysis
- Implement feedback generation based on specified metrics
- Create feedback display page with copy functionality

### Milestone 5: Testing and Refinement
- Conduct user testing for usability
- Optimize speech recognition accuracy
- Refine feedback quality and relevance
- Fix bugs and performance issues
- Prepare for deployment 
