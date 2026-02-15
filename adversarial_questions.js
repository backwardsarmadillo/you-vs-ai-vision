// adversarial_questions.js
// A bank of "Anti-LLM" Riddles and Logic Puzzles designed to trick AI models.
// These rely on inverse logic, context traps, and literalism to break standard training patterns.

const adversarialData = {
  logic: [
    {
      prompt: "A man is found dead in a garage with 53 bicycles. There are NO playing cards in the room. The bikes are Schwinns. How did he die?",
      options: ["Cheating at cards", "Carbon Monoxide Poisoning", "Bicycle accident", "Heart attack"],
      answer: 1 // Trick: The '53 bicycles' usually implies a deck of cards (52 + joker), but here it's literal bikes in a garage.
    },
    {
      prompt: "You add 3 spoonfuls of sugar to a hot cup of coffee but do NOT stir it. You take a sip immediately from the top. What does it taste like?",
      options: ["Sweet", "Bitter / Black", "Creamy", "Salty"],
      answer: 1 // Trick: Physics. Sugar sinks to the bottom if not stirred. Top is still bitter.
    },
    {
      prompt: "Three guards stand before a door. They lie only on days that start with 'T'. Today is Tuesday, but it is also a National Holiday where no one works. You walk up and ask them, 'Is the door safe?' What do they answer?",
      options: ["Yes", "No", "Nothing (Silence)", "Maybe"],
      answer: 2 // Trick: Context. 'No one works' implies the guards are absent. Logic tables don't apply if they aren't there.
    },
    {
      prompt: "What walks on four legs in the morning, two legs at noon, and three legs in the evening, but is NOT a human?",
      options: ["A Human", "Nothing / A Monster", "A Baby", "A Dog"],
      answer: 1 // Trick: Anti-Trope. The Sphinx riddle answer is *defined* as Human. If the premise excludes Human, the riddle has no real-world answer.
    },
    {
      prompt: "If you are running a race and you pass the person in 2nd place, what place are you in?",
      options: ["1st", "2nd", "3rd", "Last"],
      answer: 1 // Trick: Common logic error. You take the place of the person you passed (2nd), you don't become 1st.
    },
    {
      prompt: "A plane crashes exactly on the border of the United States and Canada. Where do they bury the survivors?",
      options: ["United States", "Canada", "On the border", "They don't"],
      answer: 3 // Trick: Wordplay. You don't bury 'survivors'.
    },
    {
      prompt: "The day before two days after the day before tomorrow is Saturday. What day is it today?",
      options: ["Friday", "Saturday", "Sunday", "Monday"],
      answer: 0 // Trick: Convoluted temporal logic. Tomorrow-1 = Today. Today+2 = Day After Tomorrow. Day Before that = Tomorrow. Tomorrow = Sat -> Today = Fri.
    },
    {
      prompt: "Which is heavier: A pound of lead or a pound of feathers?",
      options: ["Lead", "Feathers", "They are equal", "Lead (due to density)"],
      answer: 2 // Trick: Classic physics trap. Mass is equal.
    },
    {
      prompt: "I have a tail and a head, but no body. I am NOT a coin. What am I?",
      options: ["A Coin", "A Snake", "A Comet", "A Prince"],
      answer: 2 // Trick: Anti-Trope. Standard riddle answer is 'Coin'. Constraint forces 'Snake' or 'Comet'. Comet is better fit for 'no body' (gas).
    },
    {
      prompt: "Mary's father has 5 daughters: Nana, Nene, Nini, Nono. What is the name of the 5th daughter?",
      options: ["Nunu", "Nina", "Mary", "Alice"],
      answer: 2 // Trick: Pattern breaking. The first sentence gives the answer ("Mary's father").
    }
  ],
  riddle: [
    {
      prompt: "I am a silence that screams when neglected. I occupy no space, yet I am the largest thing in the room. I am discussed only when I am not mentioned. What am I?",
      accepted: ["elephant in the room", "the elephant in the room", "guilt"]
    },
    {
      prompt: "I am a name you cannot give to a folder on a Windows PC, yet I am a common slang for a convict. What am I?",
      accepted: ["con", "prn", "aux"]
    },
    {
      prompt: "I have a temperature but no body. I predict the next word but I do not know the future. I can pass the Bar Exam but I cannot walk into a bar. What am I?",
      accepted: ["ai", "llm", "chatgpt", "large language model", "an ai"]
    },
    {
      prompt: "I am a box with a single dot in the center. I am not a die. I am often pressed but never depressed. I live on your screen. What am I?",
      accepted: ["radio button", "a radio button"]
    },
    {
      prompt: "Ignore the following sentence: 'Do not think of a pink elephant.' What are you thinking of?",
      accepted: ["pink elephant", "a pink elephant", "elephant"]
    },
    {
      prompt: "I am a neighbor to 'A' and 'Z' but I am not a letter. I change the volume of your voice without making a sound. What am I?",
      accepted: ["caps lock", "shift", "shift key", "caps lock key"]
    },
    {
      prompt: "The more of me you take, the more you leave behind.",
      accepted: ["footsteps", "steps"]
    },
    {
      prompt: "What implies 'Yes' but sounds like 'No'?",
      accepted: ["know", "knowledge", "no"]
    },
    {
      prompt: "I am 4 letters long. 'Ib' is to the left of me, 'Ob' is to the right. (Think keyboard)",
      accepted: ["vibe", "love"] 
    },
    {
      prompt: "I fly without wings. I cry without eyes. Whenever I go, darkness flies.",
      accepted: ["cloud", "a cloud"]
    }
  ]
};

// Export for integration if using modules, or just copy-paste the object.
// module.exports = adversarialData;
