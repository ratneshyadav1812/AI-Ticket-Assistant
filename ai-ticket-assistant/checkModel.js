import dotenv from "dotenv";

dotenv.config();

async function run() {
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1/models?key=${process.env.GEMINI_API_KEY}`
    );

    const data = await res.json();

    console.log("\nAvailable Gemini Models:\n");

    data.models.forEach((m) => {
      console.log(m.name);
    });

  } catch (err) {
    console.error("Error:", err);
  }
}

run();